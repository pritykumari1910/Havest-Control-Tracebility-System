import { Types } from 'mongoose';
import PermissionModel from '../../models/permission.model.ts';
import RoleModel, { type RoleType } from '../../models/role.model.ts';

interface CreatePermissionDTO {
  permissionName: string;
  permissionIdentifier: string;
}

interface UpdatePermissionDTO {
  permissionName?: string;
  permissionIdentifier?: string;
}

interface CreateRoleDTO {
  name: string;
  roleType: RoleType;
  permissions?: string[];
  createdByAdminId: string;
  isSystem?: boolean;
  isActive?: boolean;
}

interface UpdateRoleDTO {
  name?: string;
  roleType?: RoleType;
  permissions?: string[];
  isSystem?: boolean;
  isActive?: boolean;
}

class RoleRepository {
  createPermission(payload: CreatePermissionDTO) {
    return PermissionModel.create(payload);
  }

  updatePermission(permissionId: string, payload: UpdatePermissionDTO) {
    return PermissionModel.findByIdAndUpdate(permissionId, payload, {
      new: true,
      runValidators: true,
    });
  }

  deletePermission(permissionId: string) {
    return PermissionModel.findByIdAndDelete(permissionId);
  }

  countPermissionsByIds(permissionIds: string[]) {
    return PermissionModel.countDocuments({
      _id: { $in: permissionIds.map((permissionId) => new Types.ObjectId(permissionId)) },
    });
  }

  getAllPermissions() {
    return PermissionModel.find().sort({ permissionName: 1 });
  }

  getAllRoles() {
    return RoleModel.find().sort({ name: 1 }).populate('permissions');
  }

  getRoleById(roleId: string) {
    return RoleModel.findById(roleId).populate('permissions');
  }

  createRole(payload: CreateRoleDTO) {
    return RoleModel.create({
      ...payload,
      permissions: payload.permissions?.map((permissionId) => new Types.ObjectId(permissionId)) || [],
      createdByAdminId: new Types.ObjectId(payload.createdByAdminId),
    });
  }

  updateRole(roleId: string, payload: UpdateRoleDTO) {
    const updatePayload = {
      ...payload,
      ...(payload.permissions
        ? { permissions: payload.permissions.map((permissionId) => new Types.ObjectId(permissionId)) }
        : {}),
    };

    return RoleModel.findByIdAndUpdate(roleId, updatePayload, {
      new: true,
      runValidators: true,
    }).populate('permissions');
  }

  deleteRole(roleId: string) {
    return RoleModel.findByIdAndDelete(roleId);
  }
}

export default new RoleRepository();
