import mongoose, { Document, Model, Schema } from 'mongoose';

export enum ForecastStatus {
  DRAFT = 'draft',
  VALIDATED = 'validated',
  CLOSED = 'closed',
  REVISED = 'revised',
}

export interface IHarvestForecast extends Document {
  campaign: mongoose.Types.ObjectId;
  farm: mongoose.Types.ObjectId;
  plot: mongoose.Types.ObjectId;
  valve?: mongoose.Types.ObjectId | null;
  park?: mongoose.Types.ObjectId | null;
  variety: mongoose.Types.ObjectId;
  surfaceArea: number; // in hectares (ha)
  estimatedKg: number;
  estimatedTonnes: number; // auto-calculated
  estimatedKgPerHa: number; // auto-calculated
  recordDate: Date;
  responsiblePerson: string;
  status: ForecastStatus;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const harvestForecastSchema = new Schema<IHarvestForecast>(
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
    surfaceArea: {
      type: Number,
      required: true,
      min: 0,
    },
    estimatedKg: {
      type: Number,
      required: true,
      min: 0,
    },
    estimatedTonnes: {
      type: Number,
      required: true,
      min: 0,
    },
    estimatedKgPerHa: {
      type: Number,
      required: true,
      min: 0,
    },
    recordDate: {
      type: Date,
      default: Date.now,
    },
    responsiblePerson: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(ForecastStatus),
      default: ForecastStatus.DRAFT,
      index: true,
    },
    comments: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate hook to calculate estimatedTonnes and estimatedKgPerHa
harvestForecastSchema.pre('validate', function (this: any) {
  if (this.estimatedKg !== undefined) {
    this.estimatedTonnes = this.estimatedKg / 1000;
  }
  if (this.estimatedKg !== undefined && this.surfaceArea > 0) {
    this.estimatedKgPerHa = this.estimatedKg / this.surfaceArea;
  } else {
    this.estimatedKgPerHa = 0;
  }
});

// Prevent duplicate campaign/farm/plot/valve/park/variety combination
harvestForecastSchema.index(
  { campaign: 1, farm: 1, plot: 1, valve: 1, park: 1, variety: 1 },
  { unique: true }
);

const HarvestForecast: Model<IHarvestForecast> =
  mongoose.models.HarvestForecast ||
  mongoose.model<IHarvestForecast>('HarvestForecast', harvestForecastSchema);

export default HarvestForecast;
