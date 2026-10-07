import mongoose, { Document, Model, Schema } from 'mongoose';

export enum CrewStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  CLOSED = 'closed',
}

export interface ICrew extends Document {
  campaign: mongoose.Types.ObjectId;
  workDate: Date;
  crewName: string;
  crewCode: string;
  assignedPickers: mongoose.Types.ObjectId[];
  leader?: mongoose.Types.ObjectId;
  supervisor: mongoose.Types.ObjectId;
  status: CrewStatus;
  createdAt: Date;
  updatedAt: Date;
}

const crewSchema = new Schema<ICrew>(
  {
    campaign: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    workDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    crewName: {
      type: String,
      required: true,
      trim: true,
    },
    crewCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    assignedPickers: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Worker' }],
      required: true,
      validate: {
        validator: (val: any[]) => val.length > 0,
        message: 'assignedPickers must contain at least one picker',
      },
    },
    leader: {
      type: Schema.Types.ObjectId,
      ref: 'Worker',
      default: null,
    },
    supervisor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(CrewStatus),
      default: CrewStatus.DRAFT,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Crew: Model<ICrew> = mongoose.models.Crew || mongoose.model<ICrew>('Crew', crewSchema);

export default Crew;
