import mongoose, { Document, Model, Schema } from 'mongoose';

export enum ValveStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export interface IValve extends Document {
  parentPlot: mongoose.Types.ObjectId;
  parentFarm: mongoose.Types.ObjectId;
  valveName: string;
  valveCode: string;
  irrigationArea: number;
  avocadoVariety: string[];
  status: ValveStatus;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const valveSchema = new Schema<IValve>(
  {
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
    valveName: {
      type: String,
      required: true,
      trim: true,
    },
    valveCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    irrigationArea: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    avocadoVariety: {
      type: [String],
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ValveStatus),
      default: ValveStatus.ACTIVE,
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

// Prevent duplicate valve names under the same plot
valveSchema.index({ parentPlot: 1, valveName: 1 }, { unique: true });

const Valve: Model<IValve> =
  mongoose.models.Valve || mongoose.model<IValve>('Valve', valveSchema);

export default Valve;
