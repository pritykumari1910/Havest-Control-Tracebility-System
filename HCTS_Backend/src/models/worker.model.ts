import mongoose, { Document, Model, Schema } from 'mongoose';

export enum DocumentIdType {
  DNI = 'DNI',
  NIE = 'NIE'
}

export enum WorkerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export interface IWorker extends Document {
  firstName: string;
  lastName: string;
  documentIdType: DocumentIdType;
  documentIdNumber: string;
  employmentCompany: mongoose.Types.ObjectId;
  phoneNumber?: string;
  email?: string;
  registrationDate: Date;
  status: WorkerStatus;
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const workerSchema = new Schema<IWorker>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    documentIdType: {
      type: String,
      enum: Object.values(DocumentIdType),
      required: true,
    },
    documentIdNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    employmentCompany: {
      type: Schema.Types.ObjectId,
      ref: 'EmploymentCompany',
      required: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: Object.values(WorkerStatus),
      default: WorkerStatus.ACTIVE,
      index: true,
    },
    qrCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Worker: Model<IWorker> =
  mongoose.models.Worker || mongoose.model<IWorker>('Worker', workerSchema);

export default Worker;