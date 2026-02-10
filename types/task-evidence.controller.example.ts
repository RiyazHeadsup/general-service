import { Controller, Post, Req, Res, Body, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { TaskEvidenceService } from './task-evidence.service';
import {
  SearchTaskEvidenceDto,
  CreateTaskEvidenceDto,
  UpdateTaskEvidenceDto,
  DebugTaskEvidenceDto,
  ApiResponse,
  PaginatedTaskEvidenceResponse,
} from './task-evidence.dto';
import { TaskEvidenceDocument } from '../models/TaskEvidence';

@Controller('task-evidence')
export class TaskEvidenceController {
  constructor(private readonly taskEvidenceService: TaskEvidenceService) {}

  /**
   * Create a new task evidence
   */
  @Post('createTaskEvidence')
  async createTaskEvidence(
    @Body() createDto: CreateTaskEvidenceDto,
    @Res() res: Response,
  ): Promise<Response<ApiResponse<TaskEvidenceDocument>>> {
    try {
      const taskEvidence = await this.taskEvidenceService.create(createDto);

      return res.status(HttpStatus.CREATED).json({
        success: true,
        statusCode: HttpStatus.CREATED,
        message: 'TaskEvidence created successfully',
        data: taskEvidence,
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        error: error.message,
        message: 'Failed to create TaskEvidence',
      });
    }
  }

  /**
   * Search task evidences with pagination
   */
  @Post('searchTaskEvidence')
  async searchTaskEvidence(
    @Body() searchDto: SearchTaskEvidenceDto,
    @Res() res: Response,
  ): Promise<Response<ApiResponse<PaginatedTaskEvidenceResponse<TaskEvidenceDocument>>>> {
    try {
      const result = await this.taskEvidenceService.searchTaskEvidence(searchDto);

      return res.status(HttpStatus.OK).json({
        success: true,
        statusCode: HttpStatus.OK,
        data: result,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error.message,
      });
    }
  }

  /**
   * Update task evidence
   */
  @Post('updateTaskEvidence')
  async updateTaskEvidence(
    @Body() updateDto: UpdateTaskEvidenceDto,
    @Res() res: Response,
  ): Promise<Response<ApiResponse<TaskEvidenceDocument>>> {
    try {
      if (!updateDto._id) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'TaskEvidence ID is required',
        });
      }

      const taskEvidence = await this.taskEvidenceService.update(
        updateDto._id,
        updateDto,
      );

      if (!taskEvidence) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: 'TaskEvidence not found',
        });
      }

      return res.status(HttpStatus.OK).json({
        success: true,
        statusCode: HttpStatus.OK,
        message: 'TaskEvidence updated successfully',
        data: taskEvidence,
      });
    } catch (error) {
      return res.status(HttpStatus.CONFLICT).json({
        success: false,
        statusCode: HttpStatus.CONFLICT,
        error: error.message,
        message: 'Failed to update TaskEvidence',
      });
    }
  }

  /**
   * Delete task evidence
   */
  @Post('deleteTaskEvidence')
  async deleteTaskEvidence(
    @Body() body: { _id: string },
    @Res() res: Response,
  ): Promise<Response<ApiResponse<TaskEvidenceDocument>>> {
    try {
      const { _id } = body;

      if (!_id) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'TaskEvidence ID is required',
        });
      }

      const taskEvidence = await this.taskEvidenceService.delete(_id);

      if (!taskEvidence) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: 'TaskEvidence not found',
        });
      }

      return res.status(HttpStatus.OK).json({
        success: true,
        statusCode: HttpStatus.OK,
        message: 'TaskEvidence deleted successfully',
        data: taskEvidence,
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        error: error.message,
      });
    }
  }

  /**
   * Debug endpoint to check task evidence data
   */
  @Post('debugTaskEvidence')
  async debugTaskEvidence(
    @Body() debugDto: DebugTaskEvidenceDto,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      if (!debugDto.userId) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'userId is required',
        });
      }

      const debugInfo = await this.taskEvidenceService.debugTaskEvidence(
        debugDto.userId,
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        statusCode: HttpStatus.OK,
        data: debugInfo,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error.message,
      });
    }
  }
}
