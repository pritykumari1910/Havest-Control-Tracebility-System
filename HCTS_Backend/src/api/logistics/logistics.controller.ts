import type { Request, Response } from 'express';
import handleServiceResponse from '../../utils/handleServiceResponse.ts';
import logisticsService, { LogisticsService } from './logistics.service.ts';
import reportsService from '../reports/reports.service.ts';
import type { AuthRequest } from '../../middlewares/auth.ts';

class LogisticsController {
  constructor(private readonly service = logisticsService) {}

  // ==========================================
  // BUYERS
  // ==========================================
  createBuyer = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.createBuyer(req.body);
    handleServiceResponse(serviceResponse, res);
  };

  updateBuyer = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.updateBuyer(String(req.params.buyerId), req.body);
    handleServiceResponse(serviceResponse, res);
  };

  getBuyers = async (req: Request, res: Response): Promise<void> => {
    const { status, search, page, limit } = req.query as {
      status?: any;
      search?: string;
      page?: string;
      limit?: string;
    };
    const serviceResponse = await this.service.getBuyers({
      status,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    handleServiceResponse(serviceResponse, res);
  };

  // ==========================================
  // DESTINATIONS
  // ==========================================
  createDestinationCenter = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.createDestinationCenter(req.body);
    handleServiceResponse(serviceResponse, res);
  };

  updateDestinationCenter = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.updateDestinationCenter(String(req.params.destId), req.body);
    handleServiceResponse(serviceResponse, res);
  };

  getDestinationCenters = async (req: Request, res: Response): Promise<void> => {
    const { status, search, page, limit } = req.query as {
      status?: any;
      search?: string;
      page?: string;
      limit?: string;
    };
    const serviceResponse = await this.service.getDestinationCenters({
      status,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    handleServiceResponse(serviceResponse, res);
  };

  // ==========================================
  // TRANSPORT PROVIDERS
  // ==========================================
  createTransportProvider = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.createTransportProvider(req.body);
    handleServiceResponse(serviceResponse, res);
  };

  updateTransportProvider = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.updateTransportProvider(String(req.params.providerId), req.body);
    handleServiceResponse(serviceResponse, res);
  };

  getTransportProviders = async (req: Request, res: Response): Promise<void> => {
    const { status, search, page, limit } = req.query as {
      status?: any;
      search?: string;
      page?: string;
      limit?: string;
    };
    const serviceResponse = await this.service.getTransportProviders({
      status,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    handleServiceResponse(serviceResponse, res);
  };

  // ==========================================
  // DISPATCH NOTES
  // ==========================================
  createDispatchNote = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.createDispatchNote(req.body);
    handleServiceResponse(serviceResponse, res);
  };

  updateDispatchNote = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.updateDispatchNote(
      String(req.params.noteId),
      req.body
    );
    handleServiceResponse(serviceResponse, res);
  };

  getDispatchNotes = async (req: Request, res: Response): Promise<void> => {
    const { status, campaign, buyer, page, limit } = req.query as {
      status?: any;
      campaign?: string;
      buyer?: string;
      page?: string;
      limit?: string;
    };
    const serviceResponse = await this.service.getDispatchNotes({
      status,
      campaign,
      buyer,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    handleServiceResponse(serviceResponse, res);
  };

  getDispatchNoteById = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.getDispatchNoteById(String(req.params.noteId));
    handleServiceResponse(serviceResponse, res);
  };

  associateBins = async (req: Request, res: Response): Promise<void> => {
    const actorId = (req as AuthRequest).user?.userId ?? '';
    const serviceResponse = await this.service.associateBins(
      String(req.params.noteId),
      req.body,
      actorId
    );
    handleServiceResponse(serviceResponse, res);
  };

  removeBinFromNote = async (req: Request, res: Response): Promise<void> => {
    const actorId = (req as AuthRequest).user?.userId ?? '';
    const serviceResponse = await this.service.removeBinFromNote(
      String(req.params.noteId),
      String(req.params.binId),
      req.body,
      actorId
    );
    handleServiceResponse(serviceResponse, res);
  };

  closeDispatchNote = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.closeDispatchNote(String(req.params.noteId));
    handleServiceResponse(serviceResponse, res);
  };

  reopenDispatchNote = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.reopenDispatchNote(String(req.params.noteId));
    handleServiceResponse(serviceResponse, res);
  };

  getDispatchNoteSummary = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.getDispatchNoteSummary(String(req.params.noteId));
    handleServiceResponse(serviceResponse, res);
  };

  exportDispatchNoteSummary = async (req: Request, res: Response): Promise<void> => {
    const format = (req.query.format as 'pdf' | 'excel' | 'csv') ?? 'pdf';
    const result = await this.service.exportDispatchNoteSummary(String(req.params.noteId), format);

    if (!result) {
      res.status(404).json({ success: false, message: 'Dispatch Note not found or export failed' });
      return;
    }

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  };

  // ==========================================
  // TRANSFER ORDERS
  // ==========================================
  createTransferOrder = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.createTransferOrder(req.body);
    handleServiceResponse(serviceResponse, res);
  };

  getTransferOrders = async (req: Request, res: Response): Promise<void> => {
    const { page, limit } = req.query as { page?: string; limit?: string };
    const serviceResponse = await this.service.getTransferOrders({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    handleServiceResponse(serviceResponse, res);
  };

  getTransferOrderById = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.getTransferOrderById(String(req.params.id));
    handleServiceResponse(serviceResponse, res);
  };

  updateTransferOrderStatus = async (req: Request, res: Response): Promise<void> => {
    const { status } = req.body;
    const serviceResponse = await this.service.updateTransferOrderStatus(String(req.params.id), status);
    handleServiceResponse(serviceResponse, res);
  };

  recordDefinitiveWeight = async (req: Request, res: Response): Promise<void> => {
    const { definitiveWeight } = req.body;
    const serviceResponse = await this.service.recordDefinitiveWeight(String(req.params.id), Number(definitiveWeight));
    handleServiceResponse(serviceResponse, res);
  };

  exportTransferOrder = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.exportTransferOrderPdf(String(req.params.id));

    if (!result) {
      res.status(404).json({ success: false, message: 'Transfer Order not found' });
      return;
    }

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  };

  getDispatchNotesReport = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await reportsService.getDispatchNotes(req.query as any);
    handleServiceResponse(serviceResponse, res);
  };
}

export default new LogisticsController();
