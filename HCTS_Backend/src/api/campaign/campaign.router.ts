import express from 'express';
import { authMiddleware, requirePermission, requireSystemAdminRole } from '../../middlewares/auth.ts';
import { auditLogMiddleware } from '../../middlewares/auditLog.ts';
import validateRequest from '../../middlewares/validateRequest.ts';
import catchAsync from '../../utils/catchAsync.ts';
import campaignController from './campaign.controller.ts';
import {
  createCampaignValidator,
  updateCampaignValidator,
  campaignIdParamValidator,
  getCampaignsValidator,
} from './campaign.validator.ts';
import './campaign.swagger.ts';

const campaignRouter = express.Router();

campaignRouter.use(authMiddleware);

campaignRouter.post(
  '/',
  requirePermission('campaign_management'),
  requireSystemAdminRole(),
  auditLogMiddleware({
    event: 'CAMPAIGN_CREATED',
    entityType: 'campaign',
  }),
  createCampaignValidator,
  validateRequest,
  catchAsync(campaignController.createCampaign)
);

campaignRouter.get(
  '/',
  getCampaignsValidator,
  validateRequest,
  catchAsync(campaignController.getCampaigns)
);

campaignRouter.get(
  '/:campaignId',
  campaignIdParamValidator,
  validateRequest,
  catchAsync(campaignController.getCampaignById)
);

campaignRouter.patch(
  '/:campaignId',
  requirePermission('campaign_management'),
  requireSystemAdminRole(),
  auditLogMiddleware({
    event: (req) => {
      if (req.body.status === 'active') {
        return 'CAMPAIGN_ACTIVATED';
      }
      if (req.body.status === 'closed') {
        return 'CAMPAIGN_CLOSED';
      }
      return 'CAMPAIGN_UPDATED';
    },
    entityType: 'campaign',
    getEntityId: (req) => String(req.params.campaignId),
  }),
  updateCampaignValidator,
  validateRequest,
  catchAsync(campaignController.updateCampaign)
);

export default campaignRouter;
