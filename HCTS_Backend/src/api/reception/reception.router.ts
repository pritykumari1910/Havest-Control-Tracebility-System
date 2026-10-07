import express from 'express';
import { authMiddleware, requireCrewManagementRoles } from '../../middlewares/auth.ts';
import { auditLogMiddleware } from '../../middlewares/auditLog.ts';
import validateRequest from '../../middlewares/validateRequest.ts';
import catchAsync from '../../utils/catchAsync.ts';
import receptionController from './reception.controller.ts';
import './reception.swagger.ts';
import {
  createReceptionBatchValidator,
  updateReceptionBatchValidator,
  scanHarvestBinValidator,
  closeReceptionBatchValidator,
  getReceptionBatchesValidator,
  getReceivedBinInventoryValidator,
  createIncidentValidator,
  getIncidentsValidator,
} from './reception.validator.ts';

const receptionRouter = express.Router();

receptionRouter.use(authMiddleware);

receptionRouter.get(
  '/received-inventory',
  getReceivedBinInventoryValidator,
  validateRequest,
  catchAsync(receptionController.getReceivedInventory)
);

receptionRouter.post(
  '/incidents',
  auditLogMiddleware({
    event: 'PALLET_BIN_INCIDENT_LOGGED',
    entityType: 'palletBinIncident',
  }),
  createIncidentValidator,
  validateRequest,
  catchAsync(receptionController.createIncident)
);

receptionRouter.get(
  '/incidents',
  getIncidentsValidator,
  validateRequest,
  catchAsync(receptionController.getIncidents)
);

receptionRouter.post(
  '/batches',
  requireCrewManagementRoles(),
  auditLogMiddleware({ event: 'RECEPTION_BATCH_OPENED', entityType: 'receptionBatch' }),
  createReceptionBatchValidator,
  validateRequest,
  catchAsync(receptionController.createBatch)
);

receptionRouter.get(
  '/batches',
  getReceptionBatchesValidator,
  validateRequest,
  catchAsync(receptionController.getBatches)
);

receptionRouter.post(
  '/batches/:batchId/scan',
  requireCrewManagementRoles(),
  auditLogMiddleware({
    event: 'BIN_SCANNED_AT_RECEPTION',
    entityType: 'receptionBatch',
    getEntityId: (req) => String(req.params.batchId),
  }),
  scanHarvestBinValidator,
  validateRequest,
  catchAsync(receptionController.scanBin)
);

receptionRouter.post(
  '/batches/:batchId/close',
  requireCrewManagementRoles(),
  auditLogMiddleware({
    event: 'RECEPTION_BATCH_CLOSED',
    entityType: 'receptionBatch',
    getEntityId: (req) => String(req.params.batchId),
  }),
  closeReceptionBatchValidator,
  validateRequest,
  catchAsync(receptionController.closeBatch)
);

receptionRouter.patch(
  '/batches/:batchId',
  requireCrewManagementRoles(),
  auditLogMiddleware({
    event: 'RECEPTION_BATCH_UPDATED',
    entityType: 'receptionBatch',
    getEntityId: (req) => String(req.params.batchId),
  }),
  updateReceptionBatchValidator,
  validateRequest,
  catchAsync(receptionController.updateBatch)
);

receptionRouter.get(
  '/batches/:batchId/scans',
  catchAsync(receptionController.getScans)
);

export default receptionRouter;
