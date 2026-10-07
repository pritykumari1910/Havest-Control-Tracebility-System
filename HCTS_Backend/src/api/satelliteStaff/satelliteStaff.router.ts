import express from 'express';
import { authMiddleware, requireCrewManagementRoles } from '../../middlewares/auth.ts';
import { auditLogMiddleware } from '../../middlewares/auditLog.ts';
import validateRequest from '../../middlewares/validateRequest.ts';
import catchAsync from '../../utils/catchAsync.ts';
import satelliteStaffController from './satelliteStaff.controller.ts';
import './satelliteStaff.swagger.ts';
import {
  registerSatelliteStaffValidator,
  getDailySatelliteStaffValidator,
  bulkSyncSatelliteStaffValidator,
  updateSatelliteStaffValidator,
  checkInStaffValidator,
  checkOutStaffValidator,
} from './satelliteStaff.validator.ts';
import { getSatelliteStaffReportValidator } from './satelliteStaffReport.validator.ts';

const satelliteStaffRouter = express.Router();

satelliteStaffRouter.use(authMiddleware);

satelliteStaffRouter.post(
  '/',
  requireCrewManagementRoles(),
  auditLogMiddleware({ event: 'SATELLITE_STAFF_REGISTERED', entityType: 'satelliteStaff' }),
  registerSatelliteStaffValidator,
  validateRequest,
  catchAsync(satelliteStaffController.registerStaff)
);

satelliteStaffRouter.get(
  '/report',
  getSatelliteStaffReportValidator,
  validateRequest,
  catchAsync(satelliteStaffController.getStaffReport)
);

satelliteStaffRouter.get(
  '/',
  getDailySatelliteStaffValidator,
  validateRequest,
  catchAsync(satelliteStaffController.getDailyStaff)
);

satelliteStaffRouter.patch(
  '/:id',
  requireCrewManagementRoles(),
  auditLogMiddleware({
    event: 'SATELLITE_STAFF_UPDATED',
    entityType: 'satelliteStaff',
    getEntityId: (req) => String(req.params.id),
  }),
  updateSatelliteStaffValidator,
  validateRequest,
  catchAsync(satelliteStaffController.updateStaff)
);

satelliteStaffRouter.post(
  '/sync',
  requireCrewManagementRoles(),
  auditLogMiddleware({ event: 'SATELLITE_STAFF_BULK_SYNCED', entityType: 'satelliteStaff' }),
  bulkSyncSatelliteStaffValidator,
  validateRequest,
  catchAsync(satelliteStaffController.bulkSyncStaff)
);

satelliteStaffRouter.post(
  '/:id/check-in',
  requireCrewManagementRoles(),
  auditLogMiddleware({
    event: 'SATELLITE_STAFF_CHECKED_IN',
    entityType: 'satelliteStaff',
    getEntityId: (req) => String(req.params.id),
  }),
  checkInStaffValidator,
  validateRequest,
  catchAsync(satelliteStaffController.checkIn)
);

satelliteStaffRouter.post(
  '/:id/check-out',
  requireCrewManagementRoles(),
  auditLogMiddleware({
    event: 'SATELLITE_STAFF_CHECKED_OUT',
    entityType: 'satelliteStaff',
    getEntityId: (req) => String(req.params.id),
  }),
  checkOutStaffValidator,
  validateRequest,
  catchAsync(satelliteStaffController.checkOut)
);

export default satelliteStaffRouter;
