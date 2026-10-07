import mongoose, { Document, Model, Schema } from 'mongoose';

export enum TransportProviderStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface ITransportProvider extends Document {
  legalName: string;
  contactDetails?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  status: TransportProviderStatus;
  createdAt: Date;
  updatedAt: Date;
}

const transportProviderSchema = new Schema<ITransportProvider>(
  {
    legalName: {
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
      enum: Object.values(TransportProviderStatus),
      default: TransportProviderStatus.ACTIVE,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const TransportProvider: Model<ITransportProvider> =
  mongoose.models.TransportProvider ||
  mongoose.model<ITransportProvider>('TransportProvider', transportProviderSchema);

export default TransportProvider;
