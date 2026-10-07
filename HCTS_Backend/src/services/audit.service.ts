import mongoose, { type Types } from 'mongoose';
import AuditLog from '../models/auditLog.model.ts';
import ServiceResponse from '../utils/ServiceResponse.ts';
import httpStatus from 'http-status';

export interface AuditLogPayload {
  event: string;
  entityType?: string;
  entityId?: string | null;
  teamCategory?: string | null;
  actorUserId?: string | Types.ObjectId | null;
  actorEmail?: string | null;
  actorRoles?: string[];
  targetUserId?: string | null;
  targetEmail?: string | null;
  method: string;
  path: string;
  statusCode: number;
  success: boolean;
  ip?: string | null;
  userAgent?: string | null;
  requestBody?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

const AUDIT_MESSAGES = {
  FETCH_SUCCESS: 'Audit logs fetched successfully',
} as const;

const sanitizeValue = (value: unknown): unknown => {
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
    return value.map(sanitizeValue);
  }

  // Handle Object
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((sanitized, [key, childValue]) => {
      sanitized[key] = sanitizeValue(childValue);
      return sanitized;
    }, {});
  }

  return value;
};

export interface AuditLogFilters {
  search?: string;
  action?: string;
  userEmail?: string;
  teamCategory?: string;
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

class AuditService {
  async createLog(payload: AuditLogPayload): Promise<void> {
    await AuditLog.create(payload);
  }

  async getAuditLogs(filters: AuditLogFilters) {
    const query: any = {};
    const andConditions: any[] = [];

    if (filters.teamCategory) {
      andConditions.push({
        $or: [
          { teamCategory: filters.teamCategory },
          // Backward compatibility fallback for entityTypes
          ...(filters.teamCategory === 'farm_manager' ? [{ entityType: { $in: ['farm', 'plot', 'valve', 'park', 'campaign', 'variety', 'harvest_forecast'] } }] : []),
          ...(filters.teamCategory === 'manijero' ? [{ entityType: { $in: ['crew', 'harvestAssignment', 'qrSeries', 'worker'] } }] : []),
          ...(filters.teamCategory === 'collection_team' ? [{ entityType: { $in: ['reception_batch', 'harvest_receipt_scan', 'unassigned_bin_queue', 'machine'] } }] : []),
          ...(filters.teamCategory === 'loading_team' ? [{ entityType: { $in: ['dispatch_note', 'transfer_order', 'buyer', 'destination_center', 'transport_provider'] } }] : []),
        ],
      });
    }

    if (filters.entityType) {
      andConditions.push({ entityType: filters.entityType });
    }

    if (filters.entityId) {
      andConditions.push({ entityId: filters.entityId });
    }

    // General Search filter (matches Action event name, User actor email, or entityType)
    if (filters.search) {
      const searchRegex = { $regex: filters.search.trim(), $options: 'i' };
      andConditions.push({
        $or: [
          { event: searchRegex },
          { actorEmail: searchRegex },
          { entityType: searchRegex },
        ],
      });
    }

    // Action filter (matches Action event name)
    if (filters.action) {
      const actionRegex = { $regex: filters.action.trim(), $options: 'i' };
      andConditions.push({ event: actionRegex });
    }

    // User Email filter (matches User actor email)
    if (filters.userEmail) {
      const emailRegex = { $regex: filters.userEmail.trim(), $options: 'i' };
      andConditions.push({ actorEmail: emailRegex });
    }

    if (filters.startDate || filters.endDate) {
      const dateCond: any = {};
      if (filters.startDate) dateCond.$gte = new Date(filters.startDate);
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setUTCHours(23, 59, 59, 999);
        dateCond.$lte = end;
      }
      andConditions.push({ createdAt: dateCond });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 10);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actorUserId', 'firstName lastName email')
        .lean()
        .exec(),
      AuditLog.countDocuments(query),
    ]);

    const sanitizedLogs = logs.map((log) => sanitizeValue(log));

    const result = {
      logs: sanitizedLogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };

    return ServiceResponse.success(AUDIT_MESSAGES.FETCH_SUCCESS, result, httpStatus.OK);
  }

  async getFarmManagerAuditLogs(filters: Omit<AuditLogFilters, 'teamCategory'>) {
    return this.getAuditLogs({ ...filters, teamCategory: 'farm_manager' });
  }

  async getManijeroAuditLogs(filters: Omit<AuditLogFilters, 'teamCategory'>) {
    return this.getAuditLogs({ ...filters, teamCategory: 'manijero' });
  }

  async getCollectionTeamAuditLogs(filters: Omit<AuditLogFilters, 'teamCategory'>) {
    return this.getAuditLogs({ ...filters, teamCategory: 'collection_team' });
  }

  async getLoadingTeamAuditLogs(filters: Omit<AuditLogFilters, 'teamCategory'>) {
    return this.getAuditLogs({ ...filters, teamCategory: 'loading_team' });
  }
}

export default new AuditService();
