import express from 'express';
import { authMiddleware } from '../../middlewares/auth.ts';
import validateRequest from '../../middlewares/validateRequest.ts';
import catchAsync from '../../utils/catchAsync.ts';
import dashboardController from './dashboard.controller.ts';
import './dashboard.swagger.ts';
import { getDashboardSummaryValidator } from './dashboard.validator.ts';

const dashboardRouter = express.Router();

dashboardRouter.use(authMiddleware);

dashboardRouter.get(
  '/',
  getDashboardSummaryValidator,
  validateRequest,
  catchAsync(dashboardController.getDashboardSummary)
);

export default dashboardRouter;
