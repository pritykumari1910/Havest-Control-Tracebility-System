import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { CampaignStatus } from '../../models/campaign.model.ts';
import ServiceResponse from '../../utils/ServiceResponse.ts';
import dashboardEventPublisher, { DashboardEntity } from '../../events/dashboard.publisher.ts';
import campaignRepository from './campaign.repository.ts';
import type { CreateCampaignBody, CampaignListFilters, UpdateCampaignBody } from './campaign.types.ts';

const CAMPAIGN_MESSAGES = {
  CREATE_SUCCESS: 'Campaign created successfully',
  FETCH_SUCCESS: 'Campaigns fetched successfully',
  FETCH_ONE_SUCCESS: 'Campaign fetched successfully',
  UPDATE_SUCCESS: 'Campaign updated successfully',
  NOT_FOUND: 'Campaign not found',
  DUPLICATE_NAME: 'Campaign name must be unique',
  ACTIVE_EXISTS: 'An active campaign already exists. Please close it first.',
} as const;

class CampaignService {
  private generateCampaignCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `CAMP-${code}`;
  }

  private async getUniqueCampaignCode(): Promise<string> {
    let attempts = 0;
    while (attempts < 10) {
      const code = this.generateCampaignCode();
      const exists = await campaignRepository.findByCode(code);
      if (!exists) {
        return code;
      }
      attempts++;
    }
    throw new Error('Failed to generate a unique campaign code');
  }

  async createCampaign(payload: CreateCampaignBody) {
    const { campaignName, startDate, estimatedEndDate, status = CampaignStatus.DRAFT, comments } = payload;

    const nameExists = await campaignRepository.findByName(campaignName);
    if (nameExists) {
      return ServiceResponse.failure(CAMPAIGN_MESSAGES.DUPLICATE_NAME, null, httpStatus.BAD_REQUEST);
    }

    if (status === CampaignStatus.ACTIVE) {
      const activeCampaign = await campaignRepository.findActive();
      if (activeCampaign) {
        return ServiceResponse.failure(CAMPAIGN_MESSAGES.ACTIVE_EXISTS, null, httpStatus.BAD_REQUEST);
      }
    }

    const campaignCode = await this.getUniqueCampaignCode();

    const campaign = await campaignRepository.create({
      campaignName,
      campaignCode,
      startDate: new Date(startDate),
      estimatedEndDate: new Date(estimatedEndDate),
      status,
      comments,
    });

    dashboardEventPublisher.publishCreated(DashboardEntity.CAMPAIGN, String(campaign._id));

    return ServiceResponse.success(CAMPAIGN_MESSAGES.CREATE_SUCCESS, campaign, httpStatus.CREATED);
  }

  async getCampaigns(filters: CampaignListFilters) {
    const query: any = {};
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.campaignName) {
      query.campaignName = { $regex: filters.campaignName, $options: 'i' };
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 10);
    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      campaignRepository.findWithPagination(query, skip, limit),
      campaignRepository.count(query),
    ]);

    const result = {
      campaigns,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    return ServiceResponse.success(CAMPAIGN_MESSAGES.FETCH_SUCCESS, result, httpStatus.OK);
  }

  async getCampaignById(campaignId: string) {
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return ServiceResponse.failure(CAMPAIGN_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) {
      return ServiceResponse.failure(CAMPAIGN_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    return ServiceResponse.success(CAMPAIGN_MESSAGES.FETCH_ONE_SUCCESS, campaign, httpStatus.OK);
  }

  async updateCampaign(campaignId: string, payload: UpdateCampaignBody) {
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return ServiceResponse.failure(CAMPAIGN_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) {
      return ServiceResponse.failure(CAMPAIGN_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    if (payload.campaignName && payload.campaignName !== campaign.campaignName) {
      const nameExists = await campaignRepository.findByName(payload.campaignName);
      if (nameExists) {
        return ServiceResponse.failure(CAMPAIGN_MESSAGES.DUPLICATE_NAME, null, httpStatus.BAD_REQUEST);
      }
    }

    if (payload.status === CampaignStatus.ACTIVE) {
      const activeCampaign = await campaignRepository.findActive();
      if (activeCampaign && activeCampaign._id.toString() !== campaignId) {
        return ServiceResponse.failure(CAMPAIGN_MESSAGES.ACTIVE_EXISTS, null, httpStatus.BAD_REQUEST);
      }
    }

    if (payload.campaignName !== undefined) campaign.campaignName = payload.campaignName;
    if (payload.startDate !== undefined) campaign.startDate = new Date(payload.startDate);
    if (payload.estimatedEndDate !== undefined) campaign.estimatedEndDate = new Date(payload.estimatedEndDate);
    if (payload.status !== undefined) campaign.status = payload.status;
    if (payload.comments !== undefined) campaign.comments = payload.comments;

    await campaign.save();

    dashboardEventPublisher.publishUpdated(DashboardEntity.CAMPAIGN, String(campaign._id));

    return ServiceResponse.success(CAMPAIGN_MESSAGES.UPDATE_SUCCESS, campaign, httpStatus.OK);
  }
}

export default new CampaignService();
