import express from 'express';
import { authMiddleware, requireCrewManagementRoles } from '../../middlewares/auth.ts';
import { auditLogMiddleware } from '../../middlewares/auditLog.ts';
import validateRequest from '../../middlewares/validateRequest.ts';
import catchAsync from '../../utils/catchAsync.ts';
import satelliteRoleController from './satelliteRole.controller.ts';
import './satelliteRole.swagger.ts';
import {
  createSatelliteRoleValidator,
  updateSatelliteRoleValidator,
  roleIdParamValidator,
  getSatelliteRolesValidator,
} from './satelliteRole.validator.ts';

const satelliteRoleRouter = express.Router();

satelliteRoleRouter.use(authMiddleware);

satelliteRoleRouter.post(
  '/',
  requireCrewManagementRoles(),
  auditLogMiddleware({ event: 'SATELLITE_ROLE_CREATED', entityType: 'satelliteRole' }),
  createSatelliteRoleValidator,
  validateRequest,
  catchAsync(satelliteRoleController.createSatelliteRole)
);

satelliteRoleRouter.get(
  '/',
  getSatelliteRolesValidator,
  validateRequest,
  catchAsync(satelliteRoleController.getSatelliteRoles)
);

satelliteRoleRouter.patch(
  '/:roleId',
  requireCrewManagementRoles(),
  auditLogMiddleware({
    event: 'SATELLITE_ROLE_UPDATED',
    entityType: 'satelliteRole',
    getEntityId: (req) => String(req.params.roleId),
  }),
  updateSatelliteRoleValidator,
  validateRequest,
  catchAsync(satelliteRoleController.updateSatelliteRole)
);

satelliteRoleRouter.patch(
  '/:roleId/toggle-status',
  requireCrewManagementRoles(),
  auditLogMiddleware({
    event: 'SATELLITE_ROLE_STATUS_CHANGED',
    entityType: 'satelliteRole',
    getEntityId: (req) => String(req.params.roleId),
  }),
  roleIdParamValidator,
  validateRequest,
  catchAsync(satelliteRoleController.toggleSatelliteRoleStatus)
);

export default satelliteRoleRouter;
