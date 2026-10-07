import express from 'express';
import { authMiddleware, requireFieldManagementRoles } from '../../middlewares/auth.ts';
import { auditLogMiddleware } from '../../middlewares/auditLog.ts';
import validateRequest from '../../middlewares/validateRequest.ts';
import catchAsync from '../../utils/catchAsync.ts';
import reportsController from './reports.controller.ts';
import './reports.swagger.ts';
import {
  getHarvestProgressValidator,
  exportHarvestProgressValidator,
  getForecastVsActualValidator,
  getHarvestReceiptScansValidator,
  getTransferOrdersReportValidator,
  getDispatchNotesReportValidator,
  exportDispatchNotesReportValidator,
} from './reports.validator.ts';

const reportsRouter = express.Router();

reportsRouter.use(authMiddleware);

reportsRouter.get(
  '/harvest-progress',
  requireFieldManagementRoles(),
  getHarvestProgressValidator,
  validateRequest,
  catchAsync(reportsController.getHarvestProgress)
);

reportsRouter.get(
  '/harvest-progress/export',
  requireFieldManagementRoles(),
  auditLogMiddleware({ event: 'HARVEST_PROGRESS_REPORT_EXPORTED', entityType: 'report' }),
  exportHarvestProgressValidator,
  validateRequest,
  catchAsync(reportsController.exportHarvestProgress)
);

reportsRouter.get(
  '/forecast-vs-actual',
  requireFieldManagementRoles(),
  getForecastVsActualValidator,
  validateRequest,
  catchAsync(reportsController.getForecastVsActual)
);

reportsRouter.get(
  '/harvest-receipt-scans',
  requireFieldManagementRoles(),
  getHarvestReceiptScansValidator,
  validateRequest,
  catchAsync(reportsController.getHarvestReceiptScans)
);

reportsRouter.get(
  '/transfer-orders',
  requireFieldManagementRoles(),
  getTransferOrdersReportValidator,
  validateRequest,
  catchAsync(reportsController.getTransferOrders)
);

reportsRouter.get(
  '/dispatch-notes',
  requireFieldManagementRoles(),
  getDispatchNotesReportValidator,
  validateRequest,
  catchAsync(reportsController.getDispatchNotes)
);

reportsRouter.get(
  '/dispatch-notes/export',
  requireFieldManagementRoles(),
  auditLogMiddleware({ event: 'DISPATCH_NOTES_REPORT_EXPORTED', entityType: 'report' }),
  exportDispatchNotesReportValidator,
  validateRequest,
  catchAsync(reportsController.exportDispatchNotes)
);

export default reportsRouter;
