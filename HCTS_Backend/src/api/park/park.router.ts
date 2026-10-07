import express from 'express';
import { authMiddleware, requireGeographicManagementRoles } from '../../middlewares/auth.ts';
import { auditLogMiddleware } from '../../middlewares/auditLog.ts';
import validateRequest from '../../middlewares/validateRequest.ts';
import catchAsync from '../../utils/catchAsync.ts';
import parkController from './park.controller.ts';
import './park.swagger.ts';
import {
  createParkValidator,
  updateParkValidator,
  parkIdParamValidator,
  getParksValidator,
  getParksByValveIdValidator,
} from './park.validator.ts';

const parkRouter = express.Router();

parkRouter.use(authMiddleware);

parkRouter.post(
  '/',
  requireGeographicManagementRoles(),
  auditLogMiddleware({ event: 'PARK_CREATED', entityType: 'park' }),
  createParkValidator,
  validateRequest,
  catchAsync(parkController.createPark)
);

parkRouter.get(
  '/',
  getParksValidator,
  validateRequest,
  catchAsync(parkController.getParks)
);

parkRouter.get(
  '/valve/:valveId',
  getParksByValveIdValidator,
  validateRequest,
  catchAsync(parkController.getParksByValveId)
);

parkRouter.get(
  '/:parkId',
  parkIdParamValidator,
  validateRequest,
  catchAsync(parkController.getParkById)
);

parkRouter.patch(
  '/:parkId',
  requireGeographicManagementRoles(),
  auditLogMiddleware({
    event: (req) => {
      if (req.body.status !== undefined) {
        return req.body.status === 'active' ? 'PARK_ACTIVATED' : 'PARK_DEACTIVATED';
      }
      return 'PARK_UPDATED';
    },
    entityType: 'park',
    getEntityId: (req) => String(req.params.parkId),
  }),
  updateParkValidator,
  validateRequest,
  catchAsync(parkController.updatePark)
);

export default parkRouter;
