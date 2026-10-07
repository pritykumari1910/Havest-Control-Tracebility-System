import mongoose, { Document, Model, Schema } from 'mongoose';

export enum QrSeriesStatus {
  DRAFT = 'Draft',
  GENERATED = 'Generated',
  SENT_TO_PRINTER = 'Sent to Printer',
  RECEIVED = 'Received',
  ACTIVE = 'Active',
  EXHAUSTED = 'Exhausted',
  CANCELLED = 'Cancelled',
}

export enum PrinterStatus {
  SENT = 'sent',
  IN_PRODUCTION = 'in production',
  RECEIVED = 'received',
  WITH_ISSUE = 'with issue',
}

export interface IQrSeries extends Document {
  seriesName: string;
  startNumber: number;
  endNumber: number;
  initialCode: string;
  finalCode: string;
  totalQRs: number;
  status: QrSeriesStatus;
  comments?: string;
  generatingUser: mongoose.Types.ObjectId;
  generationDate: Date;
  printerOrder?: {
    sentToPrinterDate?: Date;
    printerName?: string;
    fileReference?: string;
    expectedStickerCount: number;
    printerStatus?: PrinterStatus;
  };
  receipt?: {
    dateReceived?: Date;
    quantityReceived?: number;
    responsiblePerson?: string;
    printingIssues?: string;
    qualityCheckResult?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const qrSeriesSchema = new Schema<IQrSeries>(
  {
    seriesName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    startNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    endNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    initialCode: {
      type: String,
      required: true,
    },
    finalCode: {
      type: String,
      required: true,
    },
    totalQRs: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: Object.values(QrSeriesStatus),
      default: QrSeriesStatus.DRAFT,
      index: true,
    },
    comments: {
      type: String,
      trim: true,
      default: '',
    },
    generatingUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    generationDate: {
      type: Date,
      default: Date.now,
    },
    printerOrder: {
      sentToPrinterDate: { type: Date, default: null },
      printerName: { type: String, trim: true, default: '' },
      fileReference: { type: String, trim: true, default: '' },
      expectedStickerCount: { type: Number, required: true },
      printerStatus: {
        type: String,
        enum: Object.values(PrinterStatus),
        default: null,
      },
    },
    receipt: {
      dateReceived: { type: Date, default: null },
      quantityReceived: { type: Number, default: 0 },
      responsiblePerson: { type: String, trim: true, default: '' },
      printingIssues: { type: String, trim: true, default: '' },
      qualityCheckResult: { type: String, trim: true, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

qrSeriesSchema.pre('validate', function (this: any) {
  if (this.startNumber !== undefined && this.endNumber !== undefined) {
    this.totalQRs = this.endNumber - this.startNumber + 1;
    
    // Format helper: Pad code to 6 digits, prefix with QR-01-
    const pad = (num: number) => String(num).padStart(6, '0');
    this.initialCode = `QR-01-${pad(this.startNumber)}`;
    this.finalCode = `QR-01-${pad(this.endNumber)}`;

    if (!this.printerOrder) {
      this.printerOrder = { expectedStickerCount: this.totalQRs * 2 };
    } else {
      this.printerOrder.expectedStickerCount = this.totalQRs * 2;
    }
  }
});

const QrSeries: Model<IQrSeries> =
  mongoose.models.QrSeries || mongoose.model<IQrSeries>('QrSeries', qrSeriesSchema);

export default QrSeries;
