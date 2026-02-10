# TypeScript Types for TaskEvidence API

This directory contains TypeScript type definitions and example implementations for the TaskEvidence API endpoints.

## Files

### 1. `task-evidence.dto.ts`
Contains all Data Transfer Objects (DTOs) and interfaces:
- `SearchTaskEvidenceDto` - Request payload for searching task evidences
- `TaskEvidenceSearchFilters` - Filter options for search queries
- `PaginatedTaskEvidenceResponse<T>` - Response type for paginated results
- `CreateTaskEvidenceDto` - Request payload for creating task evidence
- `UpdateTaskEvidenceDto` - Request payload for updating task evidence
- `ApiResponse<T>` - Standard API response wrapper

### 2. `task-evidence.controller.example.ts`
NestJS controller example with proper TypeScript types showing:
- Typed request/response handlers
- Proper use of DTOs
- Error handling with typed responses
- HTTP status codes

### 3. `task-evidence.service.example.ts`
NestJS service example with mongoose-paginate-v2 integration showing:
- Typed service methods
- ObjectId conversion for query filters
- Pagination with PaginateModel
- Debug logging

## Usage

### For NestJS Projects

1. Install dependencies:
```bash
npm install --save-dev @types/mongoose @nestjs/mongoose
npm install mongoose mongoose-paginate-v2
```

2. Import the DTOs in your controller:
```typescript
import { SearchTaskEvidenceDto, ApiResponse } from './types/task-evidence.dto';
```

3. Use the typed controller pattern:
```typescript
@Post('searchTaskEvidence')
async searchTaskEvidence(
  @Body() searchDto: SearchTaskEvidenceDto,
  @Res() res: Response,
): Promise<Response<ApiResponse<PaginatedTaskEvidenceResponse<TaskEvidenceDocument>>>> {
  // Implementation
}
```

### For Express (JavaScript) Projects

Even if you're using JavaScript, you can still benefit from these types:

1. Add JSDoc comments to get TypeScript hints in your IDE:
```javascript
/**
 * @param {import('./types/task-evidence.dto').SearchTaskEvidenceDto} searchDto
 * @returns {Promise<import('./types/task-evidence.dto').PaginatedTaskEvidenceResponse>}
 */
async searchTaskEvidence(searchDto) {
  // Your implementation
}
```

## Key Features

### 1. ObjectId Conversion
The service automatically converts string IDs to MongoDB ObjectIds:
```typescript
// Input (from client)
{
  "assignedTo": { "$in": ["68e8fe27bf3e3cb1eaf0f7d9"] }
}

// Converted (for MongoDB query)
{
  assignedTo: { $in: [ObjectId("68e8fe27bf3e3cb1eaf0f7d9")] }
}
```

### 2. Pagination with mongoose-paginate-v2
```typescript
const result = await this.taskEvidenceModel.paginate(query, options);

// Result type:
{
  docs: TaskEvidenceDocument[],
  totalDocs: number,
  limit: number,
  page: number,
  totalPages: number,
  hasNextPage: boolean,
  hasPrevPage: boolean,
  nextPage: number | null,
  prevPage: number | null,
  pagingCounter: number
}
```

### 3. Type-Safe Search Filters
All search filters are properly typed:
```typescript
interface TaskEvidenceSearchFilters {
  assignedTo?: Types.ObjectId | { $in: Types.ObjectId[] };
  createdAt?: number | { $gte?: number; $lte?: number };
  status?: TaskStatus | { $in: TaskStatus[] };
  // ... and more
}
```

## Example Request Payloads

### Search with Pagination
```json
{
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
    },
    "status": "pending"
  },
  "sort": {
    "createdAt": -1
  },
  "populate": [
    { "path": "taskId", "model": "Task" },
    { "path": "assignedTo", "model": "User" }
  ]
}
```

### Create Task Evidence
```json
{
  "taskId": "67890abcdef123456",
  "taskName": "Daily Inspection",
  "description": "Perform daily equipment inspection",
  "priority": "high",
  "taskFrequency": "daily",
  "roleId": "12345abcdef67890",
  "assignedTo": ["68e8fe27bf3e3cb1eaf0f7d9"],
  "unitIds": "68596ea736f73571d352f7bc",
  "startDateTime": 1765477800000,
  "endDateTime": 1765564199000
}
```

### Update Task Evidence
```json
{
  "_id": "67890abcdef123456",
  "status": "completed",
  "taskIntervals": [
    {
      "start": 1765477800000,
      "end": 1765481400000,
      "status": "completed",
      "submittedBy": "68e8fe27bf3e3cb1eaf0f7d9",
      "taskEvidenceUrl": "https://example.com/evidence.jpg",
      "remarks": "Task completed successfully"
    }
  ]
}
```

## Migration Guide

### From JavaScript to TypeScript

1. Rename files from `.js` to `.ts`
2. Install TypeScript and types:
```bash
npm install --save-dev typescript @types/node @types/express @types/mongoose
```

3. Add `tsconfig.json`:
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules"]
}
```

4. Update your code to use types from this directory

## Benefits

- ✅ **Type Safety**: Catch errors at compile time
- ✅ **Better IDE Support**: Autocomplete and IntelliSense
- ✅ **Self-Documenting**: Types serve as documentation
- ✅ **Easier Refactoring**: Find all usages of types
- ✅ **Reduced Bugs**: Prevent common mistakes like wrong ObjectId types
