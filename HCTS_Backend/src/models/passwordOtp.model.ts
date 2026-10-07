import mongoose, { Document, Model, Schema } from 'mongoose';

export type OtpStatus = 'pending' | 'used' | 'expired';
export type UserPortal = 'web' | 'app';

export interface IPasswordOtp extends Document {
  email: string;
  userportal: UserPortal;
  otp: string;
  status: OtpStatus;
  requestedAt: Date;
  expiresAt: Date;
  usedAt?: Date | null;
}

const passwordOtpSchema = new Schema<IPasswordOtp>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    userportal: {
      type: String,
      enum: ['web', 'app'],
      required: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'used', 'expired'],
      default: 'pending',
      index: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

passwordOtpSchema.index({ email: 1, userportal: 1, otp: 1, status: 1, expiresAt: 1 });

const PasswordOtp: Model<IPasswordOtp> =
  mongoose.models.PasswordOtp || mongoose.model<IPasswordOtp>('PasswordOtp', passwordOtpSchema);

export default PasswordOtp;
