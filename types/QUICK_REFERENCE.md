# Quick Reference: Typed searchTaskEvidence Method

## The Exact Pattern You Asked For

### Controller Method with Types

```typescript
import { Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import {
  SearchTaskEvidenceDto,
  PaginatedTaskEvidenceResponse,
  ApiResponse,
} from './task-evidence.dto';
import { TaskEvidenceDocument } from './task-evidence.schema';

@Post('searchTaskEvidence')
async searchTaskEvidence(
  @Body() searchDto: SearchTaskEvidenceDto,
  @Res() res: Response,
): Promise<Response<ApiResponse<PaginatedTaskEvidenceResponse<TaskEvidenceDocument>>>> {
  return this.taskEvidenceService.findAllTaskEvidences(searchDto, res);
}
```

### Alternative: Without @Req (Cleaner)

```typescript
@Post('searchTaskEvidence')
async searchTaskEvidence(
  @Body() searchDto: SearchTaskEvidenceDto,
  @Res() res: Response,
): Promise<Response> {
  try {
    const result = await this.taskEvidenceService.searchTaskEvidence(searchDto);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: error.message,
    });
  }
}
```

### Service Method with mongoose-paginate-v2

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel, PaginateResult, PaginateOptions, Types } from 'mongoose';
import { TaskEvidence, TaskEvidenceDocument } from './task-evidence.schema';
import { SearchTaskEvidenceDto } from './task-evidence.dto';

@Injectable()
export class TaskEvidenceService {
  constructor(
    @InjectModel(TaskEvidence.name)
    private taskEvidenceModel: PaginateModel<TaskEvidenceDocument>,
  ) {}

  async searchTaskEvidence(
    searchDto: SearchTaskEvidenceDto,
  ): Promise<PaginateResult<TaskEvidenceDocument>> {
    // Pagination options
    const options: PaginateOptions = {
      page: searchDto.page || 1,
      limit: searchDto.limit || 10,
      sort: searchDto.sort || { createdAt: -1 },
      populate: searchDto.populate || [
        { path: 'taskId', model: 'Task' },
        { path: 'assignedTo', model: 'User' },
      ],
    };

    // Convert string IDs to ObjectIds
    const query = this.convertFilters(searchDto.search || {});

    // Execute paginated query
    return await this.taskEvidenceModel.paginate(query, options);
  }

  private convertFilters(filters: any): any {
    const query: any = {};

    // Convert assignedTo
    if (filters.assignedTo?.$in) {
      query.assignedTo = {
        $in: filters.assignedTo.$in.map((id: string) => new Types.ObjectId(id)),
      };
    }

    // Convert unitIds
    if (filters.unitIds && typeof filters.unitIds === 'string') {
      query.unitIds = new Types.ObjectId(filters.unitIds);
    }

    // Pass through other filters
    if (filters.createdAt) {
      query.createdAt = filters.createdAt;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    return query;
  }
}
```

## Key Types Explained

### 1. Request DTO (Input)
```typescript
interface SearchTaskEvidenceDto {
  page?: number;              // Page number (default: 1)
  limit?: number;             // Items per page (default: 10)
  search?: {                  // Search filters
    assignedTo?: { $in: string[] };
    unitIds?: string;
    createdAt?: { $gte: number; $lte: number };
    status?: string;
  };
  sort?: { [key: string]: 1 | -1 };  // Sort order
  populate?: Array<{ path: string; model: string }>;  // Relations to populate
}
```

### 2. Response Type (Output)
```typescript
interface PaginatedTaskEvidenceResponse<T> {
  docs: T[];                  // Array of documents
  totalDocs: number;          // Total documents matching query
  limit: number;              // Items per page
  page: number;               // Current page
  totalPages: number;         // Total number of pages
  hasNextPage: boolean;       // Has next page?
  hasPrevPage: boolean;       // Has previous page?
  nextPage: number | null;    // Next page number
  prevPage: number | null;    // Previous page number
  pagingCounter: number;      // Starting serial number
}
```

### 3. Document Type
```typescript
type TaskEvidenceDocument = TaskEvidence & Document;
```

## Installation

### For NestJS with TypeScript

```bash
# Install dependencies
npm install mongoose mongoose-paginate-v2
npm install --save-dev @types/mongoose @types/mongoose-paginate-v2

# If using NestJS
npm install @nestjs/mongoose
```

### Update your module

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskEvidence, TaskEvidenceSchema } from './task-evidence.schema';
import { TaskEvidenceService } from './task-evidence.service';
import { TaskEvidenceController } from './task-evidence.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TaskEvidence.name, schema: TaskEvidenceSchema },
    ]),
  ],
  controllers: [TaskEvidenceController],
  providers: [TaskEvidenceService],
})
export class TaskEvidenceModule {}
```

## Testing

### Sample Request

```bash
curl -X POST http://localhost:8073/generalservice/searchTaskEvidence \
  -H "Content-Type: application/json" \
  -d '{
    "page": 1,
    "limit": 10,
    "search": {
      "assignedTo": {
        "$in": ["68e8fe27bf3e3cb1eaf0f7d9"]
      },
      "unitIds": "68596ea736f73571d352f7bc",
      "createdAt": {
        "$gte": 1765477800000,
        "$lte": 1765564199000
      }
    }
  }'
```

### Sample Response

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "docs": [
      {
        "_id": "...",
        "taskName": "Daily Inspection",
        "description": "...",
        "assignedTo": [...],
        "createdAt": 1765500000000
      }
    ],
    "totalDocs": 25,
    "limit": 10,
    "page": 1,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false,
    "nextPage": 2,
    "prevPage": null,
    "pagingCounter": 1
  }
}
```

## Benefits of This Approach

✅ **Type Safety** - Catch errors at compile time
✅ **IDE Autocomplete** - IntelliSense for all fields
✅ **Self-Documenting** - Types serve as documentation
✅ **Pagination Built-in** - mongoose-paginate-v2 handles everything
✅ **ObjectId Conversion** - Automatic string to ObjectId conversion
✅ **Flexible Filtering** - Support for MongoDB operators ($in, $gte, etc.)
