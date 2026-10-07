import express from 'express';
import { authMiddleware, requireGeographicManagementRoles } from '../../middlewares/auth.ts';
import { auditLogMiddleware } from '../../middlewares/auditLog.ts';
import validateRequest from '../../middlewares/validateRequest.ts';
import catchAsync from '../../utils/catchAsync.ts';
import valveController from './valve.controller.ts';
import './valve.swagger.ts';
import {
  createValveValidator,
  updateValveValidator,
  valveIdParamValidator,
  getValvesValidator,
  getValvesByPlotIdValidator,
} from './valve.validator.ts';

const valveRouter = express.Router();

valveRouter.use(authMiddleware);

valveRouter.post(
  '/',
  requireGeographicManagementRoles(),
  auditLogMiddleware({ event: 'VALVE_CREATED', entityType: 'valve' }),
  createValveValidator,
  validateRequest,
  catchAsync(valveController.createValve)
);

valveRouter.get(
  '/',
  getValvesValidator,
  validateRequest,
  catchAsync(valveController.getValves)
);

valveRouter.get(
  '/plot/:plotId',
  getValvesByPlotIdValidator,
  validateRequest,
  catchAsync(valveController.getValvesByPlotId)
);

valveRouter.get(
  '/:valveId',
  valveIdParamValidator,
  validateRequest,
  catchAsync(valveController.getValveById)
);

valveRouter.patch(
  '/:valveId',
  requireGeographicManagementRoles(),
  auditLogMiddleware({
    event: (req) => {
      if (req.body.status !== undefined) {
        return req.body.status === 'active' ? 'VALVE_ACTIVATED' : 'VALVE_DEACTIVATED';
      }
      return 'VALVE_UPDATED';
    },
    entityType: 'valve',
    getEntityId: (req) => String(req.params.valveId),
  }),
  updateValveValidator,
  validateRequest,
  catchAsync(valveController.updateValve)
);

export default valveRouter;
