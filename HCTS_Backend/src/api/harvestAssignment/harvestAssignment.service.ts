import mongoose from 'mongoose';
import httpStatus from 'http-status';
import {
  HarvestAssignment,
  Campaign,
  Crew,
  Farm,
  Plot,
  Valve,
  Park,
  Variety,
  QrSeries,
  QrInventory,
  HarvestReceiptScan,
} from '../../models/index.ts';
import { HarvestAssignmentStatus } from '../../models/harvestAssignment.model.ts';
import { CampaignStatus } from '../../models/campaign.model.ts';
import { CrewStatus } from '../../models/crew.model.ts';
import { VarietyStatus } from '../../models/variety.model.ts';
import { QrInventoryStatus } from '../../models/qrInventory.model.ts';
import ServiceResponse from '../../utils/ServiceResponse.ts';
import dashboardEventPublisher, { DashboardEntity } from '../../events/dashboard.publisher.ts';
import harvestAssignmentRepository from './harvestAssignment.repository.ts';
import type { CreateAssignmentBody, UpdateAssignmentBody, AssignmentListFilters } from './harvestAssignment.types.ts';

class HarvestAssignmentService {
  async createAssignment(payload: CreateAssignmentBody, requestingUser: any) {
    if (requestingUser?.userportal !== 'app') {
      return ServiceResponse.failure(
        'Harvest assignment creation is restricted to the mobile application',
        null,
        httpStatus.FORBIDDEN
      );
    }

    const activeCampaign = await Campaign.findOne({ status: CampaignStatus.ACTIVE });
    if (!activeCampaign) {
      return ServiceResponse.failure('No active campaign found in the system', null, httpStatus.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(payload.crewId)) {
      return ServiceResponse.failure('Invalid crewId', null, httpStatus.BAD_REQUEST);
    }
    const crew = await Crew.findById(payload.crewId);
    if (!crew) {
      return ServiceResponse.failure('Associated daily crew not found', null, httpStatus.NOT_FOUND);
    }
    const isCrewActive = crew.status === CrewStatus.ACTIVE || (crew.status as string) === 'active';
    if (!isCrewActive) {
      return ServiceResponse.failure(
        `Daily crew must be in Active status to create harvest assignments. Current status: ${crew.status}`,
        null,
        httpStatus.BAD_REQUEST
      );
    }

    if (!mongoose.Types.ObjectId.isValid(payload.farmId)) {
      return ServiceResponse.failure('Invalid farmId', null, httpStatus.BAD_REQUEST);
    }
    const farm = await Farm.findById(payload.farmId);
    if (!farm) {
      return ServiceResponse.failure('Farm not found', null, httpStatus.NOT_FOUND);
    }

    if (!mongoose.Types.ObjectId.isValid(payload.plotId)) {
      return ServiceResponse.failure('Invalid plotId', null, httpStatus.BAD_REQUEST);
    }
    const plot = await Plot.findOne({ _id: payload.plotId, parentFarm: farm._id });
    if (!plot) {
      return ServiceResponse.failure('Plot not found or does not belong to the selected farm', null, httpStatus.NOT_FOUND);
    }

    if (!mongoose.Types.ObjectId.isValid(payload.varietyId)) {
      return ServiceResponse.failure('Invalid varietyId', null, httpStatus.BAD_REQUEST);
    }
    const variety = await Variety.findOne({ _id: payload.varietyId, status: VarietyStatus.ACTIVE });
    if (!variety) {
      return ServiceResponse.failure('Avocado variety not found or inactive', null, httpStatus.NOT_FOUND);
    }

    const isConfiguredForPlot = plot.avocadoVariety.some(
      (vName) => vName.toLowerCase() === variety.varietyName.toLowerCase()
    );
    if (!isConfiguredForPlot) {
      return ServiceResponse.failure(
        `Avocado variety '${variety.varietyName}' is not configured for plot '${plot.plotName}'`,
        null,
        httpStatus.BAD_REQUEST
      );
    }

    if (payload.valveId) {
      if (!mongoose.Types.ObjectId.isValid(payload.valveId)) {
        return ServiceResponse.failure('Invalid valveId', null, httpStatus.BAD_REQUEST);
      }
      const valve = await Valve.findOne({ _id: payload.valveId, parentPlot: plot._id });
      if (!valve) {
        return ServiceResponse.failure('Valve not found or does not belong to the selected plot', null, httpStatus.NOT_FOUND);
      }
    }

    if (payload.parkId) {
      if (!mongoose.Types.ObjectId.isValid(payload.parkId)) {
        return ServiceResponse.failure('Invalid parkId', null, httpStatus.BAD_REQUEST);
      }
      const park = await Park.findOne({ _id: payload.parkId, parentValve: payload.valveId });
      if (!park) {
        return ServiceResponse.failure('Park not found or does not belong to the selected valve', null, httpStatus.NOT_FOUND);
      }
    }

    if (!mongoose.Types.ObjectId.isValid(payload.qrSeriesId)) {
      return ServiceResponse.failure('Invalid qrSeriesId', null, httpStatus.BAD_REQUEST);
    }
    const series = await QrSeries.findById(payload.qrSeriesId);
    if (!series) {
      return ServiceResponse.failure('QR Series not found', null, httpStatus.NOT_FOUND);
    }

    if (payload.startQrNumber > payload.endQrNumber) {
      return ServiceResponse.failure('startQrNumber cannot be greater than endQrNumber', null, httpStatus.BAD_REQUEST);
    }
    if (payload.startQrNumber < series.startNumber || payload.endQrNumber > series.endNumber) {
      return ServiceResponse.failure(
        `Requested QR range [${payload.startQrNumber}-${payload.endQrNumber}] is out of bounds for series '${series.seriesName}' [${series.startNumber}-${series.endNumber}]`,
        null,
        httpStatus.BAD_REQUEST
      );
    }

    const expectedCount = payload.endQrNumber - payload.startQrNumber + 1;
    const qrs = await QrInventory.find({
      series: series._id,
      qrNumber: { $gte: payload.startQrNumber, $lte: payload.endQrNumber },
    });

    if (qrs.length !== expectedCount) {
      return ServiceResponse.failure('Some QR codes in the specified range do not exist in the inventory', null, httpStatus.BAD_REQUEST);
    }

    const unavailableQrs = qrs.filter((qr) => qr.status !== QrInventoryStatus.AVAILABLE);
    if (unavailableQrs.length > 0) {
      const sampleCode = unavailableQrs[0].qrCode;
      return ServiceResponse.failure(
        `One or more QR codes in the selected range are not available (e.g. code '${sampleCode}' is in status '${unavailableQrs[0].status}')`,
        null,
        httpStatus.BAD_REQUEST
      );
    }

    const workDate = payload.workDate ? new Date(payload.workDate) : new Date();
    const assignment = await harvestAssignmentRepository.create({
      campaign: activeCampaign._id,
      workDate,
      crew: crew._id,
      farm: farm._id,
      plot: plot._id,
      valve: payload.valveId ? new mongoose.Types.ObjectId(payload.valveId) : null,
      park: payload.parkId ? new mongoose.Types.ObjectId(payload.parkId) : null,
      assignedRows: payload.assignedRows || null,
      specialZone: payload.specialZone || null,
      zoneType: payload.zoneType || 'normal',
      variety: variety._id,
      qrSeries: series._id,
      startQrNumber: payload.startQrNumber,
      endQrNumber: payload.endQrNumber,
      status: HarvestAssignmentStatus.ACTIVE,
      comments: payload.comments || '',
    });

    await QrInventory.updateMany(
      {
        series: series._id,
        qrNumber: { $gte: payload.startQrNumber, $lte: payload.endQrNumber },
      },
      {
        $set: {
          status: QrInventoryStatus.ASSIGNED,
          harvestAssignmentId: assignment._id.toString(),
        },
        $push: {
          history: {
            status: QrInventoryStatus.ASSIGNED,
            date: new Date(),
            updatedBy: new mongoose.Types.ObjectId(requestingUser.userId),
          },
        },
      }
    );

    dashboardEventPublisher.publishUpdated(DashboardEntity.QR_INVENTORY, String(series._id));

    return ServiceResponse.success('Harvest assignment created successfully', assignment, httpStatus.CREATED);
  }

  async getAssignments(filters: AssignmentListFilters) {
    const query: any = {};

    if (filters.crewId && mongoose.Types.ObjectId.isValid(filters.crewId)) {
      query.crew = new mongoose.Types.ObjectId(filters.crewId);
    }
    if (filters.farmId && mongoose.Types.ObjectId.isValid(filters.farmId)) {
      query.farm = new mongoose.Types.ObjectId(filters.farmId);
    }
    if (filters.plotId && mongoose.Types.ObjectId.isValid(filters.plotId)) {
      query.plot = new mongoose.Types.ObjectId(filters.plotId);
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.workDate) {
      const date = new Date(filters.workDate);
      const startOfDay = new Date(date.setUTCHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setUTCHours(23, 59, 59, 999));
      query.workDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [assignments, total] = await Promise.all([
      harvestAssignmentRepository.findWithPagination(query, skip, limit),
      harvestAssignmentRepository.count(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return ServiceResponse.success('Harvest assignments fetched successfully', {
      assignments,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    }, httpStatus.OK);
  }

  async getAssignmentsByCrewId(
    crewId: string,
    filters: { status?: string; workDate?: string; page?: number; limit?: number }
  ) {
    if (!mongoose.Types.ObjectId.isValid(crewId)) {
      return ServiceResponse.failure('Invalid crewId', null, httpStatus.BAD_REQUEST);
    }

    const crew = await Crew.findById(crewId).exec();
    if (!crew) {
      return ServiceResponse.failure('Crew not found', null, httpStatus.NOT_FOUND);
    }

    const query: any = { crew: new mongoose.Types.ObjectId(crewId) };

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.workDate) {
      const date = new Date(filters.workDate);
      const startOfDay = new Date(date.setUTCHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setUTCHours(23, 59, 59, 999));
      query.workDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [assignments, total] = await Promise.all([
      harvestAssignmentRepository.findWithPagination(query, skip, limit),
      harvestAssignmentRepository.count(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return ServiceResponse.success(
      'Harvest assignments for crew fetched successfully',
      {
        crew: {
          id: String(crew._id),
          crewCode: crew.crewCode,
          crewName: crew.crewName,
          status: crew.status,
          workDate: crew.workDate,
        },
        assignments,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      },
      httpStatus.OK
    );
  }

  async getAssignmentById(assignmentId: string) {
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return ServiceResponse.failure('Harvest assignment not found', null, httpStatus.NOT_FOUND);
    }
    const assignment = await HarvestAssignment.findById(assignmentId)
      .populate('campaign')
      .populate('crew')
      .populate('farm')
      .populate('plot')
      .populate('valve')
      .populate('park')
      .populate('variety')
      .populate('qrSeries');

    if (!assignment) {
      return ServiceResponse.failure('Harvest assignment not found', null, httpStatus.NOT_FOUND);
    }

    return ServiceResponse.success('Harvest assignment fetched successfully', assignment, httpStatus.OK);
  }

  async updateAssignmentStatus(assignmentId: string, status: HarvestAssignmentStatus, requestingUser: any) {
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return ServiceResponse.failure('Harvest assignment not found', null, httpStatus.NOT_FOUND);
    }
    const assignment = await harvestAssignmentRepository.findById(assignmentId);
    if (!assignment) {
      return ServiceResponse.failure('Harvest assignment not found', null, httpStatus.NOT_FOUND);
    }

    assignment.status = status;
    await assignment.save();

    return ServiceResponse.success('Harvest assignment status updated successfully', assignment, httpStatus.OK);
  }

  async assignQrRange(
    assignmentId: string,
    payload: {
      qrSeriesId: string;
      startQrNumber: number;
      endQrNumber: number;
    },
    requestingUser: any
  ) {
    if (requestingUser?.userportal !== 'app') {
      return ServiceResponse.failure(
        'QR range assignment is restricted to the mobile application',
        null,
        httpStatus.FORBIDDEN
      );
    }

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return ServiceResponse.failure('Harvest assignment not found', null, httpStatus.NOT_FOUND);
    }
    const assignment = await harvestAssignmentRepository.findById(assignmentId);
    if (!assignment) {
      return ServiceResponse.failure('Harvest assignment not found', null, httpStatus.NOT_FOUND);
    }

    if (assignment.status === HarvestAssignmentStatus.CLOSED) {
      return ServiceResponse.failure('Cannot modify QR range on a closed harvest assignment', null, httpStatus.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(payload.qrSeriesId)) {
      return ServiceResponse.failure('Invalid qrSeriesId', null, httpStatus.BAD_REQUEST);
    }
    const series = await QrSeries.findById(payload.qrSeriesId);
    if (!series) {
      return ServiceResponse.failure('QR Series not found', null, httpStatus.NOT_FOUND);
    }

    if (payload.startQrNumber > payload.endQrNumber) {
      return ServiceResponse.failure('startQrNumber cannot be greater than endQrNumber', null, httpStatus.BAD_REQUEST);
    }
    if (payload.startQrNumber < series.startNumber || payload.endQrNumber > series.endNumber) {
      return ServiceResponse.failure(
        `Requested QR range [${payload.startQrNumber}-${payload.endQrNumber}] is out of bounds for series '${series.seriesName}' [${series.startNumber}-${series.endNumber}]`,
        null,
        httpStatus.BAD_REQUEST
      );
    }

    const expectedCount = payload.endQrNumber - payload.startQrNumber + 1;
    const qrs = await QrInventory.find({
      series: series._id,
      qrNumber: { $gte: payload.startQrNumber, $lte: payload.endQrNumber },
    });

    if (qrs.length !== expectedCount) {
      return ServiceResponse.failure('Some QR codes in the specified range do not exist in the inventory', null, httpStatus.BAD_REQUEST);
    }

    const otherUnavailableQrs = qrs.filter(
      (qr) =>
        qr.status !== QrInventoryStatus.AVAILABLE &&
        qr.harvestAssignmentId !== assignment._id.toString()
    );

    if (otherUnavailableQrs.length > 0) {
      const sampleCode = otherUnavailableQrs[0].qrCode;
      return ServiceResponse.failure(
        `One or more QR codes in the selected range are not available (e.g. code '${sampleCode}' is in status '${otherUnavailableQrs[0].status}')`,
        null,
        httpStatus.BAD_REQUEST
      );
    }

    const oldQrs = await QrInventory.find({
      harvestAssignmentId: assignment._id.toString(),
      status: QrInventoryStatus.ASSIGNED,
    });

    if (oldQrs.length > 0) {
      await QrInventory.updateMany(
        { _id: { $in: oldQrs.map((qr) => qr._id) } },
        {
          $set: { status: QrInventoryStatus.AVAILABLE, harvestAssignmentId: null },
          $push: {
            history: {
              status: QrInventoryStatus.AVAILABLE,
              date: new Date(),
              updatedBy: new mongoose.Types.ObjectId(requestingUser.userId),
            },
          },
        }
      );
      dashboardEventPublisher.publishUpdated(DashboardEntity.QR_INVENTORY, String(assignment._id));
    }

    assignment.qrSeries = series._id;
    assignment.startQrNumber = payload.startQrNumber;
    assignment.endQrNumber = payload.endQrNumber;
    await assignment.save();

    await QrInventory.updateMany(
      {
        series: series._id,
        qrNumber: { $gte: payload.startQrNumber, $lte: payload.endQrNumber },
      },
      {
        $set: {
          status: QrInventoryStatus.ASSIGNED,
          harvestAssignmentId: assignment._id.toString(),
        },
        $push: {
          history: {
            status: QrInventoryStatus.ASSIGNED,
            date: new Date(),
            updatedBy: new mongoose.Types.ObjectId(requestingUser.userId),
          },
        },
      }
    );

    dashboardEventPublisher.publishUpdated(DashboardEntity.QR_INVENTORY, String(series._id));

    return ServiceResponse.success('QR range assigned successfully', assignment, httpStatus.OK);
  }

  async returnUnusedQrs(assignmentId: string, requestingUser: any) {
    if (requestingUser?.userportal !== 'app') {
      return ServiceResponse.failure(
        'Returning QR codes is restricted to the mobile application',
        null,
        httpStatus.FORBIDDEN
      );
    }

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return ServiceResponse.failure('Harvest assignment not found', null, httpStatus.NOT_FOUND);
    }
    const assignment = await harvestAssignmentRepository.findById(assignmentId);
    if (!assignment) {
      return ServiceResponse.failure('Harvest assignment not found', null, httpStatus.NOT_FOUND);
    }

    const unusedQrs = await QrInventory.find({
      harvestAssignmentId: assignment._id.toString(),
      status: QrInventoryStatus.ASSIGNED,
    });

    if (unusedQrs.length === 0) {
      return ServiceResponse.success('No unused QR codes to return', { count: 0 }, httpStatus.OK);
    }

    await QrInventory.updateMany(
      { _id: { $in: unusedQrs.map((qr) => qr._id) } },
      {
        $set: { status: QrInventoryStatus.AVAILABLE, harvestAssignmentId: null },
        $push: {
          history: {
            status: QrInventoryStatus.AVAILABLE,
            date: new Date(),
            updatedBy: new mongoose.Types.ObjectId(requestingUser.userId),
          },
        },
      }
    );

    dashboardEventPublisher.publishUpdated(DashboardEntity.QR_INVENTORY, String(assignment._id));

    return ServiceResponse.success(
      `Successfully returned ${unusedQrs.length} unused QR codes to inventory`,
      { count: unusedQrs.length },
      httpStatus.OK
    );
  }

  async changeVarietyMidDay(
    assignmentId: string,
    payload: { newVarietyId: string; confirm: boolean },
    requestingUser: any
  ) {
    if (!payload.confirm) {
      return ServiceResponse.failure('Confirmation is required to change variety mid-day', null, httpStatus.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return ServiceResponse.failure('Harvest assignment not found', null, httpStatus.NOT_FOUND);
    }

    const assignment = await harvestAssignmentRepository.findById(assignmentId);
    if (!assignment) {
      return ServiceResponse.failure('Harvest assignment not found', null, httpStatus.NOT_FOUND);
    }

    if (assignment.status === HarvestAssignmentStatus.CLOSED) {
      return ServiceResponse.failure('Cannot modify variety on a closed harvest assignment', null, httpStatus.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(payload.newVarietyId)) {
      return ServiceResponse.failure('Invalid newVarietyId', null, httpStatus.BAD_REQUEST);
    }

    const newVariety = await Variety.findById(payload.newVarietyId);
    if (!newVariety || newVariety.status !== VarietyStatus.ACTIVE) {
      return ServiceResponse.failure('New variety not found or is inactive', null, httpStatus.BAD_REQUEST);
    }

    if (String(assignment.variety) === String(newVariety._id)) {
      return ServiceResponse.failure('New variety is the same as the current variety', null, httpStatus.BAD_REQUEST);
    }

    const plotDoc = await Plot.findById(assignment.plot);
    if (!plotDoc) {
      return ServiceResponse.failure('Associated plot not found', null, httpStatus.NOT_FOUND);
    }

    const hasVariety = plotDoc.avocadoVariety.some(
      (vName) => vName.toLowerCase().trim() === newVariety.varietyName.toLowerCase().trim()
    );

    if (!hasVariety) {
      return ServiceResponse.failure(`Variety '${newVariety.varietyName}' is not configured for Plot '${plotDoc.plotName}'`, null, httpStatus.BAD_REQUEST);
    }

    const originalVarietyId = assignment.variety;
    assignment.variety = newVariety._id;

    if (!assignment.varietyChanges) {
      assignment.varietyChanges = [];
    }

    assignment.varietyChanges.push({
      originalVariety: originalVarietyId,
      newVariety: newVariety._id,
      changedAt: new Date(),
      changedBy: new mongoose.Types.ObjectId(requestingUser.userId),
    });

    await assignment.save();
    return ServiceResponse.success('Variety updated successfully for the harvest assignment', assignment, httpStatus.OK);
  }

  async getVarietyChangeAudit(assignmentId: string) {
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return ServiceResponse.failure('Harvest assignment not found', null, httpStatus.NOT_FOUND);
    }

    const assignment = await HarvestAssignment.findById(assignmentId)
      .populate('varietyChanges.originalVariety', 'varietyName varietyCode')
      .populate('varietyChanges.newVariety', 'varietyName varietyCode')
      .populate('varietyChanges.changedBy', 'name email');

    if (!assignment) {
      return ServiceResponse.failure('Harvest assignment not found', null, httpStatus.NOT_FOUND);
    }

    const qrs = await QrInventory.find({
      harvestAssignmentId: assignment._id.toString(),
    });

    const auditEvents = (assignment.varietyChanges || []).map((change: any) => {
      const changedAt = new Date(change.changedAt);

      const getScanTime = (qr: any): Date | null => {
        const historyEntry = qr.history?.find(
          (h: any) => h.status === QrInventoryStatus.SCANNED_AT_COLLECTION
        );
        if (historyEntry) {
          return new Date(historyEntry.date);
        }
        if (
          [
            QrInventoryStatus.SCANNED_AT_COLLECTION,
            QrInventoryStatus.USED,
            QrInventoryStatus.ASSIGNED_TO_DISPATCH,
            QrInventoryStatus.DISPATCHED,
          ].includes(qr.status)
        ) {
          return new Date(qr.updatedAt);
        }
        return null;
      };

      const binsBefore: any[] = [];
      const binsAfter: any[] = [];

      for (const qr of qrs) {
        const scanTime = getScanTime(qr);
        if (scanTime) {
          if (scanTime < changedAt) {
            binsBefore.push({
              qrCode: qr.qrCode,
              qrNumber: qr.qrNumber,
              scannedAt: scanTime,
              status: qr.status,
            });
          } else {
            binsAfter.push({
              qrCode: qr.qrCode,
              qrNumber: qr.qrNumber,
              scannedAt: scanTime,
              status: qr.status,
            });
          }
        }
      }

      return {
        changeEventId: change._id,
        originalVariety: change.originalVariety,
        newVariety: change.newVariety,
        changedAt: change.changedAt,
        changedBy: change.changedBy,
        binsScannedBefore: binsBefore,
        binsScannedAfter: binsAfter,
      };
    });

    return ServiceResponse.success('Variety change audit retrieved successfully', {
      assignmentId: assignment._id,
      campaign: assignment.campaign,
      farm: assignment.farm,
      plot: assignment.plot,
      varietyChangesAudit: auditEvents,
    }, httpStatus.OK);
  }

  async updateAssignment(assignmentId: string, payload: UpdateAssignmentBody, requestingUser: any) {
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return ServiceResponse.failure('Invalid assignmentId', null, httpStatus.BAD_REQUEST);
    }

    const assignment = await harvestAssignmentRepository.findById(assignmentId);
    if (!assignment) {
      return ServiceResponse.failure('Harvest assignment not found', null, httpStatus.NOT_FOUND);
    }

    const isClosed = assignment.status === HarvestAssignmentStatus.CLOSED;

    if (isClosed) {
      const isFieldEngineerOrAdmin = requestingUser?.roles?.some((role: any) =>
        ['System Administrator', 'Field Engineer'].includes(role.name)
      );

      if (!isFieldEngineerOrAdmin) {
        return ServiceResponse.failure(
          'Post-closure record corrections require Field Engineer or System Administrator role',
          null,
          httpStatus.FORBIDDEN
        );
      }

      if (!payload.changeReason || !payload.changeReason.trim()) {
        return ServiceResponse.failure(
          'Mandatory reason for change (changeReason) is required when editing closed records',
          null,
          httpStatus.BAD_REQUEST
        );
      }
    }

    if (payload.crewId) {
      if (!mongoose.Types.ObjectId.isValid(payload.crewId)) {
        return ServiceResponse.failure('Invalid crewId', null, httpStatus.BAD_REQUEST);
      }
      const crew = await Crew.findById(payload.crewId);
      if (!crew) {
        return ServiceResponse.failure('Daily crew not found', null, httpStatus.NOT_FOUND);
      }
      if (crew.status !== CrewStatus.ACTIVE) {
        return ServiceResponse.failure(
          `Daily crew must be in Active status. Current status: ${crew.status}`,
          null,
          httpStatus.BAD_REQUEST
        );
      }
      assignment.crew = crew._id;
    }

    const targetFarmId = payload.farmId || assignment.farm.toString();
    const targetPlotId = payload.plotId || assignment.plot.toString();

    if (payload.farmId) {
      if (!mongoose.Types.ObjectId.isValid(payload.farmId)) {
        return ServiceResponse.failure('Invalid farmId', null, httpStatus.BAD_REQUEST);
      }
      const farm = await Farm.findById(payload.farmId);
      if (!farm) {
        return ServiceResponse.failure('Farm not found', null, httpStatus.NOT_FOUND);
      }
      assignment.farm = farm._id;
    }

    if (payload.plotId || payload.farmId) {
      if (!mongoose.Types.ObjectId.isValid(targetPlotId)) {
        return ServiceResponse.failure('Invalid plotId', null, httpStatus.BAD_REQUEST);
      }
      const plot = await Plot.findOne({ _id: targetPlotId, parentFarm: targetFarmId });
      if (!plot) {
        return ServiceResponse.failure('Plot not found or does not belong to the selected farm', null, httpStatus.NOT_FOUND);
      }
      assignment.plot = plot._id;
    }

    if (payload.varietyId || payload.plotId) {
      const targetVarietyId = payload.varietyId || assignment.variety.toString();
      if (!mongoose.Types.ObjectId.isValid(targetVarietyId)) {
        return ServiceResponse.failure('Invalid varietyId', null, httpStatus.BAD_REQUEST);
      }
      const variety = await Variety.findOne({ _id: targetVarietyId, status: VarietyStatus.ACTIVE });
      if (!variety) {
        return ServiceResponse.failure('Avocado variety not found or inactive', null, httpStatus.NOT_FOUND);
      }

      const plot = await Plot.findById(targetPlotId);
      if (plot) {
        const isConfiguredForPlot = plot.avocadoVariety.some(
          (vName) => vName.toLowerCase() === variety.varietyName.toLowerCase()
        );
        if (!isConfiguredForPlot) {
          return ServiceResponse.failure(
            `Avocado variety '${variety.varietyName}' is not configured for plot '${plot.plotName}'`,
            null,
            httpStatus.BAD_REQUEST
          );
        }
      }
      if (payload.varietyId) {
        assignment.variety = variety._id;
      }
    }

    if (payload.valveId !== undefined) {
      if (payload.valveId === null || payload.valveId === '') {
        assignment.valve = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(payload.valveId)) {
          return ServiceResponse.failure('Invalid valveId', null, httpStatus.BAD_REQUEST);
        }
        const valve = await Valve.findOne({ _id: payload.valveId, parentPlot: targetPlotId });
        if (!valve) {
          return ServiceResponse.failure('Valve not found or does not belong to the selected plot', null, httpStatus.NOT_FOUND);
        }
        assignment.valve = valve._id;
      }
    }

    if (payload.parkId !== undefined) {
      if (payload.parkId === null || payload.parkId === '') {
        assignment.park = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(payload.parkId)) {
          return ServiceResponse.failure('Invalid parkId', null, httpStatus.BAD_REQUEST);
        }
        const park = await Park.findById(payload.parkId);
        if (!park) {
          return ServiceResponse.failure('Park not found', null, httpStatus.NOT_FOUND);
        }
        assignment.park = park._id;
      }
    }

    if (payload.assignedRows !== undefined) assignment.assignedRows = payload.assignedRows;
    if (payload.specialZone !== undefined) assignment.specialZone = payload.specialZone;
    if (payload.zoneType) assignment.zoneType = payload.zoneType;
    if (payload.comments !== undefined) assignment.comments = payload.comments;
    if (payload.workDate) assignment.workDate = new Date(payload.workDate);

    await assignment.save();

    const populated = await harvestAssignmentRepository.findByIdWithDetails(assignment._id.toString());

    return ServiceResponse.success(
      isClosed ? 'Post-closure harvest assignment updated successfully' : 'Harvest assignment updated successfully',
      populated,
      httpStatus.OK
    );
  }

  async getFarmManagerHistory(filters: {
    filter?: 'all' | 'byFarm' | 'byCrew';
    farmId?: string;
    crewId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 20);
    const skip = (page - 1) * limit;

    const crewQuery: any = {};
    if (filters.crewId && mongoose.Types.ObjectId.isValid(filters.crewId)) {
      crewQuery._id = new mongoose.Types.ObjectId(filters.crewId);
    }
    if (filters.startDate || filters.endDate) {
      crewQuery.workDate = {};
      if (filters.startDate) crewQuery.workDate.$gte = new Date(filters.startDate);
      if (filters.endDate) crewQuery.workDate.$lte = new Date(filters.endDate);
    }

    const [crews, total] = await Promise.all([
      Crew.find(crewQuery)
        .sort({ workDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('assignedPickers', 'firstName lastName workerCode')
        .populate('supervisor', 'firstName lastName email')
        .lean(),
      Crew.countDocuments(crewQuery),
    ]);

    const items = await Promise.all(
      crews.map(async (crewDoc: any) => {
        const crewIdObj = crewDoc._id;

        const assignments = await HarvestAssignment.find({ crew: crewIdObj })
          .populate('farm', 'farmName')
          .populate('plot', 'plotName')
          .populate('variety', 'varietyName')
          .lean();

        if (filters.farmId && mongoose.Types.ObjectId.isValid(filters.farmId)) {
          const matchesFarm = assignments.some(
            (a: any) => a.farm?._id?.toString() === filters.farmId || a.farm?.toString() === filters.farmId
          );
          if (!matchesFarm && assignments.length > 0) {
            return null;
          }
        }

        const assignmentIds = assignments.map((a: any) => a._id);
        const [scansCount, qrUsedCount] = await Promise.all([
          HarvestReceiptScan.countDocuments({
            $or: [{ crew: crewIdObj }, { harvestAssignment: { $in: assignmentIds } }],
          }),
          QrInventory.countDocuments({
            harvestAssignmentId: { $in: assignments.map((a: any) => a._id.toString()) },
            status: {
              $in: [
                QrInventoryStatus.USED,
                QrInventoryStatus.SCANNED_AT_COLLECTION,
                QrInventoryStatus.ASSIGNED_TO_DISPATCH,
                QrInventoryStatus.DISPATCHED,
              ],
            },
          }),
        ]);

        const totalPallets = Math.max(scansCount, qrUsedCount);
        const pickersCount = Array.isArray(crewDoc.assignedPickers) ? crewDoc.assignedPickers.length : 0;

        const dateObj = new Date(crewDoc.workDate || crewDoc.createdAt);
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const firstFarmAssignment: any = assignments.find((a: any) => (a.farm as any)?.farmName);
        const farmName = firstFarmAssignment?.farm?.farmName || 'Farm A';
        const formattedDate = `${days[dateObj.getDay()]}, ${months[dateObj.getMonth()]} ${dateObj.getDate()}`;

        return {
          id: crewDoc._id.toString(),
          assignmentId: assignments[0]?._id?.toString() || crewDoc._id.toString(),
          date: dateObj,
          formattedDate,
          crewId: crewDoc._id.toString(),
          crewName: crewDoc.crewName,
          farmId: assignments[0]?.farm?._id?.toString() || null,
          farmName,
          pickersCount,
          palletsCount: totalPallets,
          status: crewDoc.status || 'closed',
          subtitle: `${crewDoc.crewName} · ${pickersCount} pickers · ${totalPallets} pallets`,
        };
      })
    );

    const filteredItems = items.filter(Boolean);

    return ServiceResponse.success(
      'Farm manager history fetched successfully',
      {
        items: filteredItems,
        total: filteredItems.length,
        page,
        limit,
      },
      httpStatus.OK
    );
  }

  async getFarmManagerHistoryById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ServiceResponse.failure('Invalid history ID', null, httpStatus.BAD_REQUEST);
    }

    let crew = await Crew.findById(id).populate('assignedPickers', 'firstName lastName workerCode').lean();
    let assignments: any[] = [];

    if (crew) {
      assignments = await HarvestAssignment.find({ crew: crew._id })
        .populate('farm', 'farmName')
        .populate('plot', 'plotName')
        .populate('variety', 'varietyName')
        .lean();
    } else {
      const assignment = await HarvestAssignment.findById(id)
        .populate('farm', 'farmName')
        .populate('plot', 'plotName')
        .populate('variety', 'varietyName')
        .lean();

      if (!assignment) {
        return ServiceResponse.failure('History record not found', null, httpStatus.NOT_FOUND);
      }

      crew = await Crew.findById(assignment.crew).populate('assignedPickers', 'firstName lastName workerCode').lean();
      assignments = [assignment];
    }

    if (!crew) {
      return ServiceResponse.failure('Associated crew record not found', null, httpStatus.NOT_FOUND);
    }

    const crewIdObj = crew._id;
    const assignmentIds = assignments.map((a) => a._id);

    const scans = await HarvestReceiptScan.find({
      $or: [{ crew: crewIdObj }, { harvestAssignment: { $in: assignmentIds } }],
    })
      .populate('variety', 'varietyName')
      .lean();

    const varietyMap = new Map<string, { varietyId: string; varietyName: string; pallets: number }>();

    scans.forEach((scan: any) => {
      const varietyId = scan.variety?._id?.toString() || scan.variety?.toString() || 'unknown';
      const varietyName = scan.variety?.varietyName || 'Hass';

      const existing = varietyMap.get(varietyName) || { varietyId, varietyName, pallets: 0 };
      existing.pallets += 1;
      varietyMap.set(varietyName, existing);
    });

    if (varietyMap.size === 0 && assignments.length > 0) {
      for (const ass of assignments) {
        const varName = ass.variety?.varietyName || 'Hass';
        const varId = ass.variety?._id?.toString() || 'unknown';
        const estPallets =
          ass.endQrNumber && ass.startQrNumber ? Math.max(1, ass.endQrNumber - ass.startQrNumber + 1) : 0;

        const existing = varietyMap.get(varName) || { varietyId: varId, varietyName: varName, pallets: 0 };
        existing.pallets += estPallets;
        varietyMap.set(varName, existing);
      }
    }

    const palletSummary = Array.from(varietyMap.values());
    const totalPallets = palletSummary.reduce((sum, item) => sum + item.pallets, 0);
    const pickersCount = Array.isArray(crew.assignedPickers) ? crew.assignedPickers.length : 0;

    const dateObj = new Date(crew.workDate || crew.createdAt);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedDate = `${days[dateObj.getDay()]}, ${months[dateObj.getMonth()]} ${dateObj.getDate()}`;
    const farmName = (assignments[0]?.farm as any)?.farmName || 'Farm A';

    return ServiceResponse.success(
      'History detail fetched successfully',
      {
        id: crew._id.toString(),
        crewId: crew._id.toString(),
        crewName: crew.crewName,
        status: crew.status || 'closed',
        date: dateObj,
        formattedDate,
        pickers: pickersCount,
        palletsReceived: totalPallets,
        assignments: assignments.length || 1,
        farmName,
        palletSummary,
      },
      httpStatus.OK
    );
  }
}

export default new HarvestAssignmentService();
