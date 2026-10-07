import express from 'express';
import { authMiddleware } from '../../middlewares/auth.ts';
import validateRequest from '../../middlewares/validateRequest.ts';
import catchAsync from '../../utils/catchAsync.ts';
import operationalStatusController from './operationalStatus.controller.ts';
import './operationalStatus.swagger.ts';
import { getOperationalStatusValidator } from './operationalStatus.validator.ts';

const operationalStatusRouter = express.Router();

operationalStatusRouter.use(authMiddleware);

operationalStatusRouter.get(
  '/',
  getOperationalStatusValidator,
  validateRequest,
  catchAsync(operationalStatusController.getOperationalStatus)
);

export default operationalStatusRouter;
