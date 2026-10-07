import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import './permission.model.ts';

export type RoleType = 'web' | 'app';

export interface IRole extends Document {
  name: string;
  permissions: Types.ObjectId[];
  roleType: RoleType;
  createdByAdminId: Types.ObjectId;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    permissions: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Permission',
        },
      ],
      default: [],
    },
    roleType: {
      type: String,
      enum: ['web', 'app'],
      required: true,
    },
    createdByAdminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

roleSchema.index({ createdByAdminId: 1, name: 1 }, { unique: true });

export const RoleModel: Model<IRole> = mongoose.models.Role || mongoose.model<IRole>('Role', roleSchema);

export default RoleModel;
