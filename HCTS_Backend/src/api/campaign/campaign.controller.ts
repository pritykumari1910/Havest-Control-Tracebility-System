import type { Request, Response } from 'express';
import handleServiceResponse from '../../utils/handleServiceResponse.ts';
import campaignService from './campaign.service.ts';
import type { CampaignStatus } from '../../models/campaign.model.ts';

class CampaignController {
  constructor(private readonly service = campaignService) {}

  createCampaign = async (req: Request, res: Response): Promise<void> => {
    const { campaignName, startDate, estimatedEndDate, status, comments } = req.body;

    const serviceResponse = await this.service.createCampaign({
      campaignName,
      startDate,
      estimatedEndDate,
      status,
      comments,
    });

    handleServiceResponse(serviceResponse, res);
  };

  getCampaigns = async (req: Request, res: Response): Promise<void> => {
    const { status, campaignName, page, limit } = req.query as {
      status?: CampaignStatus;
      campaignName?: string;
      page?: string;
      limit?: string;
    };

    const serviceResponse = await this.service.getCampaigns({
      status,
      campaignName,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    handleServiceResponse(serviceResponse, res);
  };

  getCampaignById = async (req: Request, res: Response): Promise<void> => {
    const { campaignId } = req.params;

    const serviceResponse = await this.service.getCampaignById(campaignId as string);

    handleServiceResponse(serviceResponse, res);
  };

  updateCampaign = async (req: Request, res: Response): Promise<void> => {
    const { campaignId } = req.params;
    const { campaignName, startDate, estimatedEndDate, status, comments } = req.body;

    const serviceResponse = await this.service.updateCampaign(campaignId as string, {
      campaignName,
      startDate,
      estimatedEndDate,
      status,
      comments,
    });

    handleServiceResponse(serviceResponse, res);
  };
}

export default new CampaignController();
