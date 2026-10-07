import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IHarvestReceiptScan extends Document {
  receptionBatch: mongoose.Types.ObjectId;
  qrInventory: mongoose.Types.ObjectId;
  qrCode: string;
  scannedBy: mongoose.Types.ObjectId;
  scannedAt: Date;
  campaign: mongoose.Types.ObjectId;
  harvestAssignment: mongoose.Types.ObjectId;
  crew: mongoose.Types.ObjectId;
  farm: mongoose.Types.ObjectId;
  plot: mongoose.Types.ObjectId;
  valve?: mongoose.Types.ObjectId | null;
  workZone?: string;
  variety: mongoose.Types.ObjectId;
  machine?: mongoose.Types.ObjectId | null;
  operator?: mongoose.Types.ObjectId | null;
  workDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const harvestReceiptScanSchema = new Schema<IHarvestReceiptScan>(
  {
    receptionBatch: { type: Schema.Types.ObjectId, ref: 'ReceptionBatch', required: true, index: true },
    qrInventory: { type: Schema.Types.ObjectId, ref: 'QrInventory', required: true, index: true },
    qrCode: { type: String, required: true, index: true },
    scannedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    scannedAt: { type: Date, required: true, default: Date.now },
    campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    harvestAssignment: { type: Schema.Types.ObjectId, ref: 'HarvestAssignment', required: true },
    crew: { type: Schema.Types.ObjectId, ref: 'Crew', required: true },
    farm: { type: Schema.Types.ObjectId, ref: 'Farm', required: true },
    plot: { type: Schema.Types.ObjectId, ref: 'Plot', required: true },
    valve: { type: Schema.Types.ObjectId, ref: 'Valve', default: null },
    workZone: { type: String, default: '' },
    variety: { type: Schema.Types.ObjectId, ref: 'Variety', required: true },
    machine: { type: Schema.Types.ObjectId, ref: 'Machine', default: null },
    operator: { type: Schema.Types.ObjectId, ref: 'SatelliteStaff', default: null },
    workDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const HarvestReceiptScan: Model<IHarvestReceiptScan> =
  mongoose.models.HarvestReceiptScan || mongoose.model<IHarvestReceiptScan>('HarvestReceiptScan', harvestReceiptScanSchema);

export default HarvestReceiptScan;
