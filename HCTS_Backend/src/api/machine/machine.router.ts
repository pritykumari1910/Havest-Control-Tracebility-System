import express, { NextFunction, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middlewares/auth.ts';
import { auditLogMiddleware } from '../../middlewares/auditLog.ts';
import validateRequest from '../../middlewares/validateRequest.ts';
import catchAsync from '../../utils/catchAsync.ts';
import machineController from './machine.controller.ts';
import './machine.swagger.ts';
import {
  createMachineValidator,
  updateMachineValidator,
  getMachinesValidator,
  machineIdParamValidator,
  assignOperatorValidator,
  removeOperatorValidator,
} from './machine.validator.ts';

const machineRouter = express.Router();

machineRouter.use(authMiddleware);

// Custom authorization middleware for Machine & Operator management
const requireMachineManagementRoles = () => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const isAuthorized = req.user?.roles.some((role) =>
      ['System Administrator', 'Farm Manager'].includes(role.name)
    );

    if (!isAuthorized) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
        responseObject: null,
        statusCode: 403,
      });
      return;
    }

    next();
  };
};

// Machine Master routes
machineRouter.post(
  '/',
  requireMachineManagementRoles(),
  auditLogMiddleware({ event: 'MACHINE_CREATED', entityType: 'machine' }),
  createMachineValidator,
  validateRequest,
  catchAsync(machineController.createMachine)
);

machineRouter.get(
  '/',
  getMachinesValidator,
  validateRequest,
  catchAsync(machineController.getMachines)
);

machineRouter.get(
  '/:machineId',
  machineIdParamValidator,
  validateRequest,
  catchAsync(machineController.getMachineById)
);

machineRouter.patch(
  '/:machineId',
  requireMachineManagementRoles(),
  auditLogMiddleware({
    event: 'MACHINE_UPDATED',
    entityType: 'machine',
    getEntityId: (req) => String(req.params.machineId),
  }),
  updateMachineValidator,
  validateRequest,
  catchAsync(machineController.updateMachine)
);

machineRouter.patch(
  '/:machineId/toggle-status',
  requireMachineManagementRoles(),
  auditLogMiddleware({
    event: 'MACHINE_STATUS_TOGGLED',
    entityType: 'machine',
    getEntityId: (req) => String(req.params.machineId),
  }),
  machineIdParamValidator,
  validateRequest,
  catchAsync(machineController.toggleMachineStatus)
);

// Machine Operator Standing Assignment routes
machineRouter.post(
  '/:machineId/operators',
  requireMachineManagementRoles(),
  auditLogMiddleware({
    event: 'MACHINE_OPERATOR_ASSIGNED',
    entityType: 'machine',
    getEntityId: (req) => String(req.params.machineId),
  }),
  assignOperatorValidator,
  validateRequest,
  catchAsync(machineController.assignOperator)
);

machineRouter.get(
  '/:machineId/operators',
  machineIdParamValidator,
  validateRequest,
  catchAsync(machineController.getOperatorsForMachine)
);

machineRouter.delete(
  '/:machineId/operators/:workerId',
  requireMachineManagementRoles(),
  auditLogMiddleware({
    event: 'MACHINE_OPERATOR_REMOVED',
    entityType: 'machine',
    getEntityId: (req) => String(req.params.machineId),
  }),
  removeOperatorValidator,
  validateRequest,
  catchAsync(machineController.removeOperator)
);

export default machineRouter;
