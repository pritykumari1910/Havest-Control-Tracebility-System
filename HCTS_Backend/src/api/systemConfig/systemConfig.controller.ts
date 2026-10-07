import type { Request, Response } from 'express';
import handleServiceResponse from '../../utils/handleServiceResponse.ts';
import systemConfigService from './systemConfig.service.ts';
import type { AuthRequest } from '../../middlewares/auth.ts';

class SystemConfigController {
  constructor(private readonly service = systemConfigService) {}

  getParameters = async (req: Request, res: Response): Promise<void> => {
    const { search, page, limit } = req.query as {
      search?: string;
      page?: string;
      limit?: string;
    };
    const serviceResponse = await this.service.getParameters({
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    handleServiceResponse(serviceResponse, res);
  };

  getParameterById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const serviceResponse = await this.service.getParameterById(id as string);
    handleServiceResponse(serviceResponse, res);
  };

  getParameterByKey = async (req: Request, res: Response): Promise<void> => {
    const { key } = req.params;
    const serviceResponse = await this.service.getParameterByKey(key as string);
    handleServiceResponse(serviceResponse, res);
  };

  createParameter = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.createParameter(
      req.body,
      (req as AuthRequest).user?.userId || ''
    );
    handleServiceResponse(serviceResponse, res);
  };

  updateParameter = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const serviceResponse = await this.service.updateParameter(
      id as string,
      req.body,
      (req as AuthRequest).user?.userId || ''
    );
    handleServiceResponse(serviceResponse, res);
  };

  deleteParameter = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const serviceResponse = await this.service.deleteParameter(id as string);
    handleServiceResponse(serviceResponse, res);
  };
}

export default new SystemConfigController();
