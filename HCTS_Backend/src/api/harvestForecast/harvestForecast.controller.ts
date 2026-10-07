import type { NextFunction, Request, Response } from 'express';
import handleServiceResponse from '../../utils/handleServiceResponse.ts';
import harvestForecastService from './harvestForecast.service.ts';
import type { AuthRequest } from '../../middlewares/auth.ts';
import ServiceResponse from '../../utils/ServiceResponse.ts';
import httpStatus from 'http-status';

class HarvestForecastController {
  constructor(private readonly service = harvestForecastService) {}

  createForecast = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.userId || '';
    const serviceResponse = await this.service.createForecast(userId, req.body);
    handleServiceResponse(serviceResponse, res);
  };

  updateForecast = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.userId || '';
    const serviceResponse = await this.service.updateForecast(String(req.params.forecastId), req.body, userId);
    handleServiceResponse(serviceResponse, res);
  };

  getForecasts = async (req: Request, res: Response): Promise<void> => {
    const { campaignId, farmId, plotId, varietyId, status, page, limit } = req.query as {
      campaignId?: string;
      farmId?: string;
      plotId?: string;
      varietyId?: string;
      status?: any;
      page?: string;
      limit?: string;
    };

    const serviceResponse = await this.service.getForecasts({
      campaignId,
      farmId,
      plotId,
      varietyId,
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    handleServiceResponse(serviceResponse, res);
  };

  bulkUploadForecast = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.userId || '';
    const fileBuffer = req.file?.buffer;

    if (!fileBuffer) {
      const response = ServiceResponse.failure('No template file uploaded', null, httpStatus.BAD_REQUEST);
      handleServiceResponse(response, res);
      return;
    }

    const serviceResponse = await this.service.bulkUploadForecast(userId, fileBuffer);
    handleServiceResponse(serviceResponse, res);
  };

  getProgressDashboard = async (req: Request, res: Response): Promise<void> => {
    const { campaignId } = req.query as { campaignId?: string };
    const serviceResponse = await this.service.getProgressDashboard({ campaignId });
    handleServiceResponse(serviceResponse, res);
  };

  seedMockReceipts = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.seedMockReceipts(req.body);
    handleServiceResponse(serviceResponse, res);
  };
}

export default new HarvestForecastController();
