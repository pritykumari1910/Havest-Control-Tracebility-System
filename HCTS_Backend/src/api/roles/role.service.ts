import httpStatus from 'http-status';
import ServiceResponse from '../../utils/ServiceResponse.ts';
import roleRepository from './role.repository.ts';
import type { RoleType } from '../../models/role.model.ts';

const ROLE_MESSAGES = {
  PERMISSION_CREATED: 'Permission created successfully',
  PERMISSIONS_FETCHED: 'Permissions fetched successfully',
  PERMISSION_UPDATED: 'Permission updated successfully',
  PERMISSION_DELETED: 'Permission deleted successfully',
  PERMISSION_NOT_FOUND: 'Permission not found',
  ROLE_CREATED: 'Role created successfully',
  ROLES_FETCHED: 'Roles fetched successfully',
  ROLE_FETCHED: 'Role fetched successfully',
  ROLE_UPDATED: 'Role updated successfully',
  ROLE_DELETED: 'Role deleted successfully',
  ROLE_NOT_FOUND: 'Role not found',
  INVALID_PERMISSIONS: 'One or more permissions are invalid',
} as const;

class RoleService {
  constructor(private readonly repository = roleRepository) {}

  private async validatePermissions(permissionIds: string[] = []) {
    if (!permissionIds.length) {
      return true;
    }

    const count = await this.repository.countPermissionsByIds(permissionIds);
    return count === permissionIds.length;
  }

  async createPermission(permissionName: string, permissionIdentifier: string) {
    const permission = await this.repository.createPermission({ permissionName, permissionIdentifier });

    return ServiceResponse.success(ROLE_MESSAGES.PERMISSION_CREATED, permission, httpStatus.CREATED);
  }

  async getAllPermissions() {
    const permissions = await this.repository.getAllPermissions();

    return ServiceResponse.success(ROLE_MESSAGES.PERMISSIONS_FETCHED, permissions, httpStatus.OK);
  }

  async updatePermission(permissionId: string, payload: { permissionName?: string; permissionIdentifier?: string }) {
    const permission = await this.repository.updatePermission(permissionId, payload);

    if (!permission) {
      return ServiceResponse.failure(ROLE_MESSAGES.PERMISSION_NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    return ServiceResponse.success(ROLE_MESSAGES.PERMISSION_UPDATED, permission, httpStatus.OK);
  }

  async deletePermission(permissionId: string) {
    const permission = await this.repository.deletePermission(permissionId);

    if (!permission) {
      return ServiceResponse.failure(ROLE_MESSAGES.PERMISSION_NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    return ServiceResponse.success(ROLE_MESSAGES.PERMISSION_DELETED, permission, httpStatus.OK);
  }

  async createRole(payload: {
    name: string;
    roleType: RoleType;
    permissions?: string[];
    createdByAdminId: string;
    isSystem?: boolean;
    isActive?: boolean;
  }) {
    const isValidPermissions = await this.validatePermissions(payload.permissions);

    if (!isValidPermissions) {
      return ServiceResponse.failure(ROLE_MESSAGES.INVALID_PERMISSIONS, null, httpStatus.BAD_REQUEST);
    }

    const role = await this.repository.createRole(payload);

    return ServiceResponse.success(ROLE_MESSAGES.ROLE_CREATED, role, httpStatus.CREATED);
  }

  async getAllRoles() {
    const roles = await this.repository.getAllRoles();

    return ServiceResponse.success(ROLE_MESSAGES.ROLES_FETCHED, roles, httpStatus.OK);
  }

  async getRoleById(roleId: string) {
    const role = await this.repository.getRoleById(roleId);

    if (!role) {
      return ServiceResponse.failure(ROLE_MESSAGES.ROLE_NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    return ServiceResponse.success(ROLE_MESSAGES.ROLE_FETCHED, role, httpStatus.OK);
  }

  async updateRole(
    roleId: string,
    payload: {
      name?: string;
      roleType?: RoleType;
      permissions?: string[];
      isSystem?: boolean;
      isActive?: boolean;
    }
  ) {
    const isValidPermissions = await this.validatePermissions(payload.permissions);

    if (!isValidPermissions) {
      return ServiceResponse.failure(ROLE_MESSAGES.INVALID_PERMISSIONS, null, httpStatus.BAD_REQUEST);
    }

    const role = await this.repository.updateRole(roleId, payload);

    if (!role) {
      return ServiceResponse.failure(ROLE_MESSAGES.ROLE_NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    return ServiceResponse.success(ROLE_MESSAGES.ROLE_UPDATED, role, httpStatus.OK);
  }

  async deleteRole(roleId: string) {
    const role = await this.repository.deleteRole(roleId);

    if (!role) {
      return ServiceResponse.failure(ROLE_MESSAGES.ROLE_NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    return ServiceResponse.success(ROLE_MESSAGES.ROLE_DELETED, role, httpStatus.OK);
  }
}

export default new RoleService();
