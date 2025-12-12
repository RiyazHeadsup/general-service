import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, PaginateModel, PaginateOptions, PaginateResult } from 'mongoose';
import {
  SearchTaskEvidenceDto,
  CreateTaskEvidenceDto,
  UpdateTaskEvidenceDto,
  TaskEvidenceSearchFilters,
  PaginatedTaskEvidenceResponse,
} from './task-evidence.dto';
import { TaskEvidence, TaskEvidenceDocument } from '../models/TaskEvidence';

@Injectable()
export class TaskEvidenceService {
  constructor(
    @InjectModel(TaskEvidence.name)
    private taskEvidenceModel: PaginateModel<TaskEvidenceDocument>,
  ) {}

  /**
   * Create a new task evidence
   */
  async create(createDto: CreateTaskEvidenceDto): Promise<TaskEvidenceDocument> {
    const taskEvidence = new this.taskEvidenceModel(createDto);
    return await taskEvidence.save();
  }

  /**
   * Search task evidences with pagination and filters
   */
  async searchTaskEvidence(
    searchDto: SearchTaskEvidenceDto,
  ): Promise<PaginateResult<TaskEvidenceDocument>> {
    console.log('\n========== SEARCH TASK EVIDENCE DEBUG ==========');
    console.log('📥 Original Request:', JSON.stringify(searchDto, null, 2));

    // Set up pagination options
    const options: PaginateOptions = {
      page: searchDto.page || 1,
      limit: searchDto.limit || 10,
      sort: searchDto.sort || { createdAt: -1 },
      populate: searchDto.populate || [
        { path: 'taskId', model: 'Task' },
        { path: 'userId', model: 'User' },
        { path: 'roleId', model: 'Role' },
        { path: 'assignedTo', model: 'User' },
      ],
    };

    // Convert string IDs to ObjectIds in search filters
    const query = this.convertSearchFiltersToQuery(searchDto.search || {});

    console.log('✨ Query After Conversion:', JSON.stringify(query, null, 2));
    console.log('⚙️  Pagination Options:', JSON.stringify(options, null, 2));

    // Get total count
    const totalCount = await this.taskEvidenceModel.countDocuments({});
    console.log(`📊 Total TaskEvidence in DB: ${totalCount}`);

    // Get count with filters
    const matchCount = await this.taskEvidenceModel.countDocuments(query);
    console.log(`🎯 Matching documents for this query: ${matchCount}`);

    // Execute paginated query
    const result = await this.taskEvidenceModel.paginate(query, options);
    console.log(`📦 Results: ${result.docs.length} documents returned`);
    console.log('========================================\n');

    return result;
  }

  /**
   * Convert search filters to MongoDB query with proper ObjectId conversion
   */
  private convertSearchFiltersToQuery(
    filters: TaskEvidenceSearchFilters,
  ): Record<string, any> {
    const query: Record<string, any> = {};

    console.log('🔍 Converting Filters to Query...');

    // ObjectId fields that need conversion
    const objectIdFields = [
      'taskId',
      'assignedTo',
      'roleId',
      'unitIds',
      'userId',
    ] as const;

    // Convert each filter
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      // Handle ObjectId fields
      if (objectIdFields.includes(key as any)) {
        query[key] = this.convertToObjectId(value, key);
      } else {
        // Non-ObjectId fields - pass through
        query[key] = value;
      }
    });

    return query;
  }

  /**
   * Convert string IDs to ObjectIds, handling both direct values and $in arrays
   */
  private convertToObjectId(
    value: any,
    fieldName: string,
  ): Types.ObjectId | { $in: Types.ObjectId[] } | any {
    // Handle $in operator with array
    if (value && typeof value === 'object' && '$in' in value && Array.isArray(value.$in)) {
      console.log(`🔄 Converting ${fieldName}.$in from strings to ObjectIds...`);
      const converted = value.$in.map((id: string) => {
        try {
          const objectId = new Types.ObjectId(id);
          console.log(`   ✅ Converted: "${id}" → ObjectId("${objectId}")`);
          return objectId;
        } catch (e) {
          console.log(`   ❌ Failed to convert: "${id}" - ${e.message}`);
          return id;
        }
      });
      return { $in: converted };
    }

    // Handle direct string value
    if (typeof value === 'string') {
      console.log(`🔄 Converting ${fieldName} from string to ObjectId...`);
      try {
        const objectId = new Types.ObjectId(value);
        console.log(`   ✅ Converted ${fieldName}: "${value}" → ObjectId("${objectId}")`);
        return objectId;
      } catch (e) {
        console.log(`   ❌ Failed to convert ${fieldName}: ${e.message}`);
        return value;
      }
    }

    // Already an ObjectId or other type
    return value;
  }

  /**
   * Update task evidence
   */
  async update(
    id: string,
    updateDto: UpdateTaskEvidenceDto,
  ): Promise<TaskEvidenceDocument | null> {
    console.log('UpdateTaskEvidence DTO:', JSON.stringify(updateDto, null, 2));

    const updatedData = {
      ...updateDto,
      updatedAt: Date.now(),
    };

    const taskEvidence = await this.taskEvidenceModel.findByIdAndUpdate(
      id,
      updatedData,
      { new: true },
    );

    if (taskEvidence) {
      console.log('Updated TaskEvidence:', JSON.stringify(taskEvidence, null, 2));
    }

    return taskEvidence;
  }

  /**
   * Delete task evidence
   */
  async delete(id: string): Promise<TaskEvidenceDocument | null> {
    console.log('DeleteTaskEvidence ID:', id);

    const taskEvidence = await this.taskEvidenceModel.findByIdAndDelete(id);

    if (taskEvidence) {
      console.log('Deleted TaskEvidence:', id);
    }

    return taskEvidence;
  }

  /**
   * Debug task evidence for a specific user
   */
  async debugTaskEvidence(userId: string): Promise<any> {
    console.log('\n========== DEBUG TASK EVIDENCE ==========');
    console.log('Checking for userId:', userId);

    const objectId = new Types.ObjectId(userId);
    console.log('Converted to ObjectId:', objectId);

    // Get all task evidences for this user
    const allForUser = await this.taskEvidenceModel
      .find({ assignedTo: objectId })
      .select('taskName createdAt assignedTo status')
      .limit(10)
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Found ${allForUser.length} TaskEvidences for this user`);

    // Get some sample data with createdAt timestamps
    const samples = allForUser.slice(0, 5).map((doc: any) => ({
      _id: doc._id,
      taskName: doc.taskName,
      createdAt: doc.createdAt,
      createdAtDate: new Date(doc.createdAt).toISOString(),
      assignedTo: doc.assignedTo,
      status: doc.status,
    }));

    console.log('Sample data:', JSON.stringify(samples, null, 2));

    // Get min and max createdAt
    const minMax = await this.taskEvidenceModel.aggregate([
      { $match: { assignedTo: objectId } },
      {
        $group: {
          _id: null,
          minCreatedAt: { $min: '$createdAt' },
          maxCreatedAt: { $max: '$createdAt' },
        },
      },
    ]);

    console.log('========================================\n');

    return {
      totalCount: allForUser.length,
      samples: samples,
      dateRange: minMax[0]
        ? {
            earliest: {
              timestamp: minMax[0].minCreatedAt,
              date: new Date(minMax[0].minCreatedAt).toISOString(),
            },
            latest: {
              timestamp: minMax[0].maxCreatedAt,
              date: new Date(minMax[0].maxCreatedAt).toISOString(),
            },
          }
        : null,
    };
  }

  /**
   * Find one task evidence by ID
   */
  async findById(id: string): Promise<TaskEvidenceDocument | null> {
    return await this.taskEvidenceModel.findById(id);
  }

  /**
   * Find task evidences by multiple filters
   */
  async findMany(filters: TaskEvidenceSearchFilters): Promise<TaskEvidenceDocument[]> {
    const query = this.convertSearchFiltersToQuery(filters);
    return await this.taskEvidenceModel.find(query);
  }
}
