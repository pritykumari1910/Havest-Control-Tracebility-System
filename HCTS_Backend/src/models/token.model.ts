import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { tokenTypes } from '../config/tokens.ts';

export interface IToken extends Document {
  token: string;
  user: Types.ObjectId;
  type: (typeof tokenTypes)[keyof typeof tokenTypes];
  expires: Date;
  blacklisted: boolean;
}

const tokenSchema = new Schema<IToken>(
  {
    token: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [tokenTypes.ACCESS, tokenTypes.REFRESH],
      required: true,
    },
    expires: {
      type: Date,
      required: true,
    },
    blacklisted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Token: Model<IToken> = mongoose.models.Token || mongoose.model<IToken>('Token', tokenSchema);

export default Token;
