import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IHarvestReceipt extends Document {
  campaign: mongoose.Types.ObjectId;
  farm: mongoose.Types.ObjectId;
  plot: mongoose.Types.ObjectId;
  valve?: mongoose.Types.ObjectId | null;
  park?: mongoose.Types.ObjectId | null;
  variety: mongoose.Types.ObjectId;
  harvestedKg: number;
  weighingDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const harvestReceiptSchema = new Schema<IHarvestReceipt>(
  {
    campaign: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
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
    variety: {
      type: Schema.Types.ObjectId,
      ref: 'Variety',
      required: true,
      index: true,
    },
    harvestedKg: {
      type: Number,
      required: true,
      min: 0,
    },
    weighingDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const HarvestReceipt: Model<IHarvestReceipt> =
  mongoose.models.HarvestReceipt ||
  mongoose.model<IHarvestReceipt>('HarvestReceipt', harvestReceiptSchema);

export default HarvestReceipt;
