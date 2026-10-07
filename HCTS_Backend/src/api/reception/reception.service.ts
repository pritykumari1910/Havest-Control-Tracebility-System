import mongoose from 'mongoose';
import httpStatus from 'http-status';
import {
  ReceptionBatch,
  HarvestReceiptScan,
  QrInventory,
  Campaign,
  Machine,
  HarvestAssignment,
  MachineOperator,
  UnassignedBinQueue,
  PalletBinIncident,
  IncidentCategory,
  SystemConfig,
  Variety,
} from '../../models/index.ts';
import { CampaignStatus } from '../../models/campaign.model.ts';
import { MachineStatus } from '../../models/machine.model.ts';
import { QrInventoryStatus } from '../../models/qrInventory.model.ts';
import { UnassignedBinFailureReason, UnassignedBinStatus } from '../../models/unassignedBinQueue.model.ts';
import ServiceResponse from '../../utils/ServiceResponse.ts';
import dashboardEventPublisher, { DashboardEntity } from '../../events/dashboard.publisher.ts';
import receptionRepository from './reception.repository.ts';
import type {
  CreateReceptionBatchBody,
  UpdateReceptionBatchBody,
  ReceptionBatchListFilters,
  ReceivedBinInventoryFilters,
  CreateIncidentPayload,
  IncidentListFilters,
} from './reception.types.ts';

class ReceptionService {
  async createReceptionBatch(
    payload: CreateReceptionBatchBody,
    openedByUserId: string
  ) {
    try {
      const activeCampaign = await Campaign.findOne({ status: CampaignStatus.ACTIVE });
      if (!activeCampaign) {
        return ServiceResponse.failure('Active campaign is required to open a reception batch', null, httpStatus.BAD_REQUEST);
      }

      if (!mongoose.Types.ObjectId.isValid(payload.machineId)) {
        return ServiceResponse.failure('Invalid machineId', null, httpStatus.BAD_REQUEST);
      }
      const machineDoc = await Machine.findOne({ _id: payload.machineId, status: MachineStatus.ACTIVE });
      if (!machineDoc) {
        return ServiceResponse.failure('Active machine not found', null, httpStatus.BAD_REQUEST);
      }

      if (!mongoose.Types.ObjectId.isValid(payload.operatorId)) {
        return ServiceResponse.failure('Invalid operatorId', null, httpStatus.BAD_REQUEST);
      }
      const operatorDoc = await MachineOperator.findOne({ _id: payload.operatorId, isActive: true });
      if (!operatorDoc) {
        return ServiceResponse.failure('Active operator not found', null, httpStatus.BAD_REQUEST);
      }

      const count = await receptionRepository.count({});
      let suffix = count + 1;
      let batchCode = `RECP-${suffix.toString().padStart(4, '0')}`;
      while (await receptionRepository.findOne({ batchCode })) {
        suffix += 1;
        batchCode = `RECP-${suffix.toString().padStart(4, '0')}`;
      }

      const batch = await receptionRepository.create({
        batchCode,
        campaign: activeCampaign._id,
        workDate: payload.workDate ? new Date(payload.workDate) : new Date(),
        machine: machineDoc._id,
        operator: operatorDoc._id,
        status: 'open',
        openedBy: new mongoose.Types.ObjectId(openedByUserId),
      });

      return ServiceResponse.success('Reception batch opened successfully', batch, httpStatus.CREATED);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }

  async updateBatch(batchId: string, payload: UpdateReceptionBatchBody) {
    try {
      if (!mongoose.Types.ObjectId.isValid(batchId)) {
        return ServiceResponse.failure('Invalid batchId', null, httpStatus.BAD_REQUEST);
      }

      const batch = await receptionRepository.findById(batchId);
      if (!batch) {
        return ServiceResponse.failure('Reception batch not found', null, httpStatus.NOT_FOUND);
      }

      // Cannot update a closed batch (unless re-opening it)
      if (batch.status === 'closed' && payload.status !== 'open') {
        return ServiceResponse.failure(
          'Cannot update a closed reception batch. Reopen it first.',
          null,
          httpStatus.BAD_REQUEST
        );
      }

      const updates: Partial<typeof batch> = {};

      // Validate and set machineId
      if (payload.machineId !== undefined) {
        if (!mongoose.Types.ObjectId.isValid(payload.machineId)) {
          return ServiceResponse.failure('Invalid machineId', null, httpStatus.BAD_REQUEST);
        }
        const machineDoc = await Machine.findOne({ _id: payload.machineId, status: MachineStatus.ACTIVE });
        if (!machineDoc) {
          return ServiceResponse.failure('Active machine not found', null, httpStatus.BAD_REQUEST);
        }
        (updates as any).machine = machineDoc._id;
      }

      // Validate and set operatorId
      if (payload.operatorId !== undefined) {
        if (!mongoose.Types.ObjectId.isValid(payload.operatorId)) {
          return ServiceResponse.failure('Invalid operatorId', null, httpStatus.BAD_REQUEST);
        }
        const operatorDoc = await MachineOperator.findOne({ _id: payload.operatorId, isActive: true });
        if (!operatorDoc) {
          return ServiceResponse.failure('Active operator not found', null, httpStatus.BAD_REQUEST);
        }
        (updates as any).operator = operatorDoc._id;
      }

      // Set workDate
      if (payload.workDate !== undefined) {
        (updates as any).workDate = new Date(payload.workDate);
      }

      // Set status
      if (payload.status !== undefined) {
        (updates as any).status = payload.status;
      }

      if (Object.keys(updates).length === 0) {
        return ServiceResponse.failure('No valid fields provided to update', null, httpStatus.BAD_REQUEST);
      }

      const updatedBatch = await ReceptionBatch.findByIdAndUpdate(
        batchId,
        { $set: updates },
        { new: true, runValidators: true }
      )
        .populate('machine', 'machineCode name')
        .populate('operator', 'name')
        .populate('openedBy', 'name')
        .populate('closedBy', 'name')
        .populate('campaign', 'campaignName campaignCode');

      return ServiceResponse.success('Reception batch updated successfully', updatedBatch, httpStatus.OK);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async scanHarvestBin(batchId: string, qrCode: string, scannedByUserId: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(batchId)) {
        return ServiceResponse.failure('Invalid batchId', null, httpStatus.BAD_REQUEST);
      }

      const batch = await receptionRepository.findById(batchId);
      if (!batch) {
        return ServiceResponse.failure('Reception batch not found', null, httpStatus.NOT_FOUND);
      }

      if (batch.status === 'closed') {
        return ServiceResponse.failure('Cannot scan bins into a closed reception batch', null, httpStatus.BAD_REQUEST);
      }

      const qr = await QrInventory.findOne({ qrCode });
      if (!qr) {
        return ServiceResponse.failure('QR code does not exist in system inventory.', null, httpStatus.BAD_REQUEST);
      }

      // ── Unresolvable: no harvest assignment linked ──────────────────────────
      if (!qr.harvestAssignmentId) {
        const alreadyQueued = await UnassignedBinQueue.findOne({
          qrCode,
          status: UnassignedBinStatus.PENDING,
        });
        if (!alreadyQueued) {
          const activeCampaign = await Campaign.findOne({ status: CampaignStatus.ACTIVE });
          await UnassignedBinQueue.create({
            qrCode,
            qrInventory: qr._id,
            receptionBatch: batch._id,
            scannedBy: new mongoose.Types.ObjectId(scannedByUserId),
            scannedAt: new Date(),
            campaign: activeCampaign?._id,
            failureReason: UnassignedBinFailureReason.NO_ASSIGNMENT,
            auditTrail: [{
              actor: new mongoose.Types.ObjectId(scannedByUserId),
              action: 'queued',
              at: new Date(),
              note: 'QR has no linked harvest assignment',
            }],
          });
        }
        return ServiceResponse.success(
          'Bin held in unassigned queue — no harvest assignment linked. Supervisor review required.',
          { queued: true, qrCode },
          httpStatus.ACCEPTED
        );
      }

      // ── Hard errors: damaged / lost / cancelled ─────────────────────────────
      if (
        qr.status === QrInventoryStatus.CANCELLED ||
        qr.status === QrInventoryStatus.LOST ||
        qr.status === QrInventoryStatus.DAMAGED
      ) {
        return ServiceResponse.failure(`QR code is ${qr.status} and cannot be received.`, null, httpStatus.BAD_REQUEST);
      }

      // ── Hard error: already scanned / dispatched ────────────────────────────
      if (
        (qr.status as string) === QrInventoryStatus.SCANNED_AT_COLLECTION ||
        (qr.status as string) === QrInventoryStatus.ASSIGNED_TO_DISPATCH ||
        (qr.status as string) === QrInventoryStatus.DISPATCHED
      ) {
        const originalScan = await HarvestReceiptScan.findOne({ qrCode })
          .populate({
            path: 'receptionBatch',
            populate: {
              path: 'operator',
              populate: { path: 'worker', select: 'firstName lastName' },
            },
          })
          .populate('scannedBy', 'firstName lastName name');

        if (originalScan) {
          const originalBatchCode = (originalScan.receptionBatch as any)?.batchCode || 'Unknown';
          const opWorker = (originalScan.receptionBatch as any)?.operator?.worker;
          const operatorName = opWorker
            ? `${opWorker.firstName} ${opWorker.lastName}`
            : (originalScan.scannedBy as any)?.name || 'Unknown';
          const scannedAtStr = originalScan.scannedAt.toISOString();

          return ServiceResponse.failure(
            `Duplicate Scan: QR '${qrCode}' was already scanned in batch '${originalBatchCode}' by operator '${operatorName}' on '${scannedAtStr}'.`,
            null,
            httpStatus.BAD_REQUEST
          );
        }

        return ServiceResponse.failure('QR code has already been received at the collection point.', null, httpStatus.BAD_REQUEST);
      }

      if ((qr.status as string) === QrInventoryStatus.DISPATCHED || (qr.status as string) === QrInventoryStatus.ASSIGNED_TO_DISPATCH) {
        return ServiceResponse.failure('QR code is already in a closed dispatch note.', null, httpStatus.BAD_REQUEST);
      }

      const dupInBatch = await HarvestReceiptScan.findOne({ receptionBatch: batchId, qrCode });
      if (dupInBatch) {
        return ServiceResponse.failure('QR code has already been scanned in this reception batch.', null, httpStatus.BAD_REQUEST);
      }

      // ── Unresolvable: harvest assignment record missing in DB ───────────────
      const assignment = await HarvestAssignment.findById(qr.harvestAssignmentId).populate('crew');
      if (!assignment) {
        const alreadyQueued = await UnassignedBinQueue.findOne({
          qrCode,
          status: UnassignedBinStatus.PENDING,
        });
        if (!alreadyQueued) {
          const activeCampaign = await Campaign.findOne({ status: CampaignStatus.ACTIVE });
          await UnassignedBinQueue.create({
            qrCode,
            qrInventory: qr._id,
            receptionBatch: batch._id,
            scannedBy: new mongoose.Types.ObjectId(scannedByUserId),
            scannedAt: new Date(),
            campaign: activeCampaign?._id,
            failureReason: UnassignedBinFailureReason.ASSIGNMENT_NOT_FOUND,
            auditTrail: [{
              actor: new mongoose.Types.ObjectId(scannedByUserId),
              action: 'queued',
              at: new Date(),
              note: `Harvest assignment '${qr.harvestAssignmentId}' not found in database`,
            }],
          });
        }
        return ServiceResponse.success(
          'Bin held in unassigned queue — harvest assignment not found. Supervisor review required.',
          { queued: true, qrCode },
          httpStatus.ACCEPTED
        );
      }

      // ── Unresolvable: crew is not active ────────────────────────────────────
      const crewDoc = assignment.crew as any;
      if (!crewDoc || crewDoc.status !== 'active') {
        const alreadyQueued = await UnassignedBinQueue.findOne({
          qrCode,
          status: UnassignedBinStatus.PENDING,
        });
        if (!alreadyQueued) {
          const activeCampaign = await Campaign.findOne({ status: CampaignStatus.ACTIVE });
          await UnassignedBinQueue.create({
            qrCode,
            qrInventory: qr._id,
            receptionBatch: batch._id,
            scannedBy: new mongoose.Types.ObjectId(scannedByUserId),
            scannedAt: new Date(),
            campaign: activeCampaign?._id,
            failureReason: UnassignedBinFailureReason.CREW_INACTIVE,
            auditTrail: [{
              actor: new mongoose.Types.ObjectId(scannedByUserId),
              action: 'queued',
              at: new Date(),
              note: `Crew '${crewDoc?.crewCode || 'unknown'}' is not in active status`,
            }],
          });
        }
        return ServiceResponse.success(
          'Bin held in unassigned queue — associated crew is not active. Supervisor review required.',
          { queued: true, qrCode },
          httpStatus.ACCEPTED
        );
      }

      qr.status = QrInventoryStatus.SCANNED_AT_COLLECTION;
      qr.history.push({
        status: QrInventoryStatus.SCANNED_AT_COLLECTION,
        date: new Date(),
        updatedBy: new mongoose.Types.ObjectId(scannedByUserId),
      });
      await qr.save();

      const scanLog = await HarvestReceiptScan.create({
        receptionBatch: batch._id,
        qrInventory: qr._id,
        qrCode,
        scannedBy: new mongoose.Types.ObjectId(scannedByUserId),
        scannedAt: new Date(),
        campaign: assignment.campaign,
        harvestAssignment: assignment._id,
        crew: assignment.crew,
        farm: assignment.farm,
        plot: assignment.plot,
        valve: assignment.valve,
        workZone: assignment.specialZone || (assignment as any).assignedRows || '',
        variety: assignment.variety,
        machine: batch.machine || null,
        operator: batch.operator || null,
        workDate: batch.workDate || new Date(),
      });

      dashboardEventPublisher.publishUpdated(DashboardEntity.QR_INVENTORY, String(qr._id));

      return ServiceResponse.success('Harvest bin received and logged successfully', scanLog, httpStatus.CREATED);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }

  async closeReceptionBatch(batchId: string, closedByUserId: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(batchId)) {
        return ServiceResponse.failure('Invalid batchId', null, httpStatus.BAD_REQUEST);
      }

      const batch = await receptionRepository.findById(batchId);
      if (!batch) {
        return ServiceResponse.failure('Reception batch not found', null, httpStatus.NOT_FOUND);
      }

      if (batch.status === 'closed') {
        return ServiceResponse.failure('Reception batch is already closed', null, httpStatus.BAD_REQUEST);
      }

      batch.status = 'closed';
      batch.closedBy = new mongoose.Types.ObjectId(closedByUserId);
      batch.closedAt = new Date();
      await batch.save();

      return ServiceResponse.success('Reception batch closed successfully', batch, httpStatus.OK);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }

  async getReceptionBatches(filters: ReceptionBatchListFilters) {
    const query: any = {};
    if (filters.status) {
      query.status = filters.status;
    }

    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, filters.limit || 10);
    const skip = (page - 1) * limit;

    const [batches, total] = await Promise.all([
      receptionRepository.findWithPagination(query, skip, limit),
      receptionRepository.count(query),
    ]);

    return ServiceResponse.success('Reception batches retrieved successfully', {
      batches,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }, httpStatus.OK);
  }

  async getBatchScans(batchId: string) {
    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      return ServiceResponse.failure('Invalid batchId', null, httpStatus.BAD_REQUEST);
    }

    const scans = await HarvestReceiptScan.find({ receptionBatch: batchId })
      .populate('qrInventory', 'qrCode status')
      .populate('harvestAssignment', 'workDate workZone')
      .populate('farm', 'farmName internalCode')
      .populate('plot', 'plotName plotCode')
      .populate('valve', 'valveName valveCode')
      .populate('variety', 'varietyName varietyCode')
      .populate('scannedBy', 'name email')
      .sort({ scannedAt: -1 })
      .exec();

    return ServiceResponse.success('Batch scans retrieved successfully', scans, httpStatus.OK);
  }

  async getReceivedBinInventory(filters: ReceivedBinInventoryFilters) {
    try {
      const query: any = {};

      if (filters.batchId && mongoose.Types.ObjectId.isValid(filters.batchId)) {
        query.receptionBatch = new mongoose.Types.ObjectId(filters.batchId);
      }
      if (filters.crewId && mongoose.Types.ObjectId.isValid(filters.crewId)) {
        query.crew = new mongoose.Types.ObjectId(filters.crewId);
      }
      if (filters.varietyId && mongoose.Types.ObjectId.isValid(filters.varietyId)) {
        query.variety = new mongoose.Types.ObjectId(filters.varietyId);
      }
      if (filters.date) {
        const date = new Date(filters.date);
        const start = new Date(date);
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setUTCHours(23, 59, 59, 999);
        query.scannedAt = { $gte: start, $lte: end };
      }

      if (filters.machineId && mongoose.Types.ObjectId.isValid(filters.machineId)) {
        const batches = await ReceptionBatch.find({ machine: filters.machineId }).select('_id');
        const batchIds = batches.map((b) => b._id);
        if (query.receptionBatch) {
          query.receptionBatch = { $in: [query.receptionBatch, ...batchIds] };
        } else {
          query.receptionBatch = { $in: batchIds };
        }
      }

      const page = Math.max(1, filters.page || 1);
      const limit = Math.max(1, filters.limit || 20);
      const skip = (page - 1) * limit;

      // 1. Fetch standard weight config
      const binWeightConfig = await SystemConfig.findOne({ key: 'standard_bin_weight_kg' });
      const standardWeight = binWeightConfig ? Number(binWeightConfig.value) : 400;

      // 2. Fetch paginated scans
      const [scans, total] = await Promise.all([
        HarvestReceiptScan.find(query)
          .populate({
            path: 'receptionBatch',
            populate: [
              { path: 'machine', select: 'name internalCode' },
              {
                path: 'operator',
                populate: { path: 'worker', select: 'firstName lastName internalCode' },
              },
            ],
          })
          .populate('crew', 'crewName crewCode')
          .populate('harvestAssignment', 'workDate workZone specialZone')
          .populate('farm', 'farmName internalCode')
          .populate('plot', 'plotName plotCode')
          .populate('valve', 'valveName valveCode')
          .populate('variety', 'varietyName varietyCode')
          .populate('scannedBy', 'name email')
          .sort({ scannedAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        HarvestReceiptScan.countDocuments(query),
      ]);

      // 3. Aggregate running totals by variety
      const varietyTotals = await HarvestReceiptScan.aggregate<{ _id: any; count: number }>([
        { $match: query },
        { $group: { _id: '$variety', count: { $sum: 1 } } },
      ]);

      const varietyIds = varietyTotals.map((v) => v._id).filter(Boolean);
      const varieties = await Variety.find({ _id: { $in: varietyIds } }).select('varietyName varietyCode');
      const varietyMap = new Map(varieties.map((v) => [v._id.toString(), v]));

      const palletCountByVariety = varietyTotals.map((vt) => {
        const v = vt._id ? varietyMap.get(vt._id.toString()) : null;
        const count = vt.count;
        return {
          varietyId: vt._id ? vt._id.toString() : null,
          varietyName: v ? (v as any).varietyName : 'Unknown',
          varietyCode: v ? (v as any).varietyCode : 'N/A',
          palletCount: count,
          estimatedWeightKg: count * standardWeight,
        };
      });

      const totalEstimatedWeightKg = total * standardWeight;

      return ServiceResponse.success('Received bin inventory retrieved successfully', {
        scans,
        runningTotals: {
          totalPalletCount: total,
          standardBinWeightKg: standardWeight,
          totalEstimatedWeightKg,
          palletCountByVariety,
        },
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      }, httpStatus.OK);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }

  async createBinIncident(payload: CreateIncidentPayload, userId: string) {
    try {
      const qr = await QrInventory.findOne({ qrCode: payload.qrCode });

      let batchId: mongoose.Types.ObjectId | null = null;
      if (payload.receptionBatchId && mongoose.Types.ObjectId.isValid(payload.receptionBatchId)) {
        batchId = new mongoose.Types.ObjectId(payload.receptionBatchId);
      }

      const incident = await PalletBinIncident.create({
        qrCode: payload.qrCode,
        qrInventory: qr ? qr._id : null,
        receptionBatch: batchId,
        category: payload.category as IncidentCategory,
        comments: payload.comments || '',
        registeredBy: new mongoose.Types.ObjectId(userId),
        timestamp: new Date(),
        location: payload.location || null,
      });

      const incidentId = (incident as any)._id;
      const populated = await PalletBinIncident.findById(incidentId)
        .populate('qrInventory', 'qrCode status')
        .populate('receptionBatch', 'batchCode workDate')
        .populate('registeredBy', 'name email')
        .exec();

      return ServiceResponse.success('Pallet bin incident logged successfully', populated, httpStatus.CREATED);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }

  async getBinIncidents(filters: IncidentListFilters) {
    try {
      const query: any = {};

      if (filters.qrCode) {
        query.qrCode = filters.qrCode.trim();
      }
      if (filters.receptionBatchId && mongoose.Types.ObjectId.isValid(filters.receptionBatchId)) {
        query.receptionBatch = new mongoose.Types.ObjectId(filters.receptionBatchId);
      }
      if (filters.category) {
        query.category = filters.category;
      }
      if (filters.date) {
        const date = new Date(filters.date);
        const start = new Date(date);
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setUTCHours(23, 59, 59, 999);
        query.timestamp = { $gte: start, $lte: end };
      }

      const page = Math.max(1, filters.page || 1);
      const limit = Math.max(1, filters.limit || 20);
      const skip = (page - 1) * limit;

      const [incidents, total] = await Promise.all([
        PalletBinIncident.find(query)
          .populate('qrInventory', 'qrCode status')
          .populate('receptionBatch', 'batchCode workDate')
          .populate('registeredBy', 'name email')
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        PalletBinIncident.countDocuments(query),
      ]);

      return ServiceResponse.success('Incidents retrieved successfully', {
        incidents,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      }, httpStatus.OK);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }
}

export default new ReceptionService();
