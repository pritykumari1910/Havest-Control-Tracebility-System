import express from 'express';
import { authMiddleware, requireSystemAdminRole } from '../../middlewares/auth.ts';
import { auditLogMiddleware } from '../../middlewares/auditLog.ts';
import validateRequest from '../../middlewares/validateRequest.ts';
import catchAsync from '../../utils/catchAsync.ts';
import systemConfigController from './systemConfig.controller.ts';
import './systemConfig.swagger.ts';
import {
  createParameterValidator,
  updateParameterValidator,
  getParametersValidator,
  getParameterByIdValidator,
  getParameterByKeyValidator,
} from './systemConfig.validator.ts';

const systemConfigRouter = express.Router();

systemConfigRouter.use(authMiddleware);

systemConfigRouter.post(
  '/',
  requireSystemAdminRole(),
  auditLogMiddleware({ event: 'SYSTEM_PARAMETER_CREATED', entityType: 'systemConfig' }),
  createParameterValidator,
  validateRequest,
  catchAsync(systemConfigController.createParameter)
);

systemConfigRouter.get(
  '/',
  requireSystemAdminRole(),
  getParametersValidator,
  validateRequest,
  catchAsync(systemConfigController.getParameters)
);

systemConfigRouter.get(
  '/:id',
  getParameterByIdValidator,
  validateRequest,
  catchAsync(systemConfigController.getParameterById)
);

systemConfigRouter.get(
  '/key/:key',
  getParameterByKeyValidator,
  validateRequest,
  catchAsync(systemConfigController.getParameterByKey)
);

systemConfigRouter.patch(
  '/:id',
  requireSystemAdminRole(),
  auditLogMiddleware({
    event: 'SYSTEM_PARAMETER_UPDATED',
    entityType: 'systemConfig',
    getEntityId: (req) => String(req.params.id),
  }),
  updateParameterValidator,
  validateRequest,
  catchAsync(systemConfigController.updateParameter)
);

systemConfigRouter.delete(
  '/:id',
  requireSystemAdminRole(),
  auditLogMiddleware({
    event: 'SYSTEM_PARAMETER_DELETED',
    entityType: 'systemConfig',
    getEntityId: (req) => String(req.params.id),
  }),
  getParameterByIdValidator,
  validateRequest,
  catchAsync(systemConfigController.deleteParameter)
);

export default systemConfigRouter;
