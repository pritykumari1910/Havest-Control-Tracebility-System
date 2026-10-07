import mongoose, { Document, Model, Schema } from 'mongoose';

export enum BuyerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface IBuyer extends Document {
  name: string;
  internalCode: string;
  contactDetails?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  status: BuyerStatus;
  createdAt: Date;
  updatedAt: Date;
}

const buyerSchema = new Schema<IBuyer>(
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
      enum: Object.values(BuyerStatus),
      default: BuyerStatus.ACTIVE,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate hook to auto-generate internalCode
buyerSchema.pre('validate', function (this: any) {
  if (!this.internalCode) {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    this.internalCode = `BYR-${randomDigits}`;
  }
});

const Buyer: Model<IBuyer> =
  mongoose.models.Buyer || mongoose.model<IBuyer>('Buyer', buyerSchema);

export default Buyer;
