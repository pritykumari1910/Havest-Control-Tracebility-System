import mongoose, { Document, Model, Schema } from 'mongoose';

export enum EmploymentCompanyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export interface IEmploymentCompany extends Document {
  companyName: string;
  taxId: string;
  contactPerson: string;
  phoneNumber: string;
  email?: string;
  status: EmploymentCompanyStatus;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const employmentCompanySchema = new Schema<IEmploymentCompany>(
  {
    companyName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    taxId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(EmploymentCompanyStatus),
      default: EmploymentCompanyStatus.ACTIVE,
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

const EmploymentCompany: Model<IEmploymentCompany> =
  mongoose.models.EmploymentCompany || mongoose.model<IEmploymentCompany>('EmploymentCompany', employmentCompanySchema);

export default EmploymentCompany;
