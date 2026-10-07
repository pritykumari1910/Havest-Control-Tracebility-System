import type { Request, Response } from 'express';
import handleServiceResponse from '../../utils/handleServiceResponse.ts';
import parkService from './park.service.ts';
import type { ParkStatus } from '../../models/park.model.ts';

class ParkController {
  constructor(private readonly service = parkService) {}

  createPark = async (req: Request, res: Response): Promise<void> => {
    const { parentValve, parkName, rowRange, area, avocadoVariety, status, comments } = req.body;

    const serviceResponse = await this.service.createPark({
      parentValve,
      parkName,
      rowRange,
      area,
      avocadoVariety,
      status,
      comments,
    });

    handleServiceResponse(serviceResponse, res);
  };

  getParks = async (req: Request, res: Response): Promise<void> => {
    const { parentValve, parentPlot, parentFarm, status, search, page, limit } = req.query as {
      parentValve?: string;
      parentPlot?: string;
      parentFarm?: string;
      status?: ParkStatus;
      search?: string;
      page?: string;
      limit?: string;
    };

    const serviceResponse = await this.service.getParks({
      parentValve,
      parentPlot,
      parentFarm,
      status,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    handleServiceResponse(serviceResponse, res);
  };

  getParksByValveId = async (req: Request, res: Response): Promise<void> => {
    const { valveId } = req.params;
    const { page, limit } = req.query as { page?: string; limit?: string };

    const serviceResponse = await this.service.getParksByValveId(valveId as string, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    handleServiceResponse(serviceResponse, res);
  };

  getParkById = async (req: Request, res: Response): Promise<void> => {
    const { parkId } = req.params;

    const serviceResponse = await this.service.getParkById(parkId as string);

    handleServiceResponse(serviceResponse, res);
  };

  updatePark = async (req: Request, res: Response): Promise<void> => {
    const { parkId } = req.params;
    const { parentValve, parkName, rowRange, area, avocadoVariety, status, comments } = req.body;

    const serviceResponse = await this.service.updatePark(parkId as string, {
      parentValve,
      parkName,
      rowRange,
      area,
      avocadoVariety,
      status,
      comments,
    });

    handleServiceResponse(serviceResponse, res);
  };
}

export default new ParkController();
