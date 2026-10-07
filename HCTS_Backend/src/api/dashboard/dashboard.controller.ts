import type { Request, Response } from 'express';
import handleServiceResponse from '../../utils/handleServiceResponse.ts';
import dashboardService from './dashboard.service.ts';

class DashboardController {
  constructor(private readonly service = dashboardService) {}

  getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
    const { userRoleId, userRole, date } = req.query as {
      userRoleId?: string;
      userRole?: string;
      date?: string;
    };

    const serviceResponse = await this.service.getDashboardSummary({ userRoleId, userRole, date });
    handleServiceResponse(serviceResponse, res);
  };
}

export default new DashboardController();
