import mongoose, { Document, Model, Schema } from 'mongoose';

export enum DestinationCenterStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface IDestinationCenter extends Document {
  name: string;
  internalCode: string;
  contactDetails?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  status: DestinationCenterStatus;
  createdAt: Date;
  updatedAt: Date;
}

const destinationCenterSchema = new Schema<IDestinationCenter>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    internalCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    contactDetails: {
      email: {
        type: String,
        trim: true,
        default: '',
      },
      phone: {
        type: String,
        trim: true,
        default: '',
      },
      address: {
        type: String,
        trim: true,
        default: '',
      },
    },
    status: {
      type: String,
      enum: Object.values(DestinationCenterStatus),
      default: DestinationCenterStatus.ACTIVE,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate hook to auto-generate internalCode
destinationCenterSchema.pre('validate', function (this: any) {
  if (!this.internalCode) {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    this.internalCode = `DST-${randomDigits}`;
  }
});

const DestinationCenter: Model<IDestinationCenter> =
  mongoose.models.DestinationCenter ||
  mongoose.model<IDestinationCenter>('DestinationCenter', destinationCenterSchema);

export default DestinationCenter;
