import type { Request, Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.ts';
import handleServiceResponse from '../../utils/handleServiceResponse.ts';
import unassignedBinQueueService from './unassignedBinQueue.service.ts';
import type {
  UnassignedBinQueueListFilters,
  ResolveQueueItemPayload,
  RejectQueueItemPayload,
} from './unassignedBinQueue.types.ts';

class UnassignedBinQueueController {
  constructor(private readonly service = unassignedBinQueueService) {}

  getQueue = async (req: Request, res: Response): Promise<void> => {
    const filters = req.query as unknown as UnassignedBinQueueListFilters;
    const serviceResponse = await this.service.getQueue(filters);
    handleServiceResponse(serviceResponse, res);
  };

  getQueueStats = async (req: Request, res: Response): Promise<void> => {
    const { campaignId } = req.query as { campaignId?: string };
    const serviceResponse = await this.service.getQueueStats(campaignId);
    handleServiceResponse(serviceResponse, res);
  };

  getQueueItemById = async (req: Request, res: Response): Promise<void> => {
    const queueItemId = String(req.params.queueItemId);
    const serviceResponse = await this.service.getQueueItemById(queueItemId);
    handleServiceResponse(serviceResponse, res);
  };

  resolveQueueItem = async (req: AuthRequest, res: Response): Promise<void> => {
    const queueItemId = String(req.params.queueItemId);
    const payload = req.body as ResolveQueueItemPayload;
    const userId = String(req.user?.userId);
    const serviceResponse = await this.service.resolveQueueItem(queueItemId, payload, userId);
    handleServiceResponse(serviceResponse, res);
  };

  rejectQueueItem = async (req: AuthRequest, res: Response): Promise<void> => {
    const queueItemId = String(req.params.queueItemId);
    const payload = req.body as RejectQueueItemPayload;
    const userId = String(req.user?.userId);
    const serviceResponse = await this.service.rejectQueueItem(queueItemId, payload, userId);
    handleServiceResponse(serviceResponse, res);
  };
}

export default new UnassignedBinQueueController();
