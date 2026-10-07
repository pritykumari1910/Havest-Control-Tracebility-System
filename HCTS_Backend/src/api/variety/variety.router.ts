import express from 'express';
import { authMiddleware, requireGeographicManagementRoles } from '../../middlewares/auth.ts';
import { auditLogMiddleware } from '../../middlewares/auditLog.ts';
import validateRequest from '../../middlewares/validateRequest.ts';
import catchAsync from '../../utils/catchAsync.ts';
import varietyController from './variety.controller.ts';
import './variety.swagger.ts';
import {
  createVarietyValidator,
  updateVarietyValidator,
  varietyIdParamValidator,
  getVarietiesValidator,
} from './variety.validator.ts';

const varietyRouter = express.Router();

varietyRouter.use(authMiddleware);

varietyRouter.post(
  '/',
  requireGeographicManagementRoles(),
  auditLogMiddleware({ event: 'VARIETY_CREATED', entityType: 'variety' }),
  createVarietyValidator,
  validateRequest,
  catchAsync(varietyController.createVariety)
);

varietyRouter.get(
  '/',
  getVarietiesValidator,
  validateRequest,
  catchAsync(varietyController.getVarieties)
);

varietyRouter.get(
  '/:varietyId',
  varietyIdParamValidator,
  validateRequest,
  catchAsync(varietyController.getVarietyById)
);

varietyRouter.patch(
  '/:varietyId',
  requireGeographicManagementRoles(),
  auditLogMiddleware({
    event: (req) => {
      if (req.body.status !== undefined) {
        return req.body.status === 'active' ? 'VARIETY_ACTIVATED' : 'VARIETY_DEACTIVATED';
      }
      return 'VARIETY_UPDATED';
    },
    entityType: 'variety',
    getEntityId: (req) => String(req.params.varietyId),
  }),
  updateVarietyValidator,
  validateRequest,
  catchAsync(varietyController.updateVariety)
);

export default varietyRouter;
