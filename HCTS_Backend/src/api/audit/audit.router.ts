import express from 'express';
import { authMiddleware, requirePermission } from '../../middlewares/auth.ts';
import validateRequest from '../../middlewares/validateRequest.ts';
import catchAsync from '../../utils/catchAsync.ts';
import auditController from './audit.controller.ts';
import { getAuditLogsValidator } from './audit.validator.ts';
import './audit.swagger.ts';

const auditRouter = express.Router();

auditRouter.use(authMiddleware);

auditRouter.get(
  '/',
  requirePermission('audit_trail_report'),
  getAuditLogsValidator,
  validateRequest,
  catchAsync(auditController.getAuditLogs)
);

auditRouter.get(
  '/farm-manager',
  requirePermission('audit_trail_report'),
  getAuditLogsValidator,
  validateRequest,
  catchAsync(auditController.getFarmManagerLogs)
);

auditRouter.get(
  '/manijero',
  requirePermission('audit_trail_report'),
  getAuditLogsValidator,
  validateRequest,
  catchAsync(auditController.getManijeroLogs)
);

auditRouter.get(
  '/collection-team',
  requirePermission('audit_trail_report'),
  getAuditLogsValidator,
  validateRequest,
  catchAsync(auditController.getCollectionTeamLogs)
);

auditRouter.get(
  '/loading-team',
  requirePermission('audit_trail_report'),
  getAuditLogsValidator,
  validateRequest,
  catchAsync(auditController.getLoadingTeamLogs)
);

export default auditRouter;
