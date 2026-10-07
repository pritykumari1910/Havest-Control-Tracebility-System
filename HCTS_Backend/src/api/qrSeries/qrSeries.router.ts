import express, { NextFunction, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middlewares/auth.ts';
import { auditLogMiddleware } from '../../middlewares/auditLog.ts';
import validateRequest from '../../middlewares/validateRequest.ts';
import catchAsync from '../../utils/catchAsync.ts';
import qrSeriesController from './qrSeries.controller.ts';
import './qrSeries.swagger.ts';
import {
  createSeriesValidator,
  printerOrderValidator,
  registerReceiptValidator,
  seriesIdParamValidator,
  listSeriesValidator,
  listInventoryValidator,
  updateSeriesValidator,
} from './qrSeries.validator.ts';

const qrSeriesRouter = express.Router();

qrSeriesRouter.use(authMiddleware);

// Authorization middleware: System Administrator and Farm Manager only
const requireQrManagementRoles = () => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const isAuthorized = req.user?.roles.some((role) =>
      ['System Administrator', 'Farm Manager'].includes(role.name)
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

// GET List all series
qrSeriesRouter.get(
  '/',
  listSeriesValidator,
  validateRequest,
  catchAsync(qrSeriesController.listSeries)
);

// POST Generate series (Draft)
qrSeriesRouter.post(
  '/',
  requireQrManagementRoles(),
  auditLogMiddleware({ event: 'QR_SERIES_GENERATED', entityType: 'qr_series' }),
  createSeriesValidator,
  validateRequest,
  catchAsync(qrSeriesController.createSeries)
);

// GET Get series details by ID
qrSeriesRouter.get(
  '/:seriesId',
  seriesIdParamValidator,
  validateRequest,
  catchAsync(qrSeriesController.getSeriesById)
);

// PATCH Update series name/comments
qrSeriesRouter.patch(
  '/:seriesId',
  requireQrManagementRoles(),
  auditLogMiddleware({
    event: 'QR_SERIES_UPDATED',
    entityType: 'qr_series',
    getEntityId: (req) => String(req.params.seriesId),
  }),
  updateSeriesValidator,
  validateRequest,
  catchAsync(qrSeriesController.updateSeries)
);

// PUT Update printer order tracking
qrSeriesRouter.put(
  '/:seriesId/printer-order',
  requireQrManagementRoles(),
  auditLogMiddleware({
    event: 'QR_SERIES_PRINT_ORDER_UPDATED',
    entityType: 'qr_series',
    getEntityId: (req) => String(req.params.seriesId),
  }),
  seriesIdParamValidator,
  printerOrderValidator,
  validateRequest,
  catchAsync(qrSeriesController.updatePrinterOrder)
);

// PUT Register receipt of printed stickers
qrSeriesRouter.put(
  '/:seriesId/receipt',
  requireQrManagementRoles(),
  auditLogMiddleware({
    event: 'QR_SERIES_RECEIPT_REGISTERED',
    entityType: 'qr_series',
    getEntityId: (req) => String(req.params.seriesId),
  }),
  seriesIdParamValidator,
  registerReceiptValidator,
  validateRequest,
  catchAsync(qrSeriesController.registerReceipt)
);

// PATCH Activate series (makes all QRs Available)
qrSeriesRouter.patch(
  '/:seriesId/activate',
  requireQrManagementRoles(),
  auditLogMiddleware({
    event: 'QR_SERIES_ACTIVATED',
    entityType: 'qr_series',
    getEntityId: (req) => String(req.params.seriesId),
  }),
  seriesIdParamValidator,
  validateRequest,
  catchAsync(qrSeriesController.activateSeries)
);

// PATCH Cancel series (sets series and unassigned QRs as Cancelled)
qrSeriesRouter.patch(
  '/:seriesId/cancel',
  requireQrManagementRoles(),
  auditLogMiddleware({
    event: 'QR_SERIES_CANCELLED',
    entityType: 'qr_series',
    getEntityId: (req) => String(req.params.seriesId),
  }),
  seriesIdParamValidator,
  validateRequest,
  catchAsync(qrSeriesController.cancelSeries)
);

// GET Export CSV
qrSeriesRouter.get(
  '/:seriesId/export/csv',
  auditLogMiddleware({
    event: 'QR_SERIES_EXPORTED',
    entityType: 'qr_series',
    getEntityId: (req) => String(req.params.seriesId),
    getMetadata: (req) => ({ format: 'CSV' }),
  }),
  seriesIdParamValidator,
  validateRequest,
  catchAsync(qrSeriesController.exportCsv)
);

// GET Export PDF
qrSeriesRouter.get(
  '/:seriesId/export/pdf',
  auditLogMiddleware({
    event: 'QR_SERIES_EXPORTED',
    entityType: 'qr_series',
    getEntityId: (req) => String(req.params.seriesId),
    getMetadata: (req) => ({ format: 'PDF' }),
  }),
  seriesIdParamValidator,
  validateRequest,
  catchAsync(qrSeriesController.exportPdf)
);

// GET Export ZIP
qrSeriesRouter.get(
  '/:seriesId/export/zip',
  auditLogMiddleware({
    event: 'QR_SERIES_EXPORTED',
    entityType: 'qr_series',
    getEntityId: (req) => String(req.params.seriesId),
    getMetadata: (req) => ({ format: 'ZIP' }),
  }),
  seriesIdParamValidator,
  validateRequest,
  catchAsync(qrSeriesController.exportZip)
);

// GET Inventory items (Dashboard)
qrSeriesRouter.get(
  '/dashboard/inventory',
  listInventoryValidator,
  validateRequest,
  catchAsync(qrSeriesController.getInventory)
);

// GET Series summary (Dashboard)
qrSeriesRouter.get(
  '/:seriesId/dashboard/summary',
  seriesIdParamValidator,
  validateRequest,
  catchAsync(qrSeriesController.getSeriesSummary)
);

export default qrSeriesRouter;
