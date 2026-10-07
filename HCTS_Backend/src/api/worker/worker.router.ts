import express from 'express';
import { authMiddleware, requireSystemAdminRole } from '../../middlewares/auth.ts';
import { auditLogMiddleware } from '../../middlewares/auditLog.ts';
import validateRequest from '../../middlewares/validateRequest.ts';
import catchAsync from '../../utils/catchAsync.ts';
import workerController from './worker.controller.ts';
import './worker.swagger.ts';
import {
  createWorkerValidator,
  updateWorkerValidator,
  workerIdParamValidator,
  getWorkersValidator,
  companyIdParamValidator,
} from './worker.validator.ts';

const workerRouter = express.Router();

workerRouter.use(authMiddleware);

workerRouter.post(
  '/',
  requireSystemAdminRole(),
  auditLogMiddleware({ event: 'WORKER_CREATED', entityType: 'worker' }),
  createWorkerValidator,
  validateRequest,
  catchAsync(workerController.createWorker)
);

workerRouter.get(
  '/',
  getWorkersValidator,
  validateRequest,
  catchAsync(workerController.getWorkers)
);

workerRouter.get(
  '/qr/booklet',
  auditLogMiddleware({ event: 'WORKERS_QR_BOOKLET_DOWNLOADED', entityType: 'worker' }),
  catchAsync(workerController.downloadWorkerQrBooklet)
);

workerRouter.get(
  '/qr/scan/:qrCode',
  auditLogMiddleware({
    event: 'WORKER_QR_SCANNED',
    entityType: 'worker',
  }),
  catchAsync(workerController.getWorkerByQrCode)
);

workerRouter.get(
  '/company/:companyId',
  companyIdParamValidator,
  validateRequest,
  catchAsync(workerController.getWorkersByCompanyId)
);

workerRouter.get(
  '/:workerId',
  workerIdParamValidator,
  validateRequest,
  catchAsync(workerController.getWorkerById)
);

workerRouter.get(
  '/:workerId/qr',
  workerIdParamValidator,
  validateRequest,
  catchAsync(workerController.getWorkerQrCard)
);

workerRouter.get(
  '/:workerId/qr/download',
  auditLogMiddleware({
    event: 'WORKER_QR_DOWNLOADED',
    entityType: 'worker',
    getEntityId: (req) => String(req.params.workerId),
  }),
  workerIdParamValidator,
  validateRequest,
  catchAsync(workerController.downloadWorkerQrCardPdf)
);

workerRouter.post(
  '/:workerId/qr/regenerate',
  requireSystemAdminRole(),
  auditLogMiddleware({
    event: 'WORKER_QR_REGENERATED',
    entityType: 'worker',
    getEntityId: (req) => String(req.params.workerId),
  }),
  workerIdParamValidator,
  validateRequest,
  catchAsync(workerController.regenerateWorkerQrCode)
);

workerRouter.patch(
  '/:workerId',
  requireSystemAdminRole(),
  auditLogMiddleware({
    event: (req) => {
      if (req.body.status !== undefined) {
        return req.body.status === 'active' ? 'WORKER_ACTIVATED' : 'WORKER_DEACTIVATED';
      }
      return 'WORKER_UPDATED';
    },
    entityType: 'worker',
    getEntityId: (req) => String(req.params.workerId),
  }),
  updateWorkerValidator,
  validateRequest,
  catchAsync(workerController.updateWorker)
);

export default workerRouter;
