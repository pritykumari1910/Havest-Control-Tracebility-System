import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IReceptionBatch extends Document {
  batchCode: string;
  campaign: mongoose.Types.ObjectId;
  workDate: Date;
  machine: mongoose.Types.ObjectId;
  operator: mongoose.Types.ObjectId;
  status: 'open' | 'closed';
  openedBy: mongoose.Types.ObjectId;
  closedBy?: mongoose.Types.ObjectId | null;
  closedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const receptionBatchSchema = new Schema<IReceptionBatch>(
  {
    batchCode: { type: String, required: true, unique: true, trim: true, index: true },
    campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    workDate: { type: Date, required: true, default: Date.now, index: true },
    machine: { type: Schema.Types.ObjectId, ref: 'Machine', required: true, index: true },
    operator: { type: Schema.Types.ObjectId, ref: 'MachineOperator', required: true, index: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
    openedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    closedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const ReceptionBatch: Model<IReceptionBatch> =
  mongoose.models.ReceptionBatch || mongoose.model<IReceptionBatch>('ReceptionBatch', receptionBatchSchema);

export default ReceptionBatch;
