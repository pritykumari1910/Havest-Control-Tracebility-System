import mongoose, { Document, Model, Schema } from 'mongoose';

export enum DispatchNoteStatus {
  DRAFT = 'draft',
  CLOSED = 'closed',
  ASSOCIATED_TO_LOAD_ORDER = 'associated_to_load_order',
  DISPATCHED = 'dispatched',
  PENDING_BUYER_NOTE = 'pending_buyer_note',
  RECONCILED = 'reconciled',
}

export interface IDispatchNoteEditAuditEntry {
  actor: mongoose.Types.ObjectId;
  action: 'bin_added' | 'bin_removed';
  binId: mongoose.Types.ObjectId;
  qrCode: string;
  at: Date;
  reason: string;
}

export interface IDispatchNote extends Document {
  internalNoteNumber: string;
  dispatchCode: string;
  campaign: mongoose.Types.ObjectId;
  noteDate: Date;
  buyer: mongoose.Types.ObjectId;
  destination: mongoose.Types.ObjectId;
  status: DispatchNoteStatus;
  bins: mongoose.Types.ObjectId[];
  isAssociatedWithBuyerDeliveryNote: boolean;
  lockedAt?: Date | null;
  lockedBy?: mongoose.Types.ObjectId | null;
  editAuditTrail: IDispatchNoteEditAuditEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const editAuditEntrySchema = new Schema<IDispatchNoteEditAuditEntry>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ['bin_added', 'bin_removed'], required: true },
    binId: { type: Schema.Types.ObjectId, ref: 'HarvestReceiptScan', required: true },
    qrCode: { type: String, required: true },
    at: { type: Date, required: true, default: Date.now },
    reason: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const dispatchNoteSchema = new Schema<IDispatchNote>(
  {
    internalNoteNumber: {
      type: String,
      unique: true,
      trim: true,
      index: true,
    },
    dispatchCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    campaign: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    noteDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
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
    status: {
      type: String,
      enum: Object.values(DispatchNoteStatus),
      default: DispatchNoteStatus.DRAFT,
      index: true,
    },
    bins: [
      {
        type: Schema.Types.ObjectId,
        ref: 'HarvestReceiptScan',
      },
    ],
    isAssociatedWithBuyerDeliveryNote: {
      type: Boolean,
      default: false,
      index: true,
    },
    lockedAt: {
      type: Date,
      default: null,
    },
    lockedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    editAuditTrail: {
      type: [editAuditEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate internalNoteNumber before validation
dispatchNoteSchema.pre('validate', async function (this: any) {
  if (!this.internalNoteNumber) {
    const count = await (mongoose.models.DispatchNote as Model<IDispatchNote>).countDocuments();
    let seq = count + 1;
    let candidate = `IDN-${seq.toString().padStart(4, '0')}`;
    // ensure uniqueness
    while (await (mongoose.models.DispatchNote as Model<IDispatchNote>).findOne({ internalNoteNumber: candidate })) {
      seq += 1;
      candidate = `IDN-${seq.toString().padStart(4, '0')}`;
    }
    this.internalNoteNumber = candidate;
  }
});

const DispatchNote: Model<IDispatchNote> =
  mongoose.models.DispatchNote ||
  mongoose.model<IDispatchNote>('DispatchNote', dispatchNoteSchema);

export default DispatchNote;
