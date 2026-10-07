import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISatelliteRole extends Document {
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const satelliteRoleSchema = new Schema<ISatelliteRole>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const SatelliteRole: Model<ISatelliteRole> =
  mongoose.models.SatelliteRole || mongoose.model<ISatelliteRole>('SatelliteRole', satelliteRoleSchema);

export default SatelliteRole;
