import mongoose, { Document, Model, Schema } from 'mongoose';

export enum VarietyType {
  MAIN = 'Main',
  POLLINATOR = 'Pollinator',
  OTHER = 'Other'
}

export enum VarietyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export interface IVariety extends Document {
  varietyName: string;
  varietyCode: string;
  varietyType: VarietyType;
  otherVarietyType?: string;
  status: VarietyStatus;
  technicalComments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const varietySchema = new Schema<IVariety>(
  {
    varietyName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    varietyCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    varietyType: {
      type: String,
      enum: Object.values(VarietyType),
      required: true,
    },
    otherVarietyType: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(VarietyStatus),
      default: VarietyStatus.ACTIVE,
      index: true,
    },
    technicalComments: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Variety: Model<IVariety> =
  mongoose.models.Variety || mongoose.model<IVariety>('Variety', varietySchema);

export default Variety;
