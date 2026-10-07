import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISatelliteStaff extends Document {
  campaign: mongoose.Types.ObjectId;
  workDate: Date;
  worker: mongoose.Types.ObjectId;
  employmentCompany?: mongoose.Types.ObjectId | null;
  satelliteRole: mongoose.Types.ObjectId;
  farm: mongoose.Types.ObjectId;
  plot?: mongoose.Types.ObjectId | null;
  valve?: mongoose.Types.ObjectId | null;
  workZone?: string;
  shiftType: 'full' | 'partial';
  shiftFraction: number;
  partialReason?: string;
  checkInTime?: Date | null;
  checkOutTime?: Date | null;
  registeredBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const satelliteStaffSchema = new Schema<ISatelliteStaff>(
  {
    campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    workDate: { type: Date, required: true, index: true },
    worker: { type: Schema.Types.ObjectId, ref: 'Worker', required: true, index: true },
    employmentCompany: { type: Schema.Types.ObjectId, ref: 'EmploymentCompany', default: null },
    satelliteRole: { type: Schema.Types.ObjectId, ref: 'SatelliteRole', required: true, index: true },
    farm: { type: Schema.Types.ObjectId, ref: 'Farm', required: true, index: true },
    plot: { type: Schema.Types.ObjectId, ref: 'Plot', default: null },
    valve: { type: Schema.Types.ObjectId, ref: 'Valve', default: null },
    workZone: { type: String, trim: true, default: '' },
    shiftType: { type: String, enum: ['full', 'partial'], default: 'full', required: true },
    shiftFraction: { type: Number, required: true, min: 0.0, max: 1.0, default: 1.0 },
    partialReason: { type: String, trim: true, default: '' },
    checkInTime: { type: Date, default: null },
    checkOutTime: { type: Date, default: null },
    registeredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

const SatelliteStaff: Model<ISatelliteStaff> =
  mongoose.models.SatelliteStaff || mongoose.model<ISatelliteStaff>('SatelliteStaff', satelliteStaffSchema);

export default SatelliteStaff;
