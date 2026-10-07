import type { Request, Response } from 'express';
import handleServiceResponse from '../../utils/handleServiceResponse.ts';
import varietyService from './variety.service.ts';
import type { VarietyStatus, VarietyType } from '../../models/variety.model.ts';

class VarietyController {
  constructor(private readonly service = varietyService) {}

  createVariety = async (req: Request, res: Response): Promise<void> => {
    const { varietyName, varietyType, otherVarietyType, status, technicalComments } = req.body;

    const serviceResponse = await this.service.createVariety({
      varietyName,
      varietyType,
      otherVarietyType,
      status,
      technicalComments,
    });

    handleServiceResponse(serviceResponse, res);
  };

  getVarieties = async (req: Request, res: Response): Promise<void> => {
    const { varietyType, status } = req.query as {
      varietyType?: VarietyType;
      status?: VarietyStatus;
    };

    const serviceResponse = await this.service.getVarieties({ varietyType, status });

    handleServiceResponse(serviceResponse, res);
  };

  getVarietyById = async (req: Request, res: Response): Promise<void> => {
    const { varietyId } = req.params;

    const serviceResponse = await this.service.getVarietyById(varietyId as string);

    handleServiceResponse(serviceResponse, res);
  };

  updateVariety = async (req: Request, res: Response): Promise<void> => {
    const { varietyId } = req.params;
    const { varietyName, varietyType, otherVarietyType, status, technicalComments } = req.body;

    const serviceResponse = await this.service.updateVariety(varietyId as string, {
      varietyName,
      varietyType,
      otherVarietyType,
      status,
      technicalComments,
    });

    handleServiceResponse(serviceResponse, res);
  };
}

export default new VarietyController();
