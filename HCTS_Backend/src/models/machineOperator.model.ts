import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMachineOperator extends Document {
  machine: mongoose.Types.ObjectId;
  worker: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const machineOperatorSchema = new Schema<IMachineOperator>(
  {
    machine: {
      type: Schema.Types.ObjectId,
      ref: 'Machine',
      required: true,
      index: true,
    },
    worker: {
      type: Schema.Types.ObjectId,
      ref: 'Worker',
      required: true,
      index: true,
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

// Prevent duplicate assignment of the same worker to the same machine
machineOperatorSchema.index({ machine: 1, worker: 1 }, { unique: true });

const MachineOperator: Model<IMachineOperator> =
  mongoose.models.MachineOperator || mongoose.model<IMachineOperator>('MachineOperator', machineOperatorSchema);

export default MachineOperator;
