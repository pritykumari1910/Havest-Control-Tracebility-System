import express from 'express';
import { authMiddleware, requireFieldManagementRoles } from '../../middlewares/auth.ts';
import { auditLogMiddleware } from '../../middlewares/auditLog.ts';
import validateRequest from '../../middlewares/validateRequest.ts';
import catchAsync from '../../utils/catchAsync.ts';
import unassignedBinQueueController from './unassignedBinQueue.controller.ts';
import './unassignedBinQueue.swagger.ts';
import {
  getQueueValidator,
  queueItemIdParamValidator,
  resolveQueueItemValidator,
  rejectQueueItemValidator,
} from './unassignedBinQueue.validator.ts';

const unassignedBinQueueRouter = express.Router();

unassignedBinQueueRouter.use(authMiddleware);
unassignedBinQueueRouter.use(requireFieldManagementRoles());

unassignedBinQueueRouter.get(
  '/stats',
  catchAsync(unassignedBinQueueController.getQueueStats)
);

unassignedBinQueueRouter.get(
  '/',
  getQueueValidator,
  validateRequest,
  catchAsync(unassignedBinQueueController.getQueue)
);

unassignedBinQueueRouter.get(
  '/:queueItemId',
  queueItemIdParamValidator,
  validateRequest,
  catchAsync(unassignedBinQueueController.getQueueItemById)
);

unassignedBinQueueRouter.patch(
  '/:queueItemId/resolve',
  auditLogMiddleware({
    event: 'UNASSIGNED_BIN_RESOLVED',
    entityType: 'unassignedBinQueue',
    getEntityId: (req) => String(req.params.queueItemId),
  }),
  resolveQueueItemValidator,
  validateRequest,
  catchAsync(unassignedBinQueueController.resolveQueueItem)
);

unassignedBinQueueRouter.patch(
  '/:queueItemId/reject',
  auditLogMiddleware({
    event: 'UNASSIGNED_BIN_REJECTED',
    entityType: 'unassignedBinQueue',
    getEntityId: (req) => String(req.params.queueItemId),
  }),
  rejectQueueItemValidator,
  validateRequest,
  catchAsync(unassignedBinQueueController.rejectQueueItem)
);

export default unassignedBinQueueRouter;
