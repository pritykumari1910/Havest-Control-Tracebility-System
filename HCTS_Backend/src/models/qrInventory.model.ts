import mongoose, { Document, Model, Schema } from 'mongoose';

export enum QrInventoryStatus {
  GENERATED = 'Generated',
  AVAILABLE = 'Available',
  ASSIGNED = 'Assigned',
  USED = 'Used',
  SCANNED_AT_COLLECTION = 'Scanned at Collection Point',
  ASSIGNED_TO_DISPATCH = 'Assigned to Dispatch Note',
  DISPATCHED = 'Dispatched',
  RETURNED = 'Returned',
  DAMAGED = 'Damaged',
  LOST = 'Lost',
  CANCELLED = 'Cancelled',
}

export interface IQrInventoryHistory {
  status: QrInventoryStatus;
  date: Date;
  updatedBy: mongoose.Types.ObjectId;
}

export interface IQrInventory extends Document {
  qrCode: string;
  qrNumber: number;
  series: mongoose.Types.ObjectId;
  status: QrInventoryStatus;
  harvestAssignmentId?: string | null;
  history: IQrInventoryHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const qrInventorySchema = new Schema<IQrInventory>(
  {
    qrCode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    qrNumber: {
      type: Number,
      required: true,
      index: true,
    },
    series: {
      type: Schema.Types.ObjectId,
      ref: 'QrSeries',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(QrInventoryStatus),
      default: QrInventoryStatus.GENERATED,
      index: true,
    },
    harvestAssignmentId: {
      type: String,
      default: null,
      index: true,
    },
    history: [
      {
        status: {
          type: String,
          enum: Object.values(QrInventoryStatus),
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Define compound unique indexes to allow identical QR codes/numbers in different series
qrInventorySchema.index({ qrCode: 1, series: 1 }, { unique: true });
qrInventorySchema.index({ qrNumber: 1, series: 1 }, { unique: true });

const QrInventory: Model<IQrInventory> =
  mongoose.models.QrInventory || mongoose.model<IQrInventory>('QrInventory', qrInventorySchema);

// Drop old single indexes if they exist to avoid unique constraint issues
if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
  mongoose.connection.db.collection('qrinventories').dropIndex('qrCode_1').catch(() => {});
  mongoose.connection.db.collection('qrinventories').dropIndex('qrNumber_1').catch(() => {});
} else {
  mongoose.connection.once('open', () => {
    if (mongoose.connection.db) {
      mongoose.connection.db.collection('qrinventories').dropIndex('qrCode_1').catch(() => {});
      mongoose.connection.db.collection('qrinventories').dropIndex('qrNumber_1').catch(() => {});
    }
  });
}

export default QrInventory;
