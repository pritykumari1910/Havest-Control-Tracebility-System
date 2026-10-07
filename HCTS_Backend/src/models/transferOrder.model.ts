import mongoose, { Document, Model, Schema } from 'mongoose';

export enum TransferOrderStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  LOADED = 'loaded',
  DISPATCHED = 'dispatched',
  PARTIALLY_RECONCILED = 'partially_reconciled',
  RECONCILED = 'reconciled',
  CLOSED = 'closed',
}

export enum TransferOrderWeightStatus {
  PENDING_DEFINITIVE = 'pending_definitive',
  DEFINITIVE = 'definitive',
}

export interface ITransferOrder extends Document {
  transferOrderNumber: string;
  transferCode: string;
  loadingDate: Date;
  departureDateTime: Date;
  truckLicensePlate: string;
  driverName?: string | null;
  originCollectionPoint?: string | null;
  buyer: mongoose.Types.ObjectId;
  destination: mongoose.Types.ObjectId;
  transportProvider: mongoose.Types.ObjectId;
  dispatchNotes: mongoose.Types.ObjectId[];
  status: TransferOrderStatus;
  
  // Weight Tracking (2-Stage Logic)
  totalPallets: number;
  estimatedAvgWeightPerPallet: number;
  forecastedWeight: number;
  definitiveWeight?: number | null;
  definitiveAvgWeightPerPallet?: number | null;
  weightStatus: TransferOrderWeightStatus;

  createdAt: Date;
  updatedAt: Date;
}

const transferOrderSchema = new Schema<ITransferOrder>(
  {
    transferOrderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    transferCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    loadingDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    departureDateTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    truckLicensePlate: {
      type: String,
      required: false,
      default: 'TRK-001',
      trim: true,
    },
    driverName: {
      type: String,
      default: null,
      trim: true,
    },
    originCollectionPoint: {
      type: String,
      default: null,
      trim: true,
    },
    buyer: {
      type: Schema.Types.ObjectId,
      ref: 'Buyer',
      required: true,
      index: true,
    },
    destination: {
      type: Schema.Types.ObjectId,
      ref: 'DestinationCenter',
      required: true,
      index: true,
    },
    transportProvider: {
      type: Schema.Types.ObjectId,
      ref: 'TransportProvider',
      required: true,
      index: true,
    },
    dispatchNotes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'DispatchNote',
        required: true,
      },
    ],
    status: {
      type: String,
      enum: Object.values(TransferOrderStatus),
      default: TransferOrderStatus.OPEN,
      index: true,
    },
    totalPallets: {
      type: Number,
      required: true,
      default: 0,
    },
    estimatedAvgWeightPerPallet: {
      type: Number,
      required: true,
      default: 800,
    },
    forecastedWeight: {
      type: Number,
      required: true,
      default: 0,
    },
    definitiveWeight: {
      type: Number,
      default: null,
    },
    definitiveAvgWeightPerPallet: {
      type: Number,
      default: null,
    },
    weightStatus: {
      type: String,
      enum: Object.values(TransferOrderWeightStatus),
      default: TransferOrderWeightStatus.PENDING_DEFINITIVE,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate hook to auto-generate transferOrderNumber and transferCode
transferOrderSchema.pre('validate', function (this: any) {
  if (!this.transferCode) {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    this.transferCode = `TRF-${randomDigits}`;
  }
  if (!this.transferOrderNumber) {
    this.transferOrderNumber = this.transferCode;
  }
});

if (mongoose.models.TransferOrder) {
  delete mongoose.models.TransferOrder;
}

const TransferOrder: Model<ITransferOrder> =
  mongoose.models.TransferOrder ||
  mongoose.model<ITransferOrder>('TransferOrder', transferOrderSchema);

export default TransferOrder;
