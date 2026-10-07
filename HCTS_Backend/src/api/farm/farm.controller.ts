import type { Request, Response } from 'express';
import handleServiceResponse from '../../utils/handleServiceResponse.ts';
import farmService from './farm.service.ts';
import type { FarmStatus } from '../../models/farm.model.ts';

class FarmController {
  constructor(private readonly service = farmService) {}

  createFarm = async (req: Request, res: Response): Promise<void> => {
    const { farmName, totalHectares, status, comments } = req.body;

    const serviceResponse = await this.service.createFarm({
      farmName,
      totalHectares,
      status,
      comments,
    });

    handleServiceResponse(serviceResponse, res);
  };

  getFarms = async (req: Request, res: Response): Promise<void> => {
    const { status, search, page, limit } = req.query as {
      status?: FarmStatus;
      search?: string;
      page?: string;
      limit?: string;
    };

    const serviceResponse = await this.service.getFarms({
      status,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    handleServiceResponse(serviceResponse, res);
  };

  getFarmById = async (req: Request, res: Response): Promise<void> => {
    const { farmId } = req.params;

    const serviceResponse = await this.service.getFarmById(farmId as string);

    handleServiceResponse(serviceResponse, res);
  };

  updateFarm = async (req: Request, res: Response): Promise<void> => {
    const { farmId } = req.params;
    const { farmName, totalHectares, status, comments } = req.body;

    const serviceResponse = await this.service.updateFarm(farmId as string, {
      farmName,
      totalHectares,
      status,
      comments,
    });

    handleServiceResponse(serviceResponse, res);
  };
}

export default new FarmController();
