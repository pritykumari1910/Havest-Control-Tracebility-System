import mongoose, { Document, Model, Schema } from 'mongoose';

export enum UnassignedBinFailureReason {
  NO_ASSIGNMENT = 'no_assignment',
  ASSIGNMENT_NOT_FOUND = 'assignment_not_found',
  CREW_INACTIVE = 'crew_inactive',
}

export enum UnassignedBinStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export interface IUnassignedBinAuditEntry {
  actor: mongoose.Types.ObjectId;
  action: string;
  at: Date;
  note?: string;
}

export interface IUnassignedBinQueue extends Document {
  qrCode: string;
  qrInventory: mongoose.Types.ObjectId;
  receptionBatch: mongoose.Types.ObjectId;
  scannedBy: mongoose.Types.ObjectId;
  scannedAt: Date;
  campaign: mongoose.Types.ObjectId;
  failureReason: UnassignedBinFailureReason;
  status: UnassignedBinStatus;
  resolvedBy?: mongoose.Types.ObjectId | null;
  resolvedAt?: Date | null;
  resolvedHarvestAssignment?: mongoose.Types.ObjectId | null;
  rejectionReason?: string | null;
  auditTrail: IUnassignedBinAuditEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const auditEntrySchema = new Schema<IUnassignedBinAuditEntry>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    at: { type: Date, required: true, default: Date.now },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const unassignedBinQueueSchema = new Schema<IUnassignedBinQueue>(
  {
    qrCode: { type: String, required: true, trim: true, index: true },
    qrInventory: { type: Schema.Types.ObjectId, ref: 'QrInventory', required: true, index: true },
    receptionBatch: { type: Schema.Types.ObjectId, ref: 'ReceptionBatch', required: true, index: true },
    scannedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    scannedAt: { type: Date, required: true, default: Date.now, index: true },
    campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    failureReason: {
      type: String,
      enum: Object.values(UnassignedBinFailureReason),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(UnassignedBinStatus),
      default: UnassignedBinStatus.PENDING,
      index: true,
    },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
    resolvedHarvestAssignment: { type: Schema.Types.ObjectId, ref: 'HarvestAssignment', default: null },
    rejectionReason: { type: String, default: null },
    auditTrail: { type: [auditEntrySchema], default: [] },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate pending entries for the same QR
unassignedBinQueueSchema.index({ qrCode: 1, status: 1 });

const UnassignedBinQueue: Model<IUnassignedBinQueue> =
  mongoose.models.UnassignedBinQueue ||
  mongoose.model<IUnassignedBinQueue>('UnassignedBinQueue', unassignedBinQueueSchema);

export default UnassignedBinQueue;
