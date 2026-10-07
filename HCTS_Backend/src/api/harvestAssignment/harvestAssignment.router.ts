import express from 'express';
import { authMiddleware, requireCrewManagementRoles } from '../../middlewares/auth.ts';
import { auditLogMiddleware } from '../../middlewares/auditLog.ts';
import validateRequest from '../../middlewares/validateRequest.ts';
import catchAsync from '../../utils/catchAsync.ts';
import harvestAssignmentController from './harvestAssignment.controller.ts';
import './harvestAssignment.swagger.ts';
import {
  createAssignmentValidator,
  getAssignmentsValidator,
  assignmentIdParamValidator,
  updateAssignmentValidator,
  updateAssignmentStatusValidator,
  assignQrRangeValidator,
  changeVarietyMidDayValidator,
  crewIdParamValidator,
} from './harvestAssignment.validator.ts';

const harvestAssignmentRouter = express.Router();

harvestAssignmentRouter.use(authMiddleware);

harvestAssignmentRouter.post(
  '/',
  requireCrewManagementRoles(),
  auditLogMiddleware({ event: 'HARVEST_ASSIGNMENT_CREATED', entityType: 'harvestAssignment' }),
  createAssignmentValidator,
  validateRequest,
  catchAsync(harvestAssignmentController.createAssignment)
);

harvestAssignmentRouter.get(
  '/history',
  catchAsync(harvestAssignmentController.getFarmManagerHistory)
);

harvestAssignmentRouter.get(
  '/history/:id',
  catchAsync(harvestAssignmentController.getFarmManagerHistoryById)
);

harvestAssignmentRouter.get(
  '/crew/:crewId',
  crewIdParamValidator,
  validateRequest,
  catchAsync(harvestAssignmentController.getAssignmentsByCrewId)
);

harvestAssignmentRouter.get(
  '/',
  getAssignmentsValidator,
  validateRequest,
  catchAsync(harvestAssignmentController.getAssignments)
);

harvestAssignmentRouter.get(
  '/:assignmentId',
  assignmentIdParamValidator,
  validateRequest,
  catchAsync(harvestAssignmentController.getAssignmentById)
);

harvestAssignmentRouter.put(
  '/:assignmentId',
  requireCrewManagementRoles(),
  auditLogMiddleware({
    event: 'HARVEST_ASSIGNMENT_UPDATED',
    entityType: 'harvestAssignment',
    getEntityId: (req) => String(req.params.assignmentId),
  }),
  updateAssignmentValidator,
  validateRequest,
  catchAsync(harvestAssignmentController.updateAssignment)
);

harvestAssignmentRouter.patch(
  '/:assignmentId',
  requireCrewManagementRoles(),
  auditLogMiddleware({
    event: 'HARVEST_ASSIGNMENT_UPDATED',
    entityType: 'harvestAssignment',
    getEntityId: (req) => String(req.params.assignmentId),
  }),
  updateAssignmentValidator,
  validateRequest,
  catchAsync(harvestAssignmentController.updateAssignment)
);

harvestAssignmentRouter.patch(
  '/:assignmentId/status',
  requireCrewManagementRoles(),
  auditLogMiddleware({
    event: 'HARVEST_ASSIGNMENT_STATUS_UPDATED',
    entityType: 'harvestAssignment',
    getEntityId: (req) => String(req.params.assignmentId),
  }),
  updateAssignmentStatusValidator,
  validateRequest,
  catchAsync(harvestAssignmentController.updateAssignmentStatus)
);

harvestAssignmentRouter.put(
  '/:assignmentId/qr-range',
  requireCrewManagementRoles(),
  auditLogMiddleware({
    event: 'HARVEST_ASSIGNMENT_QR_RANGE_ALLOCATED',
    entityType: 'harvestAssignment',
    getEntityId: (req) => String(req.params.assignmentId),
  }),
  assignQrRangeValidator,
  validateRequest,
  catchAsync(harvestAssignmentController.assignQrRange)
);

harvestAssignmentRouter.post(
  '/:assignmentId/return-unused-qrs',
  requireCrewManagementRoles(),
  auditLogMiddleware({
    event: 'HARVEST_ASSIGNMENT_UNUSED_QRS_RETURNED',
    entityType: 'harvestAssignment',
    getEntityId: (req) => String(req.params.assignmentId),
  }),
  assignmentIdParamValidator,
  validateRequest,
  catchAsync(harvestAssignmentController.returnUnusedQrs)
);

harvestAssignmentRouter.patch(
  '/:assignmentId/variety',
  requireCrewManagementRoles(),
  auditLogMiddleware({
    event: 'HARVEST_ASSIGNMENT_VARIETY_CHANGED',
    entityType: 'harvestAssignment',
    getEntityId: (req) => String(req.params.assignmentId),
  }),
  changeVarietyMidDayValidator,
  validateRequest,
  catchAsync(harvestAssignmentController.changeVarietyMidDay)
);

harvestAssignmentRouter.get(
  '/:assignmentId/variety-changes',
  requireCrewManagementRoles(),
  assignmentIdParamValidator,
  validateRequest,
  catchAsync(harvestAssignmentController.getVarietyChangeAudit)
);

export default harvestAssignmentRouter;
