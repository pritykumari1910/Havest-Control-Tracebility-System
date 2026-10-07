import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type TeamCategory = 'farm_manager' | 'manijero' | 'collection_team' | 'loading_team' | 'system';

export interface IAuditLog extends Document {
  event: string;
  entityType?: string;
  entityId?: string | null;
  teamCategory?: TeamCategory | string | null;
  actorUserId?: Types.ObjectId | null;
  actorEmail?: string | null;
  actorRoles?: string[];
  targetUserId?: string | null;
  targetEmail?: string | null;
  method: string;
  path: string;
  statusCode: number;
  success: boolean;
  ip?: string | null;
  userAgent?: string | null;
  requestBody?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    event: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    entityType: {
      type: String,
      trim: true,
      default: null,
    },
    entityId: {
      type: String,
      default: null,
    },
    teamCategory: {
      type: String,
      enum: ['farm_manager', 'manijero', 'collection_team', 'loading_team', 'system'],
      default: 'system',
      index: true,
    },
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actorEmail: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    actorRoles: {
      type: [String],
      default: [],
    },
    targetUserId: {
      type: String,
      default: null,
    },
    targetEmail: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    method: {
      type: String,
      required: true,
      trim: true,
    },
    path: {
      type: String,
      required: true,
      trim: true,
    },
    statusCode: {
      type: Number,
      required: true,
    },
    success: {
      type: Boolean,
      required: true,
      index: true,
    },
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    requestBody: {
      type: Schema.Types.Mixed,
      default: {},
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ teamCategory: 1, createdAt: -1 });
auditLogSchema.index({ actorUserId: 1, createdAt: -1 });
auditLogSchema.index({ targetEmail: 1, createdAt: -1 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

export default AuditLog;
