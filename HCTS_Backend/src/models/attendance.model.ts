import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAttendance extends Document {
  crew: mongoose.Types.ObjectId;
  worker: mongoose.Types.ObjectId;
  workDate: Date;
  entryTime: Date;
  exitTime?: Date;
  shiftFraction: number;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    crew: {
      type: Schema.Types.ObjectId,
      ref: 'Crew',
      required: true,
      index: true,
    },
    worker: {
      type: Schema.Types.ObjectId,
      ref: 'Worker',
      required: true,
      index: true,
    },
    workDate: {
      type: Date,
      required: true,
      index: true,
    },
    entryTime: {
      type: Date,
      required: true,
    },
    exitTime: {
      type: Date,
      default: null,
    },
    shiftFraction: {
      type: Number,
      required: true,
      default: 1.0,
      min: 0.0,
      max: 1.0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure a worker has at most one attendance record per crew per work day
attendanceSchema.index({ crew: 1, worker: 1, workDate: 1 }, { unique: true });

const Attendance: Model<IAttendance> =
  mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', attendanceSchema);

export default Attendance;
