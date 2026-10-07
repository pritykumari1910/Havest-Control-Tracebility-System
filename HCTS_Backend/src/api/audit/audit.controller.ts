import type { NextFunction, Request, Response } from 'express';
import handleServiceResponse from '../../utils/handleServiceResponse.ts';
import auditService from '../../services/audit.service.ts';

class AuditController {
  constructor(private readonly service = auditService) {}

  getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {
      search,
      q,
      action,
      event,
      userEmail,
      email,
      actorEmail,
      teamCategory,
      entityType,
      entityId,
      startDate,
      endDate,
      page,
      limit,
    } = req.query as {
      search?: string;
      q?: string;
      action?: string;
      event?: string;
      userEmail?: string;
      email?: string;
      actorEmail?: string;
      teamCategory?: string;
      entityType?: string;
      entityId?: string;
      startDate?: string;
      endDate?: string;
      page?: string;
      limit?: string;
    };

    const serviceResponse = await this.service.getAuditLogs({
      search: search || q,
      action: action || event,
      userEmail: userEmail || email || actorEmail,
      teamCategory,
      entityType,
      entityId,
      startDate,
      endDate,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    handleServiceResponse(serviceResponse, res);
  };

  getFarmManagerLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { search, action, userEmail, entityType, entityId, startDate, endDate, page, limit } = req.query as any;
    const serviceResponse = await this.service.getFarmManagerAuditLogs({
      search,
      action,
      userEmail,
      entityType,
      entityId,
      startDate,
      endDate,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    handleServiceResponse(serviceResponse, res);
  };

  getManijeroLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { search, action, userEmail, entityType, entityId, startDate, endDate, page, limit } = req.query as any;
    const serviceResponse = await this.service.getManijeroAuditLogs({
      search,
      action,
      userEmail,
      entityType,
      entityId,
      startDate,
      endDate,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    handleServiceResponse(serviceResponse, res);
  };

  getCollectionTeamLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { search, action, userEmail, entityType, entityId, startDate, endDate, page, limit } = req.query as any;
    const serviceResponse = await this.service.getCollectionTeamAuditLogs({
      search,
      action,
      userEmail,
      entityType,
      entityId,
      startDate,
      endDate,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    handleServiceResponse(serviceResponse, res);
  };

  getLoadingTeamLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { search, action, userEmail, entityType, entityId, startDate, endDate, page, limit } = req.query as any;
    const serviceResponse = await this.service.getLoadingTeamAuditLogs({
      search,
      action,
      userEmail,
      entityType,
      entityId,
      startDate,
      endDate,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    handleServiceResponse(serviceResponse, res);
  };
}

export default new AuditController();
