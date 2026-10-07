import mongoose, { Document, Model, Schema } from 'mongoose';

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  CLOSED = 'closed',
  HISTORICAL = 'historical'
}

export interface ICampaign extends Document {
  campaignName: string;
  campaignCode: string;
  startDate: Date;
  estimatedEndDate: Date;
  status: CampaignStatus;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaign>(
  {
    campaignName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    campaignCode: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    estimatedEndDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(CampaignStatus),
      default: CampaignStatus.DRAFT,
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

const Campaign: Model<ICampaign> =
  mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', campaignSchema);

export default Campaign;
