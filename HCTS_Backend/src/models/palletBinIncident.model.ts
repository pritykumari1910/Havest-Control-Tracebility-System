import mongoose, { Document, Model, Schema } from 'mongoose';

export enum IncidentCategory {
  MISSING_QR_LABEL = 'missing_qr_label',
  DAMAGED_UNREADABLE_LABEL = 'damaged_unreadable_label',
  SINGLE_LABEL_PRESENT = 'single_label_present',
  DAMAGED_PALLET_BIN = 'damaged_pallet_bin',
  DAMAGED_DIRTY_FRUIT = 'damaged_dirty_fruit',
  MIXED_VARIETIES = 'mixed_varieties',
  PALLET_OUTSIDE_ASSIGNED_ZONE = 'pallet_outside_assigned_zone',
  HANDLING_ISSUE = 'handling_issue',
  OTHER = 'other',
}

export interface IPalletBinIncident extends Document {
  qrCode: string;
  qrInventory?: mongoose.Types.ObjectId | null;
  receptionBatch?: mongoose.Types.ObjectId | null;
  category: IncidentCategory;
  comments?: string;
  registeredBy: mongoose.Types.ObjectId;
  timestamp: Date;
  location?: {
    latitude?: number;
    longitude?: number;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

const palletBinIncidentSchema = new Schema<IPalletBinIncident>(
  {
    qrCode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    qrInventory: {
      type: Schema.Types.ObjectId,
      ref: 'QrInventory',
      default: null,
      index: true,
    },
    receptionBatch: {
      type: Schema.Types.ObjectId,
      ref: 'ReceptionBatch',
      default: null,
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(IncidentCategory),
      required: true,
      index: true,
    },
    comments: {
      type: String,
      trim: true,
      default: '',
    },
    registeredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
  },
  {
    timestamps: true,
  }
);

const PalletBinIncident: Model<IPalletBinIncident> =
  mongoose.models.PalletBinIncident ||
  mongoose.model<IPalletBinIncident>('PalletBinIncident', palletBinIncidentSchema);

export default PalletBinIncident;
