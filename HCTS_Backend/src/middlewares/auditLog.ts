import type { NextFunction, Request, Response } from 'express';
import type ServiceResponse from '../utils/ServiceResponse.ts';
import auditService from '../services/audit.service.ts';
import type { AuthRequest } from './auth.ts';
import mongoose from 'mongoose';

type AuditEventOptions = {
  event: string | ((req: Request, serviceResponse?: ServiceResponse) => string);
  entityType?: string;
  getEntityId?: (req: Request, serviceResponse?: ServiceResponse) => string | null | undefined;
  getTargetUserId?: (req: Request, serviceResponse?: ServiceResponse) => string | null | undefined;
  getTargetEmail?: (req: Request, serviceResponse?: ServiceResponse) => string | null | undefined;
  getMetadata?: (req: Request, serviceResponse?: ServiceResponse) => Record<string, unknown>;
};

const extractValidEmail = (input?: string | null): string | null => {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  const match = trimmed.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0].toLowerCase() : null;
};

const SENSITIVE_KEYS = new Set([
  'password',
  'oldPassword',
  'newPassword',
  'accessToken',
  'refreshToken',
  'token',
  'otp',
]);

const redactAndSanitize = (value: unknown): unknown => {
  if (value === null || value === undefined) {
    return value;
  }

  // Handle Mongoose ObjectId / MongoDB ObjectID
  if (value instanceof mongoose.Types.ObjectId || (value && (value as any)._bsontype === 'ObjectID')) {
    return value.toString();
  }

  // Handle Buffer
  if (Buffer.isBuffer(value)) {
    return '[BUFFER]';
  }

  // Handle Date
  if (value instanceof Date) {
    return value;
  }

  // Handle Array
  if (Array.isArray(value)) {
    return value.map(redactAndSanitize);
  }

  // Handle Object
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((redacted, [key, childValue]) => {
      redacted[key] = SENSITIVE_KEYS.has(key) ? '[REDACTED]' : redactAndSanitize(childValue);
      return redacted;
    }, {});
  }

  return value;
};

const getResponseObject = (serviceResponse?: ServiceResponse) => {
  return serviceResponse?.responseObject as Record<string, unknown> | null | undefined;
};

const entityTypeToModel: Record<string, string> = {
  worker: 'Worker',
  crew: 'Crew',
  farm: 'Farm',
  machine: 'Machine',
  satelliteRole: 'SatelliteRole',
  campaign: 'Campaign',
  employment_company: 'EmploymentCompany',
  plot: 'Plot',
  valve: 'Valve',
  park: 'Park',
  variety: 'Variety',
  user: 'User',
  role: 'Role',
  dispatch_note: 'DispatchNote',
  transfer_order: 'TransferOrder',
  harvest_forecast: 'HarvestForecast',
};

type TeamCategory = 'farm_manager' | 'manijero' | 'collection_team' | 'loading_team' | 'system';

const resolveTeamCategory = (entityType?: string, eventName?: string, userRoles?: string[]): TeamCategory => {
  const entity = (entityType || '').toLowerCase();
  const event = (eventName || '').toLowerCase();

  // 1. Farm Manager
  if (['farm', 'plot', 'valve', 'park', 'campaign', 'variety', 'harvest_forecast'].includes(entity)) {
    return 'farm_manager';
  }

  // 2. Manijero / Crew Supervisor
  if (['crew', 'harvestassignment', 'qrseries', 'worker'].includes(entity) || event.includes('crew') || event.includes('harvest_assignment')) {
    return 'manijero';
  }

  // 3. Collection Team
  if (['reception_batch', 'harvest_receipt_scan', 'unassigned_bin_queue', 'machine'].includes(entity) || event.includes('reception') || event.includes('scan') || event.includes('bin_queue')) {
    return 'collection_team';
  }

  // 4. Loading Team
  if (['dispatch_note', 'transfer_order', 'buyer', 'destination_center', 'transport_provider'].includes(entity) || event.includes('dispatch') || event.includes('transfer') || event.includes('load_order')) {
    return 'loading_team';
  }

  if (userRoles && Array.isArray(userRoles)) {
    if (userRoles.some((r) => r.includes('Farm Manager'))) return 'farm_manager';
    if (userRoles.some((r) => r.includes('Manijero') || r.includes('Supervisor'))) return 'manijero';
    if (userRoles.some((r) => r.includes('Collection') || r.includes('Reception') || r.includes('Machine'))) return 'collection_team';
    if (userRoles.some((r) => r.includes('Loading') || r.includes('Logistics') || r.includes('Dispatch'))) return 'loading_team';
  }

  return 'system';
};

export const auditLogMiddleware = (options: AuditEventOptions) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    let previousValue: any = null;
    let resolvedEntityId: string | null | undefined = null;
    const entityType = options.entityType;
    const modelName = entityType ? entityTypeToModel[entityType] : null;

    if (modelName && (req.method === 'PATCH' || req.method === 'PUT')) {
      try {
        let entityId = options.getEntityId?.(req);
        if (!entityId) {
          const paramKey = Object.keys(req.params).find((key) => key.toLowerCase().includes('id'));
          if (paramKey) {
            const val = req.params[paramKey];
            entityId = Array.isArray(val) ? val[0] : val;
          }
        }
        if (!entityId && req.originalUrl.includes('/me') && req.user?.userId) {
          entityId = req.user.userId;
        }

        resolvedEntityId = entityId;

        if (entityId && mongoose.Types.ObjectId.isValid(entityId) && mongoose.modelNames().includes(modelName)) {
          previousValue = await mongoose.model(modelName).findById(entityId).lean();
        }
      } catch (error) {
        console.error('Audit log: failed to fetch previous value:', error);
      }
    }

    res.on('finish', () => {
      const serviceResponse = res.locals.payload as ServiceResponse | undefined;
      const responseObject = getResponseObject(serviceResponse);
      const responseUser = responseObject?.user as { _id?: string; id?: string; email?: string } | undefined;
      const responseEntity = responseObject as { _id?: string; id?: string } | null | undefined;
      const actorUserId = req.user?.userId || responseUser?._id || responseUser?.id || null;
      const rawActorEmail = req.user?.email || responseUser?.email || (req.body?.email as string | undefined) || null;
      const actorEmail = extractValidEmail(rawActorEmail);
      const statusCode = res.statusCode;
      const eventName = typeof options.event === 'function' ? options.event(req, serviceResponse) : options.event;
      const entityId = options.getEntityId?.(req, serviceResponse) || responseEntity?._id || responseEntity?.id || resolvedEntityId || null;

      const runLog = async () => {
        let newValue: any = null;
        if (modelName && entityId && mongoose.Types.ObjectId.isValid(entityId) && statusCode >= 200 && statusCode < 300) {
          try {
            if (mongoose.modelNames().includes(modelName)) {
              newValue = await mongoose.model(modelName).findById(entityId).lean();
            }
          } catch (error) {
            console.error('Audit log: failed to fetch new value:', error);
          }
        }

        const metadata = options.getMetadata?.(req, serviceResponse) || {};
        if (previousValue) {
          metadata.previousValue = redactAndSanitize(previousValue);
        }
        if (newValue) {
          metadata.newValue = redactAndSanitize(newValue);
        }

        const rawTargetEmail = options.getTargetEmail?.(req, serviceResponse) || responseUser?.email || (req.body?.email as string | undefined) || null;
        const targetEmail = extractValidEmail(rawTargetEmail);
        const userRoles = req.user?.roles ? req.user.roles.map((r: any) => r.name || String(r)) : [];
        const teamCategory = resolveTeamCategory(options.entityType, eventName, userRoles);

        await auditService.createLog({
          event: eventName,
          entityType: options.entityType,
          entityId,
          teamCategory,
          actorUserId,
          actorEmail,
          actorRoles: userRoles,
          targetUserId: options.getTargetUserId?.(req, serviceResponse) || responseUser?._id || responseUser?.id || null,
          targetEmail,
          method: req.method,
          path: req.originalUrl,
          statusCode,
          success: statusCode >= 200 && statusCode < 400,
          ip: req.ip || null,
          userAgent: req.get('user-agent') || null,
          requestBody: redactAndSanitize(req.body || {}) as Record<string, unknown>,
          metadata,
        });
      };

      void runLog().catch((error) => {
        console.error('Audit log write failed:', error);
      });
    });

    next();
  };
};
