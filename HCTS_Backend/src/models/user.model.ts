import bcrypt from 'bcryptjs';
import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import validator from 'validator';
import type { UserPortal } from '../api/auth/auth.types.ts';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  password: string;
  roleIds: Types.ObjectId[];
  userportal: UserPortal;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date | null;
  forceLogoutAt?: Date | null;
  deletedAt?: Date | null;
  isPasswordMatch(password: string): Promise<boolean>;
}

interface UserModel extends Model<IUser> {
  isEmailTaken(email: string, excludeUserId?: string): Promise<boolean>;
}

const userSchema = new Schema<IUser, UserModel>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value: string) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: null,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      select: false,
      validate(value: string) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error('Password must contain at least one letter and one number');
        }
      },
    },
    roleIds: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Role',
        },
      ],
      default: [],
    },
    userportal: {
      type: String,
      // enum: ['web', 'app'],
      // required: true,
       enum: ['web', 'app', 'both'],
      required: true,
      default: 'both',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    forceLogoutAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.statics.isEmailTaken = async function (email: string, excludeUserId?: string) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return Boolean(user);
};

userSchema.methods.isPasswordMatch = async function (password: string) {
  return bcrypt.compare(password, this.password);
};

userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }
});

const User: UserModel = (mongoose.models.User as UserModel) || mongoose.model<IUser, UserModel>('User', userSchema);

export default User;
