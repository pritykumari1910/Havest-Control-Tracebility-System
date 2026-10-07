import type { NextFunction, Request, Response } from 'express';
import handleServiceResponse from '../../utils/handleServiceResponse.ts';
import qrSeriesService from './qrSeries.service.ts';
import type { AuthRequest } from '../../middlewares/auth.ts';

class QrSeriesController {
  constructor(private readonly service = qrSeriesService) {}

  createSeries = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId || '';
    const serviceResponse = await this.service.createSeries(userId, req.body);
    handleServiceResponse(serviceResponse, res);
  };

  listSeries = async (req: Request, res: Response): Promise<void> => {
    const { status, search, page, limit } = req.query as {
      status?: any;
      search?: string;
      page?: string;
      limit?: string;
    };
    const serviceResponse = await this.service.listSeries({
      status,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    handleServiceResponse(serviceResponse, res);
  };

  getSeriesById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const serviceResponse = await this.service.getSeriesById(String(req.params.seriesId));
    handleServiceResponse(serviceResponse, res);
  };

  updatePrinterOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId || '';
    const serviceResponse = await this.service.updatePrinterOrder(String(req.params.seriesId), userId, req.body);
    handleServiceResponse(serviceResponse, res);
  };

  registerReceipt = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId || '';
    const serviceResponse = await this.service.registerReceipt(String(req.params.seriesId), userId, req.body);
    handleServiceResponse(serviceResponse, res);
  };

  activateSeries = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId || '';
    const serviceResponse = await this.service.activateSeries(String(req.params.seriesId), userId);
    handleServiceResponse(serviceResponse, res);
  };

  cancelSeries = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId || '';
    const serviceResponse = await this.service.cancelSeries(String(req.params.seriesId), userId);
    handleServiceResponse(serviceResponse, res);
  };

  exportCsv = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const csv = await this.service.exportCsv(String(req.params.seriesId));
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=qr-series-${req.params.seriesId}.csv`);
      res.status(200).send(csv);
    } catch (error: any) {
      next(error);
    }
  };

  exportPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doc = await this.service.exportPdf(String(req.params.seriesId));
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=qr-series-${req.params.seriesId}.pdf`);
      doc.pipe(res);
    } catch (error: any) {
      next(error);
    }
  };

  exportZip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const archive = await this.service.exportZip(String(req.params.seriesId));
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename=qr-series-${req.params.seriesId}.zip`);
      archive.pipe(res);
    } catch (error: any) {
      next(error);
    }
  };

  getInventory = async (req: Request, res: Response): Promise<void> => {
    const { seriesId, status, startDate, endDate, harvestAssignmentId, page, limit } = req.query as {
      seriesId?: string;
      status?: any;
      startDate?: string;
      endDate?: string;
      harvestAssignmentId?: string;
      page?: string;
      limit?: string;
    };
    const serviceResponse = await this.service.getInventory({
      seriesId,
      status,
      startDate,
      endDate,
      harvestAssignmentId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    handleServiceResponse(serviceResponse, res);
  };

  getSeriesSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const serviceResponse = await this.service.getSeriesSummary(String(req.params.seriesId));
    handleServiceResponse(serviceResponse, res);
  };

  updateSeries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { seriesId } = req.params;
    const { seriesName, comments, printerName } = req.body;
    const serviceResponse = await this.service.updateSeries(String(seriesId), { seriesName, comments, printerName });
    handleServiceResponse(serviceResponse, res);
  };
}

export default new QrSeriesController();
