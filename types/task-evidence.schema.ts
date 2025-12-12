import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';

// 🔹 Interval status enum
export enum IntervalStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  MISSED = 'missed',
}

// 🔹 Task frequency enum
export enum TaskFrequency {
  ONCE = 'once',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

// 🔹 Priority enum
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

// 🔹 Task status enum
export enum TaskStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  MISSED = 'missed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

// 🔹 Embedded schema for each interval
@Schema({ _id: false })
export class TaskInterval {
  @Prop({ type: Number, required: true })
  start: number;

  @Prop({ type: Number, required: true })
  end: number;

  @Prop({ type: String, required: false })
  interval: string;

  @Prop({ type: String, required: false })
  submittedBy: string;

  @Prop({ type: String, required: false })
  taskEvidenceUrl: string;

  @Prop({ type: String, required: false })
  remarks: string;

  @Prop({
    type: String,
    default: IntervalStatus.PENDING,
    enum: Object.values(IntervalStatus),
  })
  status: IntervalStatus;
}

export const TaskIntervalSchema = SchemaFactory.createForClass(TaskInterval);

// 🔹 Main TaskEvidence schema
@Schema({
  timestamps: true,
  collection: 'tasksevidence',
})
export class TaskEvidence {
  // ✅ Reference to original task
  @Prop({ type: Types.ObjectId, ref: 'Task', required: true, index: true })
  taskId: Types.ObjectId;

  // ✅ Basic Information
  @Prop({ required: true, trim: true })
  taskName: string;

  @Prop({ type: String, trim: true, required: true })
  description: string;

  @Prop({
    type: String,
    enum: Object.values(TaskPriority),
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  // ✅ Scheduling Information
  @Prop({
    type: String,
    enum: Object.values(TaskFrequency),
    required: true,
    index: true,
  })
  taskFrequency: TaskFrequency;

  @Prop({
    type: String,
    enum: Object.values(TaskFrequency),
  })
  scheduleType: TaskFrequency;

  // ✅ Universal Schedule Fields
  @Prop({ type: Number, required: false })
  scheduledDateTime: number;

  @Prop({ type: Number, required: false })
  startDateTime: number;

  @Prop({ type: Number, required: false })
  endDateTime: number;

  // ✅ Time Intervals
  @Prop({ type: [TaskIntervalSchema], default: [] })
  taskIntervals: TaskInterval[];

  // ✅ Weekly Configuration
  @Prop({ type: [String], default: [] })
  weekDays: string[];

  // ✅ Monthly Configuration
  @Prop({ type: [String], default: [] })
  weekDaysForMonthly: string[];

  @Prop({ type: [String], default: [] })
  monthWeeks: string[];

  // ✅ Assignment Information
  @Prop({ type: Types.ObjectId, ref: 'Role', required: true, index: true })
  roleId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'User', required: true, index: true })
  assignedTo: Types.ObjectId[];

  // ✅ System Information
  @Prop({
    type: Types.ObjectId,
    ref: 'Unit',
    required: false,
  })
  unitIds: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(TaskStatus),
    default: TaskStatus.PENDING,
    index: true,
  })
  status: TaskStatus;

  // ✅ Legacy fields (for backward compatibility)
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: String, trim: true })
  evidenceUrl: string;

  @Prop({ type: String, trim: true })
  location: string;

  @Prop({ type: Number, default: () => Date.now() })
  submittedAt: number;

  // ✅ Timestamps
  @Prop({ type: Number, default: () => Date.now() })
  createdAt: number;

  @Prop({ type: Number, default: () => Date.now() })
  updatedAt: number;
}

// 🔹 Export schema and document type
export type TaskEvidenceDocument = TaskEvidence & Document;
export const TaskEvidenceSchema = SchemaFactory.createForClass(TaskEvidence);

// 🔹 Apply mongoose-paginate-v2 plugin
TaskEvidenceSchema.plugin(mongoosePaginate);

// 🔹 Indexes for fast queries
TaskEvidenceSchema.index({ taskId: 1 });
TaskEvidenceSchema.index({ assignedTo: 1, status: 1 });
TaskEvidenceSchema.index({ roleId: 1, status: 1 });
TaskEvidenceSchema.index({ taskFrequency: 1, status: 1 });
TaskEvidenceSchema.index({ createdAt: -1 });
TaskEvidenceSchema.index({ scheduledDateTime: 1 });
TaskEvidenceSchema.index({ startDateTime: 1 });
TaskEvidenceSchema.index({ endDateTime: 1 });
TaskEvidenceSchema.index({ 'taskIntervals.start': 1 });
TaskEvidenceSchema.index({ 'taskIntervals.status': 1 });
TaskEvidenceSchema.index({ unitIds: 1 });
TaskEvidenceSchema.index({ priority: 1 });

// 🔹 Pre-save middleware to update timestamp
TaskEvidenceSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// 🔹 Pre-update middleware to update timestamp
TaskEvidenceSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});
