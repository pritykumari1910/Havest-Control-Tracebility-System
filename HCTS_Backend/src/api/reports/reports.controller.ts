import type { Request, Response } from 'express';
import handleServiceResponse from '../../utils/handleServiceResponse.ts';
import reportsService from './reports.service.ts';
import type {
  HarvestProgressFilters,
  ForecastVsActualFilters,
  HarvestReceiptScanReportFilters,
  TransferOrderReportFilters,
  DispatchNoteReportFilters,
} from './reports.types.ts';

class ReportsController {
  constructor(private readonly service = reportsService) {}

  getHarvestProgress = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.getHarvestProgress(req.query as unknown as HarvestProgressFilters);
    handleServiceResponse(serviceResponse, res);
  };

  exportHarvestProgress = async (req: Request, res: Response): Promise<void> => {
    await this.service.exportHarvestProgress(req.query as unknown as HarvestProgressFilters, res);
  };

  getForecastVsActual = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.getForecastVsActual(req.query as unknown as ForecastVsActualFilters);
    handleServiceResponse(serviceResponse, res);
  };

  getHarvestReceiptScans = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.getHarvestReceiptScans(
      req.query as unknown as HarvestReceiptScanReportFilters
    );
    handleServiceResponse(serviceResponse, res);
  };

  getTransferOrders = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.getTransferOrders(
      req.query as unknown as TransferOrderReportFilters
    );
    handleServiceResponse(serviceResponse, res);
  };

  getDispatchNotes = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.getDispatchNotes(
      req.query as unknown as DispatchNoteReportFilters
    );
    handleServiceResponse(serviceResponse, res);
  };

  exportDispatchNotes = async (req: Request, res: Response): Promise<void> => {
    await this.service.exportDispatchNotes(req.query as unknown as DispatchNoteReportFilters, res);
  };
}

export default new ReportsController();
