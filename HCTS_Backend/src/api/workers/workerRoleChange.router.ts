import express from 'express';
import { authMiddleware, requireCrewManagementRoles } from '../../middlewares/auth.ts';
import { auditLogMiddleware } from '../../middlewares/auditLog.ts';
import validateRequest from '../../middlewares/validateRequest.ts';
import catchAsync from '../../utils/catchAsync.ts';
import workerRoleChangeController from './workerRoleChange.controller.ts';
import './workerRoleChange.swagger.ts';
import { workerRoleChangeValidator } from './workerRoleChange.validator.ts';

const workerRoleChangeRouter = express.Router();

workerRoleChangeRouter.use(authMiddleware);

workerRoleChangeRouter.post(
  '/:workerId/change-role',
  requireCrewManagementRoles(),
  auditLogMiddleware({
    event: 'WORKER_ROLE_CHANGED_MIDDAY',
    entityType: 'worker',
    getEntityId: (req) => String(req.params.workerId),
  }),
  workerRoleChangeValidator,
  validateRequest,
  catchAsync(workerRoleChangeController.changeRole)
);

export default workerRoleChangeRouter;
