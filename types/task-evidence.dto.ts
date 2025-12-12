import { Types } from 'mongoose';
import { TaskFrequency, TaskPriority, TaskStatus } from '../models/TaskEvidence';

// DTO for search query parameters
export interface SearchTaskEvidenceDto {
  page?: number;
  limit?: number;
  search?: TaskEvidenceSearchFilters;
  sort?: Record<string, 1 | -1>;
  populate?: PopulateOption[];
}

// Search filters interface
export interface TaskEvidenceSearchFilters {
  // ObjectId fields
  taskId?: Types.ObjectId | { $in: Types.ObjectId[] };
  assignedTo?: Types.ObjectId | { $in: Types.ObjectId[] };
  roleId?: Types.ObjectId | { $in: Types.ObjectId[] };
  unitIds?: Types.ObjectId | { $in: Types.ObjectId[] };
  userId?: Types.ObjectId | { $in: Types.ObjectId[] };

  // String fields
  taskName?: string | { $regex: string; $options?: string };
  description?: string | { $regex: string; $options?: string };
  status?: TaskStatus | { $in: TaskStatus[] };
  priority?: TaskPriority | { $in: TaskPriority[] };
  taskFrequency?: TaskFrequency | { $in: TaskFrequency[] };

  // Number/Date fields
  createdAt?: number | { $gte?: number; $lte?: number; $gt?: number; $lt?: number };
  updatedAt?: number | { $gte?: number; $lte?: number; $gt?: number; $lt?: number };
  scheduledDateTime?: number | { $gte?: number; $lte?: number };
  startDateTime?: number | { $gte?: number; $lte?: number };
  endDateTime?: number | { $gte?: number; $lte?: number };

  // Array fields
  weekDays?: string | { $in: string[] };
  weekDaysForMonthly?: string | { $in: string[] };
  monthWeeks?: string | { $in: string[] };

  // Nested interval fields
  'taskIntervals.status'?: string | { $in: string[] };
  'taskIntervals.start'?: number | { $gte?: number; $lte?: number };
  'taskIntervals.end'?: number | { $gte?: number; $lte?: number };
}

// Populate option interface
export interface PopulateOption {
  path: string;
  model?: string;
  select?: string;
  populate?: PopulateOption;
}

// Response type for paginated results
export interface PaginatedTaskEvidenceResponse<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
  pagingCounter: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  error?: string;
}

// Create TaskEvidence DTO
export interface CreateTaskEvidenceDto {
  taskId: string;
  taskName: string;
  description: string;
  priority?: TaskPriority;
  taskFrequency: TaskFrequency;
  scheduleType?: TaskFrequency;
  scheduledDateTime?: number;
  startDateTime?: number;
  endDateTime?: number;
  taskIntervals?: TaskIntervalDto[];
  weekDays?: string[];
  weekDaysForMonthly?: string[];
  monthWeeks?: string[];
  roleId: string;
  assignedTo: string[];
  unitIds?: string;
  status?: TaskStatus;
}

// Update TaskEvidence DTO
export interface UpdateTaskEvidenceDto extends Partial<CreateTaskEvidenceDto> {
  _id: string;
}

// Task Interval DTO
export interface TaskIntervalDto {
  start: number;
  end: number;
  interval?: string;
  submittedBy?: string;
  taskEvidenceUrl?: string;
  remarks?: string;
  status?: 'pending' | 'completed' | 'missed';
}

// Debug request DTO
export interface DebugTaskEvidenceDto {
  userId: string;
}
