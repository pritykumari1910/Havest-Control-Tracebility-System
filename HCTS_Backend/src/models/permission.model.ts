import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPermission extends Document {
  permissionName: string;
  permissionIdentifier: string;
  createdAt: Date;
  updatedAt: Date;
}

const permissionSchema = new Schema<IPermission>(
  {
    permissionName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    permissionIdentifier: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const PermissionModel: Model<IPermission> =
  mongoose.models.Permission || mongoose.model<IPermission>('Permission', permissionSchema);

export default PermissionModel;
