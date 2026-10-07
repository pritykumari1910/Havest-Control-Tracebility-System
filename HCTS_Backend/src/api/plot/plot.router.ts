import express from 'express';
import { authMiddleware, requireGeographicManagementRoles } from '../../middlewares/auth.ts';
import { auditLogMiddleware } from '../../middlewares/auditLog.ts';
import validateRequest from '../../middlewares/validateRequest.ts';
import catchAsync from '../../utils/catchAsync.ts';
import plotController from './plot.controller.ts';
import './plot.swagger.ts';
import {
  createPlotValidator,
  updatePlotValidator,
  plotIdParamValidator,
  getPlotsValidator,
  getPlotsByFarmIdValidator,
} from './plot.validator.ts';

const plotRouter = express.Router();

plotRouter.use(authMiddleware);

plotRouter.post(
  '/',
  requireGeographicManagementRoles(),
  auditLogMiddleware({ event: 'PLOT_CREATED', entityType: 'plot' }),
  createPlotValidator,
  validateRequest,
  catchAsync(plotController.createPlot)
);

plotRouter.get(
  '/',
  getPlotsValidator,
  validateRequest,
  catchAsync(plotController.getPlots)
);

plotRouter.get(
  '/farm/:farmId',
  getPlotsByFarmIdValidator,
  validateRequest,
  catchAsync(plotController.getPlotsByFarmId)
);

plotRouter.get(
  '/:plotId',
  plotIdParamValidator,
  validateRequest,
  catchAsync(plotController.getPlotById)
);

plotRouter.patch(
  '/:plotId',
  requireGeographicManagementRoles(),
  auditLogMiddleware({
    event: (req) => {
      if (req.body.status !== undefined) {
        return req.body.status === 'active' ? 'PLOT_ACTIVATED' : 'PLOT_DEACTIVATED';
      }
      return 'PLOT_UPDATED';
    },
    entityType: 'plot',
    getEntityId: (req) => String(req.params.plotId),
  }),
  updatePlotValidator,
  validateRequest,
  catchAsync(plotController.updatePlot)
);

export default plotRouter;
