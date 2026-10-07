import mongoose, { Document, Model, Schema } from 'mongoose';

export enum FarmStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export interface IFarm extends Document {
  farmName: string;
  internalCode: string;
  totalHectares: number;
  status: FarmStatus;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const farmSchema = new Schema<IFarm>(
  {
    farmName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    internalCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    totalHectares: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(FarmStatus),
      default: FarmStatus.ACTIVE,
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

const Farm: Model<IFarm> =
  mongoose.models.Farm || mongoose.model<IFarm>('Farm', farmSchema);

export default Farm;
