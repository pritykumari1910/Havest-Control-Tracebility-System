import type { Request, Response } from 'express';
import handleServiceResponse from '../../utils/handleServiceResponse.ts';
import plotService from './plot.service.ts';
import type { PlotStatus } from '../../models/plot.model.ts';

class PlotController {
  constructor(private readonly service = plotService) {}

  createPlot = async (req: Request, res: Response): Promise<void> => {
    const { parentFarm, plotName, totalArea, avocadoVariety, status, comments } = req.body;

    const serviceResponse = await this.service.createPlot({
      parentFarm,
      plotName,
      totalArea,
      avocadoVariety,
      status,
      comments,
    });

    handleServiceResponse(serviceResponse, res);
  };

  getPlots = async (req: Request, res: Response): Promise<void> => {
    const { parentFarm, status, search, page, limit } = req.query as {
      parentFarm?: string;
      status?: PlotStatus;
      search?: string;
      page?: string;
      limit?: string;
    };

    const serviceResponse = await this.service.getPlots({
      parentFarm,
      status,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    handleServiceResponse(serviceResponse, res);
  };

  getPlotsByFarmId = async (req: Request, res: Response): Promise<void> => {
    const { farmId } = req.params;
    const { page, limit } = req.query as { page?: string; limit?: string };

    const serviceResponse = await this.service.getPlotsByFarmId(farmId as string, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    handleServiceResponse(serviceResponse, res);
  };

  getPlotById = async (req: Request, res: Response): Promise<void> => {
    const { plotId } = req.params;

    const serviceResponse = await this.service.getPlotById(plotId as string);

    handleServiceResponse(serviceResponse, res);
  };

  updatePlot = async (req: Request, res: Response): Promise<void> => {
    const { plotId } = req.params;
    const { parentFarm, plotName, totalArea, avocadoVariety, status, comments } = req.body;

    const serviceResponse = await this.service.updatePlot(plotId as string, {
      parentFarm,
      plotName,
      totalArea,
      avocadoVariety,
      status,
      comments,
    });

    handleServiceResponse(serviceResponse, res);
  };
}

export default new PlotController();
