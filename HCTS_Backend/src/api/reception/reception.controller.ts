import type { Request, Response } from 'express';
import handleServiceResponse from '../../utils/handleServiceResponse.ts';
import receptionService from './reception.service.ts';
import type { AuthRequest } from '../../middlewares/auth.ts';

class ReceptionController {
  constructor(private readonly service = receptionService) {}

  createBatch = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.createReceptionBatch(req.body, (req as AuthRequest).user?.userId || '');
    handleServiceResponse(serviceResponse, res);
  };

  scanBin = async (req: Request, res: Response): Promise<void> => {
    const { batchId } = req.params;
    const { qrCode } = req.body;
    const serviceResponse = await this.service.scanHarvestBin(
      batchId as string,
      qrCode as string,
      (req as AuthRequest).user?.userId || ''
    );
    handleServiceResponse(serviceResponse, res);
  };

  closeBatch = async (req: Request, res: Response): Promise<void> => {
    const { batchId } = req.params;
    const serviceResponse = await this.service.closeReceptionBatch(batchId as string, (req as AuthRequest).user?.userId || '');
    handleServiceResponse(serviceResponse, res);
  };

  updateBatch = async (req: Request, res: Response): Promise<void> => {
    const { batchId } = req.params;
    const serviceResponse = await this.service.updateBatch(batchId as string, req.body);
    handleServiceResponse(serviceResponse, res);
  };

  getBatches = async (req: Request, res: Response): Promise<void> => {
    const { status, page, limit } = req.query as {
      status?: 'open' | 'closed';
      page?: string;
      limit?: string;
    };
    const serviceResponse = await this.service.getReceptionBatches({
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    handleServiceResponse(serviceResponse, res);
  };

  getScans = async (req: Request, res: Response): Promise<void> => {
    const { batchId } = req.params;
    const serviceResponse = await this.service.getBatchScans(batchId as string);
    handleServiceResponse(serviceResponse, res);
  };

  getReceivedInventory = async (req: Request, res: Response): Promise<void> => {
    const { batchId, crewId, machineId, varietyId, date, page, limit } = req.query as {
      batchId?: string;
      crewId?: string;
      machineId?: string;
      varietyId?: string;
      date?: string;
      page?: string;
      limit?: string;
    };
    const serviceResponse = await this.service.getReceivedBinInventory({
      batchId,
      crewId,
      machineId,
      varietyId,
      date,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    handleServiceResponse(serviceResponse, res);
  };

  createIncident = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as AuthRequest).user?.userId || '';
    const serviceResponse = await this.service.createBinIncident(req.body, userId);
    handleServiceResponse(serviceResponse, res);
  };

  getIncidents = async (req: Request, res: Response): Promise<void> => {
    const { qrCode, receptionBatchId, category, date, page, limit } = req.query as {
      qrCode?: string;
      receptionBatchId?: string;
      category?: string;
      date?: string;
      page?: string;
      limit?: string;
    };
    const serviceResponse = await this.service.getBinIncidents({
      qrCode,
      receptionBatchId,
      category,
      date,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    handleServiceResponse(serviceResponse, res);
  };
}

export default new ReceptionController();
