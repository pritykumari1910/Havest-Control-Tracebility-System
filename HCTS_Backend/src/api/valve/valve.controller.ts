import type { Request, Response } from 'express';
import handleServiceResponse from '../../utils/handleServiceResponse.ts';
import valveService from './valve.service.ts';
import type { ValveStatus } from '../../models/valve.model.ts';

class ValveController {
  constructor(private readonly service = valveService) {}

  createValve = async (req: Request, res: Response): Promise<void> => {
    const { parentPlot, valveName, irrigationArea, avocadoVariety, status, comments } = req.body;

    const serviceResponse = await this.service.createValve({
      parentPlot,
      valveName,
      irrigationArea,
      avocadoVariety,
      status,
      comments,
    });

    handleServiceResponse(serviceResponse, res);
  };

  getValves = async (req: Request, res: Response): Promise<void> => {
    const { parentPlot, parentFarm, status, search, page, limit } = req.query as {
      parentPlot?: string;
      parentFarm?: string;
      status?: ValveStatus;
      search?: string;
      page?: string;
      limit?: string;
    };

    const serviceResponse = await this.service.getValves({
      parentPlot,
      parentFarm,
      status,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    handleServiceResponse(serviceResponse, res);
  };

  getValvesByPlotId = async (req: Request, res: Response): Promise<void> => {
    const { plotId } = req.params;
    const { page, limit } = req.query as { page?: string; limit?: string };

    const serviceResponse = await this.service.getValvesByPlotId(plotId as string, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    handleServiceResponse(serviceResponse, res);
  };

  getValveById = async (req: Request, res: Response): Promise<void> => {
    const { valveId } = req.params;

    const serviceResponse = await this.service.getValveById(valveId as string);

    handleServiceResponse(serviceResponse, res);
  };

  updateValve = async (req: Request, res: Response): Promise<void> => {
    const { valveId } = req.params;
    const { parentPlot, valveName, irrigationArea, avocadoVariety, status, comments } = req.body;

    const serviceResponse = await this.service.updateValve(valveId as string, {
      parentPlot,
      valveName,
      irrigationArea,
      avocadoVariety,
      status,
      comments,
    });

    handleServiceResponse(serviceResponse, res);
  };
}

export default new ValveController();
