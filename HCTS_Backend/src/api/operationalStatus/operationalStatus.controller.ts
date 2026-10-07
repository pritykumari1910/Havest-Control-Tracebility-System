import type { Request, Response } from 'express';
import handleServiceResponse from '../../utils/handleServiceResponse.ts';
import operationalStatusService from '../../services/operationalStatus.service.ts';

class OperationalStatusController {
  constructor(private readonly service = operationalStatusService) {}

  getOperationalStatus = async (req: Request, res: Response): Promise<void> => {
    const { date } = req.query as { date?: string };
    const serviceResponse = await this.service.getOperationalStatus(date);
    handleServiceResponse(serviceResponse, res);
  };
}

export default new OperationalStatusController();
