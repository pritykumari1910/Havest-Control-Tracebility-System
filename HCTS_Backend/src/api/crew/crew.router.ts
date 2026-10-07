import express from 'express';
import { authMiddleware, requireCrewManagementRoles } from '../../middlewares/auth.ts';
import { auditLogMiddleware } from '../../middlewares/auditLog.ts';
import validateRequest from '../../middlewares/validateRequest.ts';
import catchAsync from '../../utils/catchAsync.ts';
import crewController from './crew.controller.ts';
import './crew.swagger.ts';
import {
  createCrewValidator,
  updateCrewValidator,
  crewIdParamValidator,
  supervisorIdParamValidator,
  manijeroIdParamValidator,
  getCrewsValidator,
  getPreviousDayCrewsValidator,
  copyPreviousCrewsValidator,
  checkInAttendanceValidator,
  checkOutAttendanceValidator,
  getUnassignedWorkersValidator,
} from './crew.validator.ts';

const crewRouter = express.Router();

crewRouter.use(authMiddleware);

crewRouter.get(
  '/unassigned-workers',
  getUnassignedWorkersValidator,
  validateRequest,
  catchAsync(crewController.getUnassignedWorkers)
);

crewRouter.get(
  '/previous-day',
  getPreviousDayCrewsValidator,
  validateRequest,
  catchAsync(crewController.getPreviousDayCrews)
);

crewRouter.post(
  '/',
  requireCrewManagementRoles(),
  auditLogMiddleware({ event: 'CREW_CREATED', entityType: 'crew' }),
  createCrewValidator,
  validateRequest,
  catchAsync(crewController.createCrew)
);

crewRouter.get(
  '/',
  getCrewsValidator,
  validateRequest,
  catchAsync(crewController.getCrews)
);

crewRouter.get(
  '/supervisor/:supervisorId',
  supervisorIdParamValidator,
  getCrewsValidator,
  validateRequest,
  catchAsync(crewController.getCrewsBySupervisor)
);

crewRouter.get(
  '/manijero/:manijeroId',
  manijeroIdParamValidator,
  getCrewsValidator,
  validateRequest,
  catchAsync(crewController.getCrewsBySupervisor)
);

crewRouter.post(
  '/copy-previous',
  requireCrewManagementRoles(),
  auditLogMiddleware({ event: 'CREW_COPIED_FROM_PREVIOUS_DAY', entityType: 'crew' }),
  copyPreviousCrewsValidator,
  validateRequest,
  catchAsync(crewController.copyPreviousCrews)
);

crewRouter.get(
  '/:crewId',
  crewIdParamValidator,
  validateRequest,
  catchAsync(crewController.getCrewById)
);

crewRouter.patch(
  '/:crewId',
  requireCrewManagementRoles(),
  auditLogMiddleware({
    event: (req) => {
      if (req.body.status !== undefined) {
        return req.body.status === 'active' ? 'CREW_ACTIVATED' : 'CREW_DEACTIVATED';
      }
      return 'CREW_UPDATED';
    },
    entityType: 'crew',
    getEntityId: (req) => String(req.params.crewId),
  }),
  updateCrewValidator,
  validateRequest,
  catchAsync(crewController.updateCrew)
);

crewRouter.patch(
  '/:crewId/toggle-status',
  requireCrewManagementRoles(),
  auditLogMiddleware({
    event: 'CREW_STATUS_TOGGLED',
    entityType: 'crew',
    getEntityId: (req) => String(req.params.crewId),
  }),
  crewIdParamValidator,
  validateRequest,
  catchAsync(crewController.toggleCrewStatus)
);

crewRouter.post(
  '/:crewId/attendance/check-in',
  requireCrewManagementRoles(),
  auditLogMiddleware({
    event: 'CREW_ATTENDANCE_CHECK_IN',
    entityType: 'crew',
    getEntityId: (req) => String(req.params.crewId),
  }),
  checkInAttendanceValidator,
  validateRequest,
  catchAsync(crewController.checkInAttendance)
);

crewRouter.post(
  '/:crewId/attendance/check-out',
  requireCrewManagementRoles(),
  auditLogMiddleware({
    event: 'CREW_ATTENDANCE_CHECK_OUT',
    entityType: 'crew',
    getEntityId: (req) => String(req.params.crewId),
  }),
  checkOutAttendanceValidator,
  validateRequest,
  catchAsync(crewController.checkOutAttendance)
);

crewRouter.get(
  '/:crewId/attendance',
  crewIdParamValidator,
  validateRequest,
  catchAsync(crewController.getCrewAttendance)
);

export default crewRouter;
