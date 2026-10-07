import mongoose, { Document, Model, Schema } from 'mongoose';

export enum ParkStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export interface IPark extends Document {
  parentValve: mongoose.Types.ObjectId;
  parentPlot: mongoose.Types.ObjectId;
  parentFarm: mongoose.Types.ObjectId;
  parkName: string;
  parkCode: string;
  rowRange: string;
  area: number;
  avocadoVariety: string[];
  status: ParkStatus;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const parkSchema = new Schema<IPark>(
  {
    parentValve: {
      type: Schema.Types.ObjectId,
      ref: 'Valve',
      required: true,
      index: true,
    },
    parentPlot: {
      type: Schema.Types.ObjectId,
      ref: 'Plot',
      required: true,
      index: true,
    },
    parentFarm: {
      type: Schema.Types.ObjectId,
      ref: 'Farm',
      required: true,
      index: true,
    },
    parkName: {
      type: String,
      required: true,
      trim: true,
    },
    parkCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    rowRange: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: Number,
      required: true,
      min: 0,
    },
    avocadoVariety: {
      type: [String],
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ParkStatus),
      default: ParkStatus.ACTIVE,
      index: true,
    },
    comments: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate park names under the same valve
parkSchema.index({ parentValve: 1, parkName: 1 }, { unique: true });

const Park: Model<IPark> =
  mongoose.models.Park || mongoose.model<IPark>('Park', parkSchema);

export default Park;
