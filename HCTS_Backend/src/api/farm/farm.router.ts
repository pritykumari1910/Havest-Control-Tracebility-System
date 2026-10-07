import express from 'express';
import { authMiddleware, requireGeographicManagementRoles } from '../../middlewares/auth.ts';
import { auditLogMiddleware } from '../../middlewares/auditLog.ts';
import validateRequest from '../../middlewares/validateRequest.ts';
import catchAsync from '../../utils/catchAsync.ts';
import farmController from './farm.controller.ts';
import './farm.swagger.ts';
import {
  createFarmValidator,
  updateFarmValidator,
  farmIdParamValidator,
  getFarmsValidator,
} from './farm.validator.ts';

const farmRouter = express.Router();

farmRouter.use(authMiddleware);

farmRouter.post(
  '/',
  requireGeographicManagementRoles(),
  auditLogMiddleware({ event: 'FARM_CREATED', entityType: 'farm' }),
  createFarmValidator,
  validateRequest,
  catchAsync(farmController.createFarm)
);

farmRouter.get(
  '/',
  getFarmsValidator,
  validateRequest,
  catchAsync(farmController.getFarms)
);

farmRouter.get(
  '/:farmId',
  farmIdParamValidator,
  validateRequest,
  catchAsync(farmController.getFarmById)
);

farmRouter.patch(
  '/:farmId',
  requireGeographicManagementRoles(),
  auditLogMiddleware({
    event: (req) => {
      if (req.body.status !== undefined) {
        return req.body.status === 'active' ? 'FARM_ACTIVATED' : 'FARM_DEACTIVATED';
      }
      return 'FARM_UPDATED';
    },
    entityType: 'farm',
    getEntityId: (req) => String(req.params.farmId),
  }),
  updateFarmValidator,
  validateRequest,
  catchAsync(farmController.updateFarm)
);

export default farmRouter;
