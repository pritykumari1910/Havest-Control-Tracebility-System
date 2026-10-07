import mongoose, { Document, Model, Schema } from 'mongoose';

export enum PlotStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export interface IPlot extends Document {
  parentFarm: mongoose.Types.ObjectId;
  plotName: string;
  plotCode: string;
  totalArea: number;
  avocadoVariety: string[];
  status: PlotStatus;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const plotSchema = new Schema<IPlot>(
  {
    parentFarm: {
      type: Schema.Types.ObjectId,
      ref: 'Farm',
      required: true,
      index: true,
    },
    plotName: {
      type: String,
      required: true,
      trim: true,
    },
    plotCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    totalArea: {
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
      enum: Object.values(PlotStatus),
      default: PlotStatus.ACTIVE,
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

// Prevent duplicate plot names under the same farm
plotSchema.index({ parentFarm: 1, plotName: 1 }, { unique: true });

const Plot: Model<IPlot> =
  mongoose.models.Plot || mongoose.model<IPlot>('Plot', plotSchema);

export default Plot;
