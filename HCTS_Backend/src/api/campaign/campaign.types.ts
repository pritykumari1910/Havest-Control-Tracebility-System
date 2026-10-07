import type { ICampaign, CampaignStatus } from '../../models/campaign.model.ts';

export interface CreateCampaignBody {
  campaignName: string;
  startDate: string | Date;
  estimatedEndDate: string | Date;
  status?: CampaignStatus;
  comments?: string;
}

export interface UpdateCampaignBody {
  campaignName?: string;
  startDate?: string | Date;
  estimatedEndDate?: string | Date;
  status?: CampaignStatus;
  comments?: string;
}

export interface CampaignListFilters {
  status?: CampaignStatus;
  campaignName?: string;
  page?: number;
  limit?: number;
}

export type CampaignDocument = ICampaign;
