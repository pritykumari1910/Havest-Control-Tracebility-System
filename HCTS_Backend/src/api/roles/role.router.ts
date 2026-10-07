import express from 'express';
import { encryptResponseMiddleware } from '../../middlewares/encryptResponse.ts';
import { authMiddleware } from '../../middlewares/auth.ts';
import { auditLogMiddleware } from '../../middlewares/auditLog.ts';
import validateRequest from '../../middlewares/validateRequest.ts';
import catchAsync from '../../utils/catchAsync.ts';
import roleController from './role.controller.ts';
import './role.swagger.ts';
import {
  createPermissionValidator,
  createRoleValidator,
  deletePermissionValidator,
  deleteRoleValidator,
  getRoleValidator,
  updatePermissionValidator,
  updateRoleValidator,
} from './role.validator.ts';

const roleRouter = express.Router();

roleRouter.use(authMiddleware);

roleRouter.get(
  '/permissions',
  catchAsync(roleController.getAllPermissions)
);

roleRouter.post(
  '/permissions',
  auditLogMiddleware({ event: 'PERMISSION_CREATED', entityType: 'permission' }),
  createPermissionValidator,
  validateRequest,
  catchAsync(roleController.createPermission),
  encryptResponseMiddleware
);

roleRouter.patch(
  '/permissions/:permissionId',
  auditLogMiddleware({
    event: 'PERMISSION_UPDATED',
    entityType: 'permission',
    getEntityId: (req) => String(req.params.permissionId),
  }),
  updatePermissionValidator,
  validateRequest,
  catchAsync(roleController.updatePermission),
  encryptResponseMiddleware
);

roleRouter.delete(
  '/permissions/:permissionId',
  auditLogMiddleware({
    event: 'PERMISSION_DELETED',
    entityType: 'permission',
    getEntityId: (req) => String(req.params.permissionId),
  }),
  deletePermissionValidator,
  validateRequest,
  catchAsync(roleController.deletePermission),
  encryptResponseMiddleware
);

roleRouter.get(
  '/roles',
  catchAsync(roleController.getAllRoles),
  // encryptResponseMiddleware
);

roleRouter.post(
  '/roles',
  auditLogMiddleware({ event: 'ROLE_CREATED', entityType: 'role' }),
  createRoleValidator,
  validateRequest,
  catchAsync(roleController.createRole),
  encryptResponseMiddleware
);

roleRouter.get(
  '/roles/:roleId',
  getRoleValidator,
  validateRequest,
  catchAsync(roleController.getRoleById),
  encryptResponseMiddleware
);

roleRouter.patch(
  '/roles/:roleId',
  auditLogMiddleware({
    event: (req) => {
      if (req.body.isActive !== undefined) {
        return req.body.isActive ? 'ROLE_ACTIVATED' : 'ROLE_DEACTIVATED';
      }
      if (req.body.permissions !== undefined) {
        return 'ROLE_PERMISSIONS_UPDATED';
      }
      return 'ROLE_UPDATED';
    },
    entityType: 'role',
    getEntityId: (req) => String(req.params.roleId),
  }),
  updateRoleValidator,
  validateRequest,
  catchAsync(roleController.updateRole),
  encryptResponseMiddleware
);

roleRouter.delete(
  '/roles/:roleId',
  auditLogMiddleware({
    event: 'ROLE_DELETED',
    entityType: 'role',
    getEntityId: (req) => String(req.params.roleId),
  }),
  deleteRoleValidator,
  validateRequest,
  catchAsync(roleController.deleteRole),
  encryptResponseMiddleware
);

export default roleRouter;
