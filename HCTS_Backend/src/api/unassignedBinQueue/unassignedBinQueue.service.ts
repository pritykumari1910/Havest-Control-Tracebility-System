import mongoose from 'mongoose';
import httpStatus from 'http-status';
import {
  UnassignedBinQueue,
  HarvestAssignment,
  HarvestReceiptScan,
  QrInventory,
} from '../../models/index.ts';
import { UnassignedBinStatus } from '../../models/unassignedBinQueue.model.ts';
import { HarvestAssignmentStatus } from '../../models/harvestAssignment.model.ts';
import { QrInventoryStatus } from '../../models/qrInventory.model.ts';
import ServiceResponse from '../../utils/ServiceResponse.ts';
import unassignedBinQueueRepository from './unassignedBinQueue.repository.ts';
import type {
  UnassignedBinQueueListFilters,
  ResolveQueueItemPayload,
  RejectQueueItemPayload,
} from './unassignedBinQueue.types.ts';

class UnassignedBinQueueService {
  async getQueue(filters: UnassignedBinQueueListFilters) {
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.failureReason) {
      query.failureReason = filters.failureReason;
    }
    if (filters.campaignId && mongoose.Types.ObjectId.isValid(filters.campaignId)) {
      query.campaign = new mongoose.Types.ObjectId(filters.campaignId);
    }
    if (filters.date) {
      const date = new Date(filters.date);
      const start = new Date(date);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setUTCHours(23, 59, 59, 999);
      query.scannedAt = { $gte: start, $lte: end };
    }

    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, filters.limit || 20);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      unassignedBinQueueRepository.findWithPagination(query, skip, limit),
      unassignedBinQueueRepository.count(query),
    ]);

    return ServiceResponse.success('Unassigned bin queue retrieved successfully', {
      items,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }, httpStatus.OK);
  }

  async getQueueStats(campaignId?: string) {
    const base: any = {};
    if (campaignId && mongoose.Types.ObjectId.isValid(campaignId)) {
      base.campaign = new mongoose.Types.ObjectId(campaignId);
    }

    const [pending, resolved, rejected] = await Promise.all([
      UnassignedBinQueue.countDocuments({ ...base, status: UnassignedBinStatus.PENDING }),
      UnassignedBinQueue.countDocuments({ ...base, status: UnassignedBinStatus.RESOLVED }),
      UnassignedBinQueue.countDocuments({ ...base, status: UnassignedBinStatus.REJECTED }),
    ]);

    return ServiceResponse.success('Queue stats retrieved successfully', {
      pending,
      resolved,
      rejected,
      total: pending + resolved + rejected,
      hasUnresolved: pending > 0,
    }, httpStatus.OK);
  }

  async getQueueItemById(queueItemId: string) {
    if (!mongoose.Types.ObjectId.isValid(queueItemId)) {
      return ServiceResponse.failure('Queue item not found', null, httpStatus.NOT_FOUND);
    }
    const item = await unassignedBinQueueRepository.findByIdWithDetails(queueItemId);
    if (!item) {
      return ServiceResponse.failure('Queue item not found', null, httpStatus.NOT_FOUND);
    }
    return ServiceResponse.success('Queue item retrieved successfully', item, httpStatus.OK);
  }

  async resolveQueueItem(queueItemId: string, payload: ResolveQueueItemPayload, resolvedByUserId: string) {
    if (!mongoose.Types.ObjectId.isValid(queueItemId)) {
      return ServiceResponse.failure('Queue item not found', null, httpStatus.NOT_FOUND);
    }

    const queueItem = await unassignedBinQueueRepository.findById(queueItemId);
    if (!queueItem) {
      return ServiceResponse.failure('Queue item not found', null, httpStatus.NOT_FOUND);
    }

    if (queueItem.status !== UnassignedBinStatus.PENDING) {
      return ServiceResponse.failure(
        `Queue item is already ${queueItem.status} and cannot be resolved again`,
        null,
        httpStatus.BAD_REQUEST
      );
    }

    if (!mongoose.Types.ObjectId.isValid(payload.harvestAssignmentId)) {
      return ServiceResponse.failure('Invalid harvestAssignmentId', null, httpStatus.BAD_REQUEST);
    }

    const assignment = await HarvestAssignment.findById(payload.harvestAssignmentId)
      .populate('crew');
    if (!assignment) {
      return ServiceResponse.failure('Harvest assignment not found', null, httpStatus.NOT_FOUND);
    }
    if (assignment.status !== HarvestAssignmentStatus.ACTIVE) {
      return ServiceResponse.failure(
        `Harvest assignment must be ACTIVE to resolve a bin. Current status: ${assignment.status}`,
        null,
        httpStatus.BAD_REQUEST
      );
    }

    // Check if QR was already scanned successfully elsewhere
    const alreadyScanned = await HarvestReceiptScan.findOne({ qrCode: queueItem.qrCode });
    if (alreadyScanned) {
      return ServiceResponse.failure(
        `QR '${queueItem.qrCode}' has already been received in a reception batch`,
        null,
        httpStatus.BAD_REQUEST
      );
    }

    const qr = await QrInventory.findById(queueItem.qrInventory);

    // Create HarvestReceiptScan — identical to normal scan path
    await HarvestReceiptScan.create({
      receptionBatch: queueItem.receptionBatch,
      qrInventory: queueItem.qrInventory,
      qrCode: queueItem.qrCode,
      scannedBy: queueItem.scannedBy,
      scannedAt: queueItem.scannedAt,
      campaign: queueItem.campaign,
      harvestAssignment: assignment._id,
      crew: assignment.crew,
      farm: assignment.farm,
      plot: assignment.plot,
      valve: assignment.valve,
      workZone: assignment.specialZone || assignment.assignedRows || '',
      variety: assignment.variety,
    });

    // Update QrInventory status
    if (qr) {
      qr.status = QrInventoryStatus.SCANNED_AT_COLLECTION;
      qr.harvestAssignmentId = assignment._id.toString();
      qr.history.push({
        status: QrInventoryStatus.SCANNED_AT_COLLECTION,
        date: new Date(),
        updatedBy: new mongoose.Types.ObjectId(resolvedByUserId),
      });
      await qr.save();
    }

    // Update queue item
    queueItem.status = UnassignedBinStatus.RESOLVED;
    queueItem.resolvedBy = new mongoose.Types.ObjectId(resolvedByUserId);
    queueItem.resolvedAt = new Date();
    queueItem.resolvedHarvestAssignment = new mongoose.Types.ObjectId(payload.harvestAssignmentId);
    queueItem.auditTrail.push({
      actor: new mongoose.Types.ObjectId(resolvedByUserId),
      action: 'resolved',
      at: new Date(),
      note: payload.note || `Manually assigned to harvest assignment ${payload.harvestAssignmentId}`,
    });
    await queueItem.save();

    const populated = await unassignedBinQueueRepository.findByIdWithDetails(queueItem._id);
    return ServiceResponse.success('Bin resolved and added to harvest flow successfully', populated, httpStatus.OK);
  }

  async rejectQueueItem(queueItemId: string, payload: RejectQueueItemPayload, rejectedByUserId: string) {
    if (!mongoose.Types.ObjectId.isValid(queueItemId)) {
      return ServiceResponse.failure('Queue item not found', null, httpStatus.NOT_FOUND);
    }

    const queueItem = await unassignedBinQueueRepository.findById(queueItemId);
    if (!queueItem) {
      return ServiceResponse.failure('Queue item not found', null, httpStatus.NOT_FOUND);
    }

    if (queueItem.status !== UnassignedBinStatus.PENDING) {
      return ServiceResponse.failure(
        `Queue item is already ${queueItem.status} and cannot be rejected`,
        null,
        httpStatus.BAD_REQUEST
      );
    }

    queueItem.status = UnassignedBinStatus.REJECTED;
    queueItem.resolvedBy = new mongoose.Types.ObjectId(rejectedByUserId);
    queueItem.resolvedAt = new Date();
    queueItem.rejectionReason = payload.reason;
    queueItem.auditTrail.push({
      actor: new mongoose.Types.ObjectId(rejectedByUserId),
      action: 'rejected',
      at: new Date(),
      note: payload.reason,
    });
    await queueItem.save();

    const populated = await unassignedBinQueueRepository.findByIdWithDetails(queueItem._id);
    return ServiceResponse.success('Queue item rejected successfully', populated, httpStatus.OK);
  }
}

export default new UnassignedBinQueueService();
