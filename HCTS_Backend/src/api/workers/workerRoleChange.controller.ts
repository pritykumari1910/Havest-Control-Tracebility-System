import type { Request, Response } from 'express';
import handleServiceResponse from '../../utils/handleServiceResponse.ts';
import workerRoleChangeService from './workerRoleChange.service.ts';
import type { AuthRequest } from '../../middlewares/auth.ts';

class WorkerRoleChangeController {
  constructor(private readonly service = workerRoleChangeService) {}

  changeRole = async (req: Request, res: Response): Promise<void> => {
    const { workerId } = req.params;
    const serviceResponse = await this.service.processRoleChange(
      workerId as string,
      req.body,
      (req as AuthRequest).user?.userId || ''
    );
    handleServiceResponse(serviceResponse, res);
  };
}

export default new WorkerRoleChangeController();
