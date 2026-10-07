import mongoose, { Document, Model, Schema } from 'mongoose';

export enum HarvestAssignmentStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
}

export interface IHarvestAssignment extends Document {
  campaign: mongoose.Types.ObjectId;
  workDate: Date;
  crew: mongoose.Types.ObjectId;
  farm: mongoose.Types.ObjectId;
  plot: mongoose.Types.ObjectId;
  valve?: mongoose.Types.ObjectId | null;
  park?: mongoose.Types.ObjectId | null;
  assignedRows?: string | null;
  specialZone?: string | null;
  zoneType: 'normal' | 'trial' | 'monitoring' | 'control' | 'other';
  variety: mongoose.Types.ObjectId;
  qrSeries: mongoose.Types.ObjectId;
  startQrNumber: number;
  endQrNumber: number;
  status: HarvestAssignmentStatus;
  comments?: string;
  varietyChanges?: {
    originalVariety: mongoose.Types.ObjectId;
    newVariety: mongoose.Types.ObjectId;
    changedAt: Date;
    changedBy: mongoose.Types.ObjectId;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const harvestAssignmentSchema = new Schema<IHarvestAssignment>(
  {
    campaign: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    workDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    crew: {
      type: Schema.Types.ObjectId,
      ref: 'Crew',
      required: true,
      index: true,
    },
    farm: {
      type: Schema.Types.ObjectId,
      ref: 'Farm',
      required: true,
      index: true,
    },
    plot: {
      type: Schema.Types.ObjectId,
      ref: 'Plot',
      required: true,
      index: true,
    },
    valve: {
      type: Schema.Types.ObjectId,
      ref: 'Valve',
      default: null,
      index: true,
    },
    park: {
      type: Schema.Types.ObjectId,
      ref: 'Park',
      default: null,
      index: true,
    },
    assignedRows: {
      type: String,
      default: null,
    },
    specialZone: {
      type: String,
      default: null,
    },
    zoneType: {
      type: String,
      enum: ['normal', 'trial', 'monitoring', 'control', 'other'],
      default: 'normal',
    },
    variety: {
      type: Schema.Types.ObjectId,
      ref: 'Variety',
      required: true,
      index: true,
    },
    qrSeries: {
      type: Schema.Types.ObjectId,
      ref: 'QrSeries',
      required: true,
      index: true,
    },
    startQrNumber: {
      type: Number,
      required: true,
    },
    endQrNumber: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(HarvestAssignmentStatus),
      default: HarvestAssignmentStatus.ACTIVE,
      index: true,
    },
    comments: {
      type: String,
      default: '',
    },
    varietyChanges: [
      {
        originalVariety: { type: Schema.Types.ObjectId, ref: 'Variety', required: true },
        newVariety: { type: Schema.Types.ObjectId, ref: 'Variety', required: true },
        changedAt: { type: Date, required: true, default: Date.now },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const HarvestAssignment: Model<IHarvestAssignment> =
  mongoose.models.HarvestAssignment ||
  mongoose.model<IHarvestAssignment>('HarvestAssignment', harvestAssignmentSchema);

export default HarvestAssignment;
