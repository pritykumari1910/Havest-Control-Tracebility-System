import mongoose, { Document, Model, Schema } from 'mongoose';

export enum MachineStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export interface IMachine extends Document {
  internalCode: string;
  name: string;
  machineType: string;
  licensePlateOrInternalId?: string;
  status: MachineStatus;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const machineSchema = new Schema<IMachine>(
  {
    internalCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    machineType: {
      type: String,
      required: true,
      trim: true,
    },
    licensePlateOrInternalId: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(MachineStatus),
      default: MachineStatus.ACTIVE,
      index: true,
    },
    comments: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Machine: Model<IMachine> =
  mongoose.models.Machine || mongoose.model<IMachine>('Machine', machineSchema);

export default Machine;
