import type { Request, Response } from 'express';
import handleServiceResponse from '../../utils/handleServiceResponse.ts';
import satelliteStaffService from './satelliteStaff.service.ts';
import type { AuthRequest } from '../../middlewares/auth.ts';

class SatelliteStaffController {
  constructor(private readonly service = satelliteStaffService) {}

  registerStaff = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.registerSatelliteStaff(req.body, (req as AuthRequest).user?.userId || '');
    handleServiceResponse(serviceResponse, res);
  };

  getDailyStaff = async (req: Request, res: Response): Promise<void> => {
    const { workDate, satelliteRoleId, farmId, campaignId, page, limit } = req.query as {
      workDate?: string;
      satelliteRoleId?: string;
      farmId?: string;
      campaignId?: string;
      page?: string;
      limit?: string;
    };

    const serviceResponse = await this.service.getDailySatelliteStaff({
      workDate,
      satelliteRoleId,
      farmId,
      campaignId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    handleServiceResponse(serviceResponse, res);
  };

  bulkSyncStaff = async (req: Request, res: Response): Promise<void> => {
    const { records } = req.body;
    const serviceResponse = await this.service.bulkSyncSatelliteStaff(records || [], (req as AuthRequest).user?.userId || '');
    handleServiceResponse(serviceResponse, res);
  };
  updateStaff = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const serviceResponse = await this.service.updateSatelliteStaff(id as string, req.body, (req as AuthRequest).user?.userId || '');
    handleServiceResponse(serviceResponse, res);
  };

  getStaffReport = async (req: Request, res: Response): Promise<void> => {
    const { workDate } = req.query as { workDate?: string };
    const serviceResponse = await this.service.getSatelliteStaffReport(workDate);
    handleServiceResponse(serviceResponse, res);
  };

  checkIn = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { entryTime } = req.body;
    const serviceResponse = await this.service.checkInStaff(
      id as string,
      entryTime,
      (req as AuthRequest).user?.userId || ''
    );
    handleServiceResponse(serviceResponse, res);
  };

  checkOut = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { exitTime } = req.body;
    const serviceResponse = await this.service.checkOutStaff(
      id as string,
      exitTime,
      (req as AuthRequest).user?.userId || ''
    );
    handleServiceResponse(serviceResponse, res);
  };
}

export default new SatelliteStaffController();
