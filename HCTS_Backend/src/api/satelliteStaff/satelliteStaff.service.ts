import mongoose from 'mongoose';
import httpStatus from 'http-status';
import {
  SatelliteStaff,
  Campaign,
  Worker,
  SatelliteRole,
  Farm,
  Plot,
  Valve,
  Crew,
  Attendance,
  AuditLog,
  HarvestAssignment,
} from '../../models/index.ts';
import { CampaignStatus } from '../../models/campaign.model.ts';
import { WorkerStatus } from '../../models/worker.model.ts';
import { FarmStatus } from '../../models/farm.model.ts';
import { PlotStatus } from '../../models/plot.model.ts';
import { ValveStatus } from '../../models/valve.model.ts';
import ServiceResponse from '../../utils/ServiceResponse.ts';
import satelliteStaffRepository from './satelliteStaff.repository.ts';
import type { RegisterStaffPayload, SatelliteStaffListFilters } from './satelliteStaff.types.ts';

class SatelliteStaffService {
  async registerSatelliteStaff(payload: RegisterStaffPayload, registeredByUserId: string) {
    try {
      const activeCampaign = await Campaign.findOne({ status: CampaignStatus.ACTIVE });
      if (!activeCampaign) {
        return ServiceResponse.failure('Active campaign is required to register satellite staff', null, httpStatus.BAD_REQUEST);
      }

      if (!mongoose.Types.ObjectId.isValid(payload.workerId)) {
        return ServiceResponse.failure('Invalid workerId', null, httpStatus.BAD_REQUEST);
      }
      const workerDoc = await Worker.findOne({ _id: payload.workerId, status: WorkerStatus.ACTIVE });
      if (!workerDoc) {
        return ServiceResponse.failure('Active worker not found', null, httpStatus.BAD_REQUEST);
      }

      const parsedWorkDate = new Date(payload.workDate);
      const startOfDay = new Date(new Date(parsedWorkDate).setUTCHours(0, 0, 0, 0));
      const endOfDay = new Date(new Date(parsedWorkDate).setUTCHours(23, 59, 59, 999));

      const conflictingCrew = await Crew.findOne({
        workDate: { $gte: startOfDay, $lte: endOfDay },
        $or: [
          { assignedPickers: workerDoc._id },
          { leader: workerDoc._id }
        ]
      });

      if (conflictingCrew) {
        const role = String(conflictingCrew.leader) === String(workerDoc._id) ? 'leader' : 'picker';
        const workerName = `${workerDoc.firstName} ${workerDoc.lastName}`;
        return ServiceResponse.failure(
          `Worker '${workerName}' is already assigned as a ${role} in crew '${conflictingCrew.crewName}' today.`,
          null,
          httpStatus.BAD_REQUEST
        );
      }

      if (!mongoose.Types.ObjectId.isValid(payload.satelliteRoleId)) {
        return ServiceResponse.failure('Invalid satelliteRoleId', null, httpStatus.BAD_REQUEST);
      }
      const roleDoc = await SatelliteRole.findOne({ _id: payload.satelliteRoleId, isActive: true });
      if (!roleDoc) {
        return ServiceResponse.failure('Active satellite role not found', null, httpStatus.BAD_REQUEST);
      }

      if (!mongoose.Types.ObjectId.isValid(payload.farmId)) {
        return ServiceResponse.failure('Invalid farmId', null, httpStatus.BAD_REQUEST);
      }
      const farmDoc = await Farm.findOne({ _id: payload.farmId, status: FarmStatus.ACTIVE });
      if (!farmDoc) {
        return ServiceResponse.failure('Active farm not found', null, httpStatus.BAD_REQUEST);
      }

      let plotObjectId: mongoose.Types.ObjectId | null = null;
      if (payload.plotId) {
        if (!mongoose.Types.ObjectId.isValid(payload.plotId)) {
          return ServiceResponse.failure('Invalid plotId', null, httpStatus.BAD_REQUEST);
        }
        const plotDoc = await Plot.findOne({ _id: payload.plotId, parentFarm: payload.farmId, status: PlotStatus.ACTIVE });
        if (!plotDoc) {
          return ServiceResponse.failure('Active plot not found under the selected farm', null, httpStatus.BAD_REQUEST);
        }
        plotObjectId = plotDoc._id as mongoose.Types.ObjectId;
      }

      let valveObjectId: mongoose.Types.ObjectId | null = null;
      if (payload.valveId) {
        if (!mongoose.Types.ObjectId.isValid(payload.valveId)) {
          return ServiceResponse.failure('Invalid valveId', null, httpStatus.BAD_REQUEST);
        }
        const valveDoc = await Valve.findOne({ _id: payload.valveId, parentPlot: payload.plotId, status: ValveStatus.ACTIVE });
        if (!valveDoc) {
          return ServiceResponse.failure('Active valve not found under the selected plot', null, httpStatus.BAD_REQUEST);
        }
        valveObjectId = valveDoc._id as mongoose.Types.ObjectId;
      }

      const employmentCompany = workerDoc.employmentCompany;

      const record = await satelliteStaffRepository.create({
        campaign: activeCampaign._id,
        workDate: new Date(payload.workDate),
        worker: workerDoc._id,
        employmentCompany,
        satelliteRole: roleDoc._id,
        farm: farmDoc._id,
        plot: plotObjectId,
        valve: valveObjectId,
        workZone: payload.workZone || '',
        shiftType: payload.shiftType || 'full',
        shiftFraction: payload.shiftFraction !== undefined ? payload.shiftFraction : 1.0,
        partialReason: payload.partialReason || '',
        checkInTime: payload.checkInTime ? new Date(payload.checkInTime) : new Date(),
        checkOutTime: payload.checkOutTime ? new Date(payload.checkOutTime) : null,
        registeredBy: new mongoose.Types.ObjectId(registeredByUserId),
      });

      const populatedRecord = await satelliteStaffRepository.findByIdWithDetails(record._id);

      return ServiceResponse.success('Daily satellite staff registered successfully', populatedRecord, httpStatus.CREATED);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }

  async getDailySatelliteStaff(filters: SatelliteStaffListFilters) {
    const query: any = {};

    if (filters.workDate) {
      const start = new Date(filters.workDate);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(filters.workDate);
      end.setUTCHours(23, 59, 59, 999);
      query.workDate = { $gte: start, $lte: end };
    }

    if (filters.satelliteRoleId && mongoose.Types.ObjectId.isValid(filters.satelliteRoleId)) {
      query.satelliteRole = new mongoose.Types.ObjectId(filters.satelliteRoleId);
    }

    if (filters.farmId && mongoose.Types.ObjectId.isValid(filters.farmId)) {
      query.farm = new mongoose.Types.ObjectId(filters.farmId);
    }

    if (filters.campaignId && mongoose.Types.ObjectId.isValid(filters.campaignId)) {
      query.campaign = new mongoose.Types.ObjectId(filters.campaignId);
    }

    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, filters.limit || 10);
    const skip = (page - 1) * limit;

    const [staff, total] = await Promise.all([
      satelliteStaffRepository.findWithPagination(query, skip, limit),
      satelliteStaffRepository.count(query),
    ]);

    return ServiceResponse.success('Daily satellite staff retrieved successfully', {
      staff,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }, httpStatus.OK);
  }

  async updateSatelliteStaff(
    id: string,
    payload: Partial<RegisterStaffPayload>,
    registeredByUserId: string
  ) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ServiceResponse.failure('Invalid satellite staff registration ID', null, httpStatus.BAD_REQUEST);
      }

      const staff = await satelliteStaffRepository.findById(id);
      if (!staff) {
        return ServiceResponse.failure('Satellite staff registration not found', null, httpStatus.NOT_FOUND);
      }

      const targetWorker = payload.workerId || staff.worker.toString();
      const targetWorkDate = payload.workDate ? new Date(payload.workDate) : staff.workDate;
      const startOfDay = new Date(new Date(targetWorkDate).setUTCHours(0, 0, 0, 0));
      const endOfDay = new Date(new Date(targetWorkDate).setUTCHours(23, 59, 59, 999));

      if (payload.workerId || payload.workDate) {
        const conflictingCrew = await Crew.findOne({
          workDate: { $gte: startOfDay, $lte: endOfDay },
          $or: [
            { assignedPickers: new mongoose.Types.ObjectId(targetWorker) },
            { leader: new mongoose.Types.ObjectId(targetWorker) }
          ]
        });

        if (conflictingCrew) {
          const workerDoc = await Worker.findById(targetWorker);
          const role = String(conflictingCrew.leader) === String(targetWorker) ? 'leader' : 'picker';
          const workerName = workerDoc ? `${workerDoc.firstName} ${workerDoc.lastName}` : 'Worker';
          return ServiceResponse.failure(
            `Worker '${workerName}' is already assigned as a ${role} in crew '${conflictingCrew.crewName}' today.`,
            null,
            httpStatus.BAD_REQUEST
          );
        }
      }

      if (payload.workerId) {
        if (!mongoose.Types.ObjectId.isValid(payload.workerId)) {
          return ServiceResponse.failure('Invalid workerId', null, httpStatus.BAD_REQUEST);
        }
        const workerDoc = await Worker.findOne({ _id: payload.workerId, status: WorkerStatus.ACTIVE });
        if (!workerDoc) {
          return ServiceResponse.failure('Active worker not found', null, httpStatus.BAD_REQUEST);
        }
        staff.worker = workerDoc._id;
        staff.employmentCompany = workerDoc.employmentCompany;
      }

      if (payload.satelliteRoleId) {
        if (!mongoose.Types.ObjectId.isValid(payload.satelliteRoleId)) {
          return ServiceResponse.failure('Invalid satelliteRoleId', null, httpStatus.BAD_REQUEST);
        }
        const roleDoc = await SatelliteRole.findOne({ _id: payload.satelliteRoleId, isActive: true });
        if (!roleDoc) {
          return ServiceResponse.failure('Active satellite role not found', null, httpStatus.BAD_REQUEST);
        }
        staff.satelliteRole = roleDoc._id;
      }

      if (payload.farmId) {
        if (!mongoose.Types.ObjectId.isValid(payload.farmId)) {
          return ServiceResponse.failure('Invalid farmId', null, httpStatus.BAD_REQUEST);
        }
        const farmDoc = await Farm.findOne({ _id: payload.farmId, status: FarmStatus.ACTIVE });
        if (!farmDoc) {
          return ServiceResponse.failure('Active farm not found', null, httpStatus.BAD_REQUEST);
        }
        staff.farm = farmDoc._id;
      }

      if (payload.plotId !== undefined) {
        if (payload.plotId === null) {
          staff.plot = null;
        } else {
          const farmToCheck = payload.farmId || staff.farm.toString();
          if (!mongoose.Types.ObjectId.isValid(payload.plotId)) {
            return ServiceResponse.failure('Invalid plotId', null, httpStatus.BAD_REQUEST);
          }
          const plotDoc = await Plot.findOne({ _id: payload.plotId, parentFarm: farmToCheck, status: PlotStatus.ACTIVE });
          if (!plotDoc) {
            return ServiceResponse.failure('Active plot not found under the farm', null, httpStatus.BAD_REQUEST);
          }
          staff.plot = plotDoc._id as mongoose.Types.ObjectId;
        }
      }

      if (payload.valveId !== undefined) {
        if (payload.valveId === null) {
          staff.valve = null;
        } else {
          const plotToCheck = payload.plotId || (staff.plot ? staff.plot.toString() : undefined);
          if (!plotToCheck) {
            return ServiceResponse.failure('Cannot assign a valve without a plot', null, httpStatus.BAD_REQUEST);
          }
          if (!mongoose.Types.ObjectId.isValid(payload.valveId)) {
            return ServiceResponse.failure('Invalid valveId', null, httpStatus.BAD_REQUEST);
          }
          const valveDoc = await Valve.findOne({ _id: payload.valveId, parentPlot: plotToCheck, status: ValveStatus.ACTIVE });
          if (!valveDoc) {
            return ServiceResponse.failure('Active valve not found under the plot', null, httpStatus.BAD_REQUEST);
          }
          staff.valve = valveDoc._id as mongoose.Types.ObjectId;
        }
      }

      if (payload.workDate) {
        staff.workDate = new Date(payload.workDate);
      }
      if (payload.workZone !== undefined) {
        staff.workZone = payload.workZone;
      }
      if (payload.shiftType) {
        staff.shiftType = payload.shiftType;
      }
      if (payload.shiftFraction !== undefined) {
        staff.shiftFraction = payload.shiftFraction;
      }
      if (payload.partialReason !== undefined) {
        staff.partialReason = payload.partialReason;
      }

      staff.registeredBy = new mongoose.Types.ObjectId(registeredByUserId);
      await staff.save();

      const populatedRecord = await satelliteStaffRepository.findByIdWithDetails(staff._id);

      return ServiceResponse.success('Satellite staff registration updated successfully', populatedRecord, httpStatus.OK);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }

  async bulkSyncSatelliteStaff(records: RegisterStaffPayload[], registeredByUserId: string) {
    try {
      const results = [];
      const errors = [];

      for (let i = 0; i < records.length; i++) {
        const payload = records[i];
        const res = await this.registerSatelliteStaff(payload, registeredByUserId);
        if (res.success) {
          results.push(res.responseObject);
        } else {
          errors.push({ index: i, error: res.message });
        }
      }

      return ServiceResponse.success('Bulk offline synchronization completed', {
        syncedCount: results.length,
        failedCount: errors.length,
        errors,
        syncedRecords: results,
      }, httpStatus.OK);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }

  async getSatelliteStaffReport(workDateStr?: string) {
    try {
      const targetDate = workDateStr ? new Date(workDateStr) : new Date();
      const startOfDay = new Date(new Date(targetDate).setUTCHours(0, 0, 0, 0));
      const endOfDay = new Date(new Date(targetDate).setUTCHours(23, 59, 59, 999));

      const staffList = await SatelliteStaff.find({
        workDate: { $gte: startOfDay, $lte: endOfDay },
      })
        .populate('worker', 'firstName lastName internalCode')
        .populate('campaign', 'campaignName campaignCode')
        .populate('employmentCompany', 'companyName taxId')
        .populate('satelliteRole', 'name')
        .populate('farm', 'farmName internalCode')
        .populate('plot', 'plotName plotCode')
        .populate('valve', 'valveName valveCode')
        .populate('registeredBy', 'firstName lastName name email')
        .exec();

      const roleMap: Record<string, { roleName: string; totalEquivalentHeadcount: number; totalPhysicalWorkers: number; workerIds: Set<string> }> = {};
      for (const staff of staffList) {
        const roleId = staff.satelliteRole?._id?.toString() || 'unknown';
        const roleName = (staff.satelliteRole as any)?.name || 'Unknown Role';
        const workerId = staff.worker?._id?.toString() || 'unknown';
        const fraction = staff.shiftFraction || 0;

        if (!roleMap[roleId]) {
          roleMap[roleId] = {
            roleName,
            totalEquivalentHeadcount: 0,
            totalPhysicalWorkers: 0,
            workerIds: new Set<string>(),
          };
        }
        roleMap[roleId].totalEquivalentHeadcount = Number((roleMap[roleId].totalEquivalentHeadcount + fraction).toFixed(2));
        roleMap[roleId].workerIds.add(workerId);
      }

      const headcountPerRole = Object.keys(roleMap).map((roleId) => ({
        roleId,
        roleName: roleMap[roleId].roleName,
        totalEquivalentHeadcount: roleMap[roleId].totalEquivalentHeadcount,
        totalPhysicalWorkers: roleMap[roleId].workerIds.size,
      }));

      const dailyAttendances = await Attendance.find({
        workDate: { $gte: startOfDay, $lte: endOfDay },
      });
      const uniqueDailyPickers = new Set(dailyAttendances.map(a => a.worker.toString()));
      const totalPickersCount = uniqueDailyPickers.size;

      const totalSatelliteShiftFractions = staffList.reduce((acc, s) => acc + (s.shiftFraction || 0), 0);
      const dailyPickerToSatelliteRatio = totalSatelliteShiftFractions > 0
        ? Number((totalPickersCount / totalSatelliteShiftFractions).toFixed(2))
        : totalPickersCount;

      const farms = await Farm.find({ status: FarmStatus.ACTIVE });
      const pickerToSatelliteRatioPerFarm = [];

      for (const farm of farms) {
        const farmId = farm._id.toString();

        const assignments = await HarvestAssignment.find({
          workDate: { $gte: startOfDay, $lte: endOfDay },
          farm: farm._id,
        });

        const crewIds = assignments.map(a => a.crew.toString());

        const farmCrewsAttendances = await Attendance.find({
          workDate: { $gte: startOfDay, $lte: endOfDay },
          crew: { $in: crewIds.map(id => new mongoose.Types.ObjectId(id)) },
        });
        const uniqueFarmPickers = new Set(farmCrewsAttendances.map(a => a.worker.toString()));
        const farmPickersCount = uniqueFarmPickers.size;

        const farmSatelliteList = staffList.filter(s => s.farm?._id?.toString() === farmId);
        const farmSatelliteFractions = farmSatelliteList.reduce((acc, s) => acc + (s.shiftFraction || 0), 0);

        const farmRatio = farmSatelliteFractions > 0
          ? Number((farmPickersCount / farmSatelliteFractions).toFixed(2))
          : farmPickersCount;

        pickerToSatelliteRatioPerFarm.push({
          farmId,
          farmName: farm.farmName,
          pickerCount: farmPickersCount,
          satelliteStaffCount: farmSatelliteList.length,
          satelliteShiftFractions: Number(farmSatelliteFractions.toFixed(2)),
          ratio: farmRatio,
        });
      }

      const middayLogs = await AuditLog.find({
        event: 'WORKER_ROLE_CHANGED_MIDDAY',
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      })
        .populate('actorUserId', 'firstName lastName name email')
        .sort({ createdAt: 1 })
        .exec();

      const roleChangeEvents = [];
      for (const log of middayLogs) {
        const reqBody = log.requestBody || {};
        const workerId = log.entityId;

        let workerName = 'Unknown';
        if (workerId && mongoose.Types.ObjectId.isValid(workerId)) {
          const w = await Worker.findById(workerId);
          if (w) {
            workerName = `${w.firstName} ${w.lastName}`;
          }
        }

        roleChangeEvents.push({
          workerId,
          workerName,
          timing: reqBody.changeTime || log.createdAt,
          exitContext: reqBody.exitContext || 'Unknown',
          entryContext: reqBody.entryContext || 'Unknown',
          reason: reqBody.reason || 'No reason provided',
        });
      }

      return ServiceResponse.success('Daily satellite staff report generated successfully', {
        date: startOfDay.toISOString().split('T')[0],
        summary: {
          totalSatelliteStaffCount: staffList.length,
          totalSatelliteShiftFractions: Number(totalSatelliteShiftFractions.toFixed(2)),
          totalPickersCount,
          pickerToSatelliteRatio: dailyPickerToSatelliteRatio,
        },
        headcountPerRole,
        pickerToSatelliteRatioPerFarm,
        roleChangeEvents,
        staffList,
      }, httpStatus.OK);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }

  async checkInStaff(id: string, entryTime?: string | Date, registeredByUserId?: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ServiceResponse.failure('Invalid satellite staff registration ID', null, httpStatus.BAD_REQUEST);
      }

      const staff = await satelliteStaffRepository.findById(id);
      if (!staff) {
        return ServiceResponse.failure('Satellite staff registration not found', null, httpStatus.NOT_FOUND);
      }

      staff.checkInTime = entryTime ? new Date(entryTime) : new Date();
      if (registeredByUserId && mongoose.Types.ObjectId.isValid(registeredByUserId)) {
        staff.registeredBy = new mongoose.Types.ObjectId(registeredByUserId);
      }

      await staff.save();
      const populatedRecord = await satelliteStaffRepository.findByIdWithDetails(staff._id);
      return ServiceResponse.success('Satellite staff checked in successfully', populatedRecord, httpStatus.OK);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }

  async checkOutStaff(id: string, exitTime?: string | Date, registeredByUserId?: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ServiceResponse.failure('Invalid satellite staff registration ID', null, httpStatus.BAD_REQUEST);
      }

      const staff = await satelliteStaffRepository.findById(id);
      if (!staff) {
        return ServiceResponse.failure('Satellite staff registration not found', null, httpStatus.NOT_FOUND);
      }

      if (!staff.checkInTime) {
        return ServiceResponse.failure('Satellite staff must be checked in before they can check out', null, httpStatus.BAD_REQUEST);
      }

      const resolvedExitTime = exitTime ? new Date(exitTime) : new Date();
      if (resolvedExitTime < staff.checkInTime) {
        return ServiceResponse.failure('Exit time cannot be earlier than check-in time', null, httpStatus.BAD_REQUEST);
      }

      staff.checkOutTime = resolvedExitTime;
      const hoursWorked = (resolvedExitTime.getTime() - staff.checkInTime.getTime()) / (1000 * 60 * 60);
      const computedFraction = Math.min(1.0, Math.max(0.0, Number((hoursWorked / 8.0).toFixed(2))));

      staff.shiftFraction = computedFraction;
      staff.shiftType = computedFraction < 1.0 ? 'partial' : 'full';

      if (registeredByUserId && mongoose.Types.ObjectId.isValid(registeredByUserId)) {
        staff.registeredBy = new mongoose.Types.ObjectId(registeredByUserId);
      }

      await staff.save();
      const populatedRecord = await satelliteStaffRepository.findByIdWithDetails(staff._id);
      return ServiceResponse.success('Satellite staff checked out successfully', populatedRecord, httpStatus.OK);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }
}

export default new SatelliteStaffService();
