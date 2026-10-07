import express, { NextFunction, Response } from 'express';
import multer from 'multer';
import { authMiddleware, AuthRequest } from '../../middlewares/auth.ts';
import { auditLogMiddleware } from '../../middlewares/auditLog.ts';
import validateRequest from '../../middlewares/validateRequest.ts';
import catchAsync from '../../utils/catchAsync.ts';
import harvestForecastController from './harvestForecast.controller.ts';
import './harvestForecast.swagger.ts';
import {
  createForecastValidator,
  updateForecastValidator,
  forecastIdParamValidator,
  listForecastValidator,
  mockReceiptsValidator,
} from './harvestForecast.validator.ts';

const harvestForecastRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

harvestForecastRouter.use(authMiddleware);

// Authorization middleware: System Administrator, Farm Manager, and Operations Director only
const requireForecastManagementRoles = () => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const isAuthorized = req.user?.roles.some((role) =>
      ['System Administrator', 'Farm Manager', 'Operations Director'].includes(role.name)
    );

    if (!isAuthorized) {
      res.status(403).json({
        success: false,
        message: 'Forbidden (insufficient permissions)',
        responseObject: null,
        statusCode: 403,
      });
      return;
    }
    next();
  };
};

// Endpoints

// GET List forecasts
harvestForecastRouter.get(
  '/',
  listForecastValidator,
  validateRequest,
  catchAsync(harvestForecastController.getForecasts)
);

// POST Create forecast manually
harvestForecastRouter.post(
  '/',
  requireForecastManagementRoles(),
  auditLogMiddleware({ event: 'HARVEST_FORECAST_CREATED', entityType: 'harvest_forecast' }),
  createForecastValidator,
  validateRequest,
  catchAsync(harvestForecastController.createForecast)
);

// PUT Update forecast manually
harvestForecastRouter.put(
  '/:forecastId',
  requireForecastManagementRoles(),
  auditLogMiddleware({
    event: 'HARVEST_FORECAST_UPDATED',
    entityType: 'harvest_forecast',
    getEntityId: (req) => String(req.params.forecastId),
  }),
  updateForecastValidator,
  validateRequest,
  catchAsync(harvestForecastController.updateForecast)
);

// POST Bulk upload templates (Excel/CSV)
harvestForecastRouter.post(
  '/bulk-upload',
  requireForecastManagementRoles(),
  upload.single('file'),
  auditLogMiddleware({
    event: 'HARVEST_FORECAST_BULK_UPLOADED',
    entityType: 'harvest_forecast',
  }),
  catchAsync(harvestForecastController.bulkUploadForecast)
);

// GET Forecast vs. Actual Progress Dashboard
harvestForecastRouter.get(
  '/progress-dashboard',
  catchAsync(harvestForecastController.getProgressDashboard)
);

// POST Mock receipts weight logger (For Testing Dashboard)
harvestForecastRouter.post(
  '/mock-receipts',
  requireForecastManagementRoles(),
  auditLogMiddleware({ event: 'HARVEST_MOCK_RECEIPT_LOGGED', entityType: 'harvest_receipt' }),
  mockReceiptsValidator,
  validateRequest,
  catchAsync(harvestForecastController.seedMockReceipts)
);

export default harvestForecastRouter;
