import mongoose, { Document, Model, Schema } from 'mongoose';
import validator from 'validator';

export interface ICompany extends Document {
  companyName: string;
  taxId: string | null;
  contactPerson: string;
  phoneNumber: string | null;
  email: string;
  comments: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CompanyModel extends Model<ICompany> {}

const companySchema = new Schema<ICompany, CompanyModel>(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    taxId: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
      unique: true,
      sparse: true,
    },

    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },

    phoneNumber: {
      type: String,
      trim: true,
      default: null,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      validate(value: string) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },

    comments: {
      type: String,
      trim: true,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Company: CompanyModel =
  (mongoose.models.Company as CompanyModel) ||
  mongoose.model<ICompany, CompanyModel>('Company', companySchema);

export default Company;