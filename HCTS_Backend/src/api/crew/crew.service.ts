import mongoose from 'mongoose';
import httpStatus from 'http-status';
import {
  Crew,
  Campaign,
  Worker,
  User,
  SatelliteStaff,
} from '../../models/index.ts';
import { CrewStatus } from '../../models/crew.model.ts';
import { CampaignStatus } from '../../models/campaign.model.ts';
import { WorkerStatus } from '../../models/worker.model.ts';
import ServiceResponse from '../../utils/ServiceResponse.ts';
import dashboardEventPublisher, { DashboardEntity } from '../../events/dashboard.publisher.ts';
import crewRepository from './crew.repository.ts';
import type { CreateCrewBody, CrewListFilters, UpdateCrewBody, CopyPreviousCrewsBody, GetPreviousDayCrewsQuery } from './crew.types.ts';

const CREW_MESSAGES = {
  CREATE_SUCCESS: 'Daily crew created successfully',
  FETCH_SUCCESS: 'Daily crews fetched successfully',
  FETCH_ONE_SUCCESS: 'Daily crew fetched successfully',
  UPDATE_SUCCESS: 'Daily crew updated successfully',
  ACTIVATE_SUCCESS: 'Daily crew activated successfully',
  DEACTIVATE_SUCCESS: 'Daily crew deactivated successfully',
  NOT_FOUND: 'Daily crew not found',
  ACTIVE_CAMPAIGN_REQUIRED: 'No active campaign found in the system',
  INVALID_PICKER: 'One or more assigned pickers are invalid or inactive',
  INVALID_LEADER: 'Selected crew leader is invalid or inactive',
  INVALID_SUPERVISOR: 'Selected crew supervisor not found',
} as const;

const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class CrewService {
  private async getNextCrewCode(): Promise<string> {
    const crews = await crewRepository.getAllCrews();
    let maxNum = 0;
    for (const crew of crews) {
      const match = crew.crewCode.match(/^CREW(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
    const nextNum = maxNum + 1;
    return `CREW${nextNum.toString().padStart(3, '0')}`;
  }

  private async checkWorkerConflicts(
    workerIds: string[],
    startOfDay: Date,
    endOfDay: Date,
    excludeCrewId?: string
  ): Promise<{ conflict: boolean; message: string }> {
    const query: any = {
      workDate: { $gte: startOfDay, $lte: endOfDay },
    };
    if (excludeCrewId) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeCrewId) };
    }

    const existingCrews = await crewRepository.find(query);

    for (const otherCrew of existingCrews) {
      const allOtherWorkers = [
        ...otherCrew.assignedPickers.map((id: any) => id.toString()),
        ...(otherCrew.leader ? [otherCrew.leader.toString()] : []),
      ];

      for (const wId of workerIds) {
        if (allOtherWorkers.includes(wId)) {
          const w = await Worker.findById(wId);
          const workerName = w ? `${w.firstName} ${w.lastName}` : wId;
          return {
            conflict: true,
            message: `Worker '${workerName}' is already assigned to crew '${otherCrew.crewName}' on this day.`,
          };
        }
      }
    }

    const workerObjectIds = workerIds.map((id) => new mongoose.Types.ObjectId(id));
    const conflictingStaff = await SatelliteStaff.find({
      workDate: { $gte: startOfDay, $lte: endOfDay },
      worker: { $in: workerObjectIds },
    })
      .populate('worker', 'firstName lastName')
      .populate('satelliteRole', 'name');

    if (conflictingStaff.length > 0) {
      const conflict = conflictingStaff[0];
      const workerName = conflict.worker
        ? `${(conflict.worker as any).firstName} ${(conflict.worker as any).lastName}`
        : 'Unknown Worker';
      const roleName = conflict.satelliteRole ? (conflict.satelliteRole as any).name : 'support staff';
      return {
        conflict: true,
        message: `Worker '${workerName}' is already registered as satellite staff (role: '${roleName}') today.`,
      };
    }

    return { conflict: false, message: '' };
  }

  private async handleStatusTransitionAttendance(
    crew: any,
    oldStatus: CrewStatus,
    newStatus: CrewStatus,
    userId: string
  ) {
    const todayStart = new Date(new Date(crew.workDate).setUTCHours(0, 0, 0, 0));
    const todayEnd = new Date(new Date(crew.workDate).setUTCHours(23, 59, 59, 999));
    const AttendanceModel = (await import('../../models/attendance.model.ts')).default;

    if (newStatus === CrewStatus.ACTIVE && oldStatus !== CrewStatus.ACTIVE) {
      for (const pickerId of crew.assignedPickers) {
        const existing = await AttendanceModel.findOne({
          crew: crew._id,
          worker: pickerId,
          workDate: { $gte: todayStart, $lte: todayEnd },
        });

        if (!existing) {
          await AttendanceModel.create({
            crew: crew._id,
            worker: pickerId,
            workDate: crew.workDate,
            entryTime: new Date(),
            shiftFraction: 1.0,
          });
        }
      }
    }

    if (newStatus === CrewStatus.CLOSED && oldStatus !== CrewStatus.CLOSED) {
      const activeAttendances = await AttendanceModel.find({
        crew: crew._id,
        workDate: { $gte: todayStart, $lte: todayEnd },
        exitTime: null,
      });

      const now = new Date();
      for (const att of activeAttendances) {
        att.exitTime = now;
        const hoursWorked = (now.getTime() - att.entryTime.getTime()) / (1000 * 60 * 60);
        att.shiftFraction = Math.min(1.0, Math.max(0.0, Number((hoursWorked / 8.0).toFixed(2))));
        await att.save();
      }
    }
  }

  async createCrew(payload: CreateCrewBody, userId?: string) {
    const { crewName, assignedPickers, supervisor, leader, workDate, status = CrewStatus.DRAFT } = payload;
    const normalizedStatus = status
      ? (status.toLowerCase() as CrewStatus)
      : CrewStatus.DRAFT;

    const activeCampaign = await Campaign.findOne({ status: CampaignStatus.ACTIVE });
    if (!activeCampaign) {
      return ServiceResponse.failure(CREW_MESSAGES.ACTIVE_CAMPAIGN_REQUIRED, null, httpStatus.BAD_REQUEST);
    }

    if (!assignedPickers || assignedPickers.length === 0) {
      return ServiceResponse.failure(CREW_MESSAGES.INVALID_PICKER, null, httpStatus.BAD_REQUEST);
    }

    const pickerObjectIds = assignedPickers.map((id) => new mongoose.Types.ObjectId(id));
    const activePickersCount = await Worker.countDocuments({
      _id: { $in: pickerObjectIds },
      status: WorkerStatus.ACTIVE,
    });

    if (activePickersCount !== assignedPickers.length) {
      return ServiceResponse.failure(CREW_MESSAGES.INVALID_PICKER, null, httpStatus.BAD_REQUEST);
    }

    let leaderObjectId: mongoose.Types.ObjectId | undefined = undefined;
    if (leader) {
      const activeLeader = await Worker.findOne({
        _id: new mongoose.Types.ObjectId(leader),
        status: WorkerStatus.ACTIVE,
      });
      if (!activeLeader) {
        return ServiceResponse.failure(CREW_MESSAGES.INVALID_LEADER, null, httpStatus.BAD_REQUEST);
      }
      leaderObjectId = activeLeader._id;
    }

    if (!mongoose.Types.ObjectId.isValid(supervisor)) {
      return ServiceResponse.failure(CREW_MESSAGES.INVALID_SUPERVISOR, null, httpStatus.BAD_REQUEST);
    }
    const activeSupervisor = await User.findById(supervisor);
    if (!activeSupervisor) {
      return ServiceResponse.failure(CREW_MESSAGES.INVALID_SUPERVISOR, null, httpStatus.BAD_REQUEST);
    }

    const parsedWorkDate = workDate ? new Date(workDate) : new Date();
    const startOfDay = new Date(new Date(parsedWorkDate).setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(parsedWorkDate).setUTCHours(23, 59, 59, 999));

    const allWorkersToAssign = [
      ...assignedPickers,
      ...(leader ? [leader] : []),
    ];
    const conflictCheck = await this.checkWorkerConflicts(allWorkersToAssign, startOfDay, endOfDay);
    if (conflictCheck.conflict) {
      return ServiceResponse.failure(conflictCheck.message, null, httpStatus.BAD_REQUEST);
    }

    const crewCode = await this.getNextCrewCode();

    const crew = await crewRepository.create({
      campaign: activeCampaign._id,
      workDate: parsedWorkDate,
      crewName,
      crewCode,
      assignedPickers: pickerObjectIds,
      leader: leaderObjectId,
      supervisor: activeSupervisor._id,
      status: normalizedStatus,
    });

    if (normalizedStatus === CrewStatus.ACTIVE) {
      await this.handleStatusTransitionAttendance(crew, CrewStatus.DRAFT, CrewStatus.ACTIVE, userId || String(activeSupervisor._id));
    }

    dashboardEventPublisher.publishCreated(DashboardEntity.CREW, String(crew._id));

    return ServiceResponse.success(CREW_MESSAGES.CREATE_SUCCESS, crew, httpStatus.CREATED);
  }

  async getCrews(filters: CrewListFilters) {
    const query: any = {};

    if (filters.campaign && mongoose.Types.ObjectId.isValid(filters.campaign)) {
      query.campaign = new mongoose.Types.ObjectId(filters.campaign);
    }

    if (filters.supervisor && mongoose.Types.ObjectId.isValid(filters.supervisor)) {
      query.supervisor = new mongoose.Types.ObjectId(filters.supervisor);
    }

    if (filters.status) {
      query.status = filters.status.toLowerCase();
    }

    if (filters.workDate) {
      const date = new Date(filters.workDate);
      const startOfDay = new Date(date.setUTCHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setUTCHours(23, 59, 59, 999));
      query.workDate = { $gte: startOfDay, $lte: endOfDay };
    }

    if (filters.search) {
      const searchRegex = new RegExp(escapeRegExp(filters.search), 'i');
      query.$or = [
        { crewName: searchRegex },
        { crewCode: searchRegex },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [crews, total] = await Promise.all([
      crewRepository.findWithPagination(query, skip, limit),
      crewRepository.count(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return ServiceResponse.success(
      CREW_MESSAGES.FETCH_SUCCESS,
      {
        crews,
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

  async getCrewsBySupervisor(supervisorId: string, filters: Omit<CrewListFilters, 'supervisor'> = {}) {
    if (!mongoose.Types.ObjectId.isValid(supervisorId)) {
      return ServiceResponse.failure('Invalid supervisor ID', null, httpStatus.BAD_REQUEST);
    }

    return this.getCrews({
      ...filters,
      supervisor: supervisorId,
    });
  }

  async getCrewById(crewId: string) {
    if (!mongoose.Types.ObjectId.isValid(crewId)) {
      return ServiceResponse.failure(CREW_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const crew = await crewRepository.findByIdWithDetails(crewId);
    if (!crew) {
      return ServiceResponse.failure(CREW_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    return ServiceResponse.success(CREW_MESSAGES.FETCH_ONE_SUCCESS, crew, httpStatus.OK);
  }

  async updateCrew(crewId: string, payload: UpdateCrewBody, requestingUser?: any) {
    if (!mongoose.Types.ObjectId.isValid(crewId)) {
      return ServiceResponse.failure(CREW_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    if (payload.status) {
      payload.status = (String(payload.status).toLowerCase() as CrewStatus);
    }

    const crew = await crewRepository.findById(crewId);
    if (!crew) {
      return ServiceResponse.failure(CREW_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    if (crew.status === CrewStatus.CLOSED) {
      const isAuthorized = requestingUser?.roles?.some((role: any) =>
        ['Field Engineer', 'System Administrator', 'Operations Director'].includes(role.name)
      );
      if (!isAuthorized) {
        return ServiceResponse.failure(
          'Editing is locked for closed crews unless authorized as a Field Engineer, System Administrator, or Operations Director',
          null,
          httpStatus.FORBIDDEN
        );
      }
    }

    const targetWorkDate = payload.workDate ? new Date(payload.workDate) : crew.workDate;
    const startOfDay = new Date(new Date(targetWorkDate).setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(targetWorkDate).setUTCHours(23, 59, 59, 999));

    const pickersToCheck = payload.assignedPickers ? payload.assignedPickers : crew.assignedPickers.map((id: any) => id.toString());
    const leaderToCheck = payload.leader !== undefined ? (payload.leader || undefined) : (crew.leader ? crew.leader.toString() : undefined);

    const allWorkersToAssign = [
      ...pickersToCheck,
      ...(leaderToCheck ? [leaderToCheck] : []),
    ];

    const conflictCheck = await this.checkWorkerConflicts(allWorkersToAssign, startOfDay, endOfDay, crewId);
    if (conflictCheck.conflict) {
      return ServiceResponse.failure(conflictCheck.message, null, httpStatus.BAD_REQUEST);
    }

    const AttendanceModel = (await import('../../models/attendance.model.ts')).default;
    const todayStart = new Date(new Date(crew.workDate).setUTCHours(0, 0, 0, 0));
    const todayEnd = new Date(new Date(crew.workDate).setUTCHours(23, 59, 59, 999));

    const isCrewActive = crew.status === CrewStatus.ACTIVE || (crew.status as string) === 'active';
    if (isCrewActive && payload.assignedPickers) {
      const oldPickerIds = crew.assignedPickers.map((id: any) => id.toString());
      const newPickerIds = payload.assignedPickers;

      const addedPickers = newPickerIds.filter((id) => !oldPickerIds.includes(id));
      for (const pickerId of addedPickers) {
        const existing = await AttendanceModel.findOne({
          crew: crew._id,
          worker: new mongoose.Types.ObjectId(pickerId),
          workDate: { $gte: todayStart, $lte: todayEnd },
        });
        if (!existing) {
          await AttendanceModel.create({
            crew: crew._id,
            worker: new mongoose.Types.ObjectId(pickerId),
            workDate: crew.workDate,
            entryTime: new Date(),
            shiftFraction: 1.0,
          });
        }
      }

      const removedPickers = oldPickerIds.filter((id: string) => !newPickerIds.includes(id));
      for (const pickerId of removedPickers) {
        const att = await AttendanceModel.findOne({
          crew: crew._id,
          worker: new mongoose.Types.ObjectId(pickerId),
          workDate: { $gte: todayStart, $lte: todayEnd },
          exitTime: null,
        });
        if (att) {
          const now = new Date();
          att.exitTime = now;
          const hoursWorked = (now.getTime() - att.entryTime.getTime()) / (1000 * 60 * 60);
          att.shiftFraction = Math.min(1.0, Math.max(0.0, Number((hoursWorked / 8.0).toFixed(2))));
          await att.save();
        }
      }
    }

    if (payload.assignedPickers) {
      if (payload.assignedPickers.length === 0) {
        return ServiceResponse.failure(CREW_MESSAGES.INVALID_PICKER, null, httpStatus.BAD_REQUEST);
      }
      const pickerObjectIds = payload.assignedPickers.map((id) => new mongoose.Types.ObjectId(id));
      const activePickersCount = await Worker.countDocuments({
        _id: { $in: pickerObjectIds },
        status: WorkerStatus.ACTIVE,
      });

      if (activePickersCount !== payload.assignedPickers.length) {
        return ServiceResponse.failure(CREW_MESSAGES.INVALID_PICKER, null, httpStatus.BAD_REQUEST);
      }
      crew.assignedPickers = pickerObjectIds;
    }

    if (payload.leader) {
      const activeLeader = await Worker.findOne({
        _id: new mongoose.Types.ObjectId(payload.leader),
        status: WorkerStatus.ACTIVE,
      });
      if (!activeLeader) {
        return ServiceResponse.failure(CREW_MESSAGES.INVALID_LEADER, null, httpStatus.BAD_REQUEST);
      }
      crew.leader = activeLeader._id;
    } else if (payload.leader === '') {
      crew.leader = undefined;
    }

    if (payload.supervisor) {
      if (!mongoose.Types.ObjectId.isValid(payload.supervisor)) {
        return ServiceResponse.failure(CREW_MESSAGES.INVALID_SUPERVISOR, null, httpStatus.BAD_REQUEST);
      }
      const activeSupervisor = await User.findById(payload.supervisor);
      if (!activeSupervisor) {
        return ServiceResponse.failure(CREW_MESSAGES.INVALID_SUPERVISOR, null, httpStatus.BAD_REQUEST);
      }
      crew.supervisor = activeSupervisor._id;
    }

    if (payload.crewName !== undefined) crew.crewName = payload.crewName;
    if (payload.workDate !== undefined) crew.workDate = new Date(payload.workDate);

    if (payload.status !== undefined) {
      const normalizedStatus = String(payload.status).toLowerCase() as CrewStatus;
      if (normalizedStatus !== crew.status) {
        const oldStatus = crew.status;
        crew.status = normalizedStatus;
        await this.handleStatusTransitionAttendance(crew, oldStatus, normalizedStatus, requestingUser?.userId || String(crew.supervisor));
      }
    }

    await crew.save();

    dashboardEventPublisher.publishUpdated(DashboardEntity.CREW, String(crew._id));

    const populatedCrew = await Crew.findById(crew._id)
      .populate('campaign', 'campaignName campaignCode')
      .populate('supervisor', 'firstName lastName name email')
      .populate('leader', 'firstName lastName internalCode')
      .populate('assignedPickers', 'firstName lastName internalCode');

    return ServiceResponse.success(CREW_MESSAGES.UPDATE_SUCCESS, populatedCrew || crew, httpStatus.OK);
  }

  async getPreviousDayCrews(supervisorId?: string) {
    const targetDate = new Date();
    const startOfTargetDay = new Date(new Date(targetDate).setUTCHours(0, 0, 0, 0));

    const latestCrew = await Crew.findOne({
      workDate: { $lt: startOfTargetDay },
    }).sort({ workDate: -1 });

    if (!latestCrew) {
      return ServiceResponse.failure('No previous crew assignments found in the system', null, httpStatus.NOT_FOUND);
    }

    const startOfPrevDay = new Date(new Date(latestCrew.workDate).setUTCHours(0, 0, 0, 0));
    const endOfPrevDay = new Date(new Date(latestCrew.workDate).setUTCHours(23, 59, 59, 999));

    const query: any = {
      workDate: { $gte: startOfPrevDay, $lte: endOfPrevDay },
    };

    if (supervisorId && mongoose.Types.ObjectId.isValid(supervisorId)) {
      query.supervisor = new mongoose.Types.ObjectId(supervisorId);
    }

    const crews = await Crew.find(query)
      .populate('campaign', 'campaignName campaignCode')
      .populate('supervisor', 'firstName lastName name email')
      .populate('leader', 'firstName lastName internalCode')
      .populate('assignedPickers', 'firstName lastName internalCode')
      .sort({ createdAt: 1 })
      .exec();

    return ServiceResponse.success('Previous day crews retrieved successfully', {
      previousWorkDate: startOfPrevDay.toISOString().split('T')[0],
      totalCrewsCount: crews.length,
      crews,
    }, httpStatus.OK);
  }

  async copyPreviousCrews(payload: CopyPreviousCrewsBody = {}) {
    const { crewIds } = payload;
    const targetDate = new Date();
    const startOfTargetDay = new Date(new Date(targetDate).setUTCHours(0, 0, 0, 0));
    const endOfTargetDay = new Date(new Date(targetDate).setUTCHours(23, 59, 59, 999));

    let previousCrews: any[] = [];

    if (crewIds && Array.isArray(crewIds) && crewIds.length > 0) {
      const validIds = crewIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
      if (validIds.length === 0) {
        return ServiceResponse.failure('No valid crewIds provided in request body', null, httpStatus.BAD_REQUEST);
      }
      previousCrews = await Crew.find({ _id: { $in: validIds } }).exec();
    } else {
      const latestCrew = await Crew.findOne({
        workDate: { $lt: startOfTargetDay },
      }).sort({ workDate: -1 });

      if (!latestCrew) {
        return ServiceResponse.failure('No previous crew assignments found to copy', null, httpStatus.NOT_FOUND);
      }

      const startOfPrevDay = new Date(new Date(latestCrew.workDate).setUTCHours(0, 0, 0, 0));
      const endOfPrevDay = new Date(new Date(latestCrew.workDate).setUTCHours(23, 59, 59, 999));

      previousCrews = await Crew.find({
        workDate: { $gte: startOfPrevDay, $lte: endOfPrevDay },
      }).exec();
    }

    if (previousCrews.length === 0) {
      return ServiceResponse.failure('No previous crew assignments found to copy', null, httpStatus.NOT_FOUND);
    }

    const activeCampaign = await Campaign.findOne({ status: CampaignStatus.ACTIVE });
    if (!activeCampaign) {
      return ServiceResponse.failure(CREW_MESSAGES.ACTIVE_CAMPAIGN_REQUIRED, null, httpStatus.BAD_REQUEST);
    }

    for (const prevCrew of previousCrews) {
      // Avoid duplicate copy of the same crew for today
      const alreadyCopied = await Crew.findOne({
        workDate: { $gte: startOfTargetDay, $lte: endOfTargetDay },
        crewName: prevCrew.crewName,
        supervisor: prevCrew.supervisor,
      });
      if (alreadyCopied) {
        continue;
      }

      const workerIds = [
        ...prevCrew.assignedPickers.map((id: any) => id.toString()),
        ...(prevCrew.leader ? [prevCrew.leader.toString()] : []),
      ];

      const conflictCheck = await this.checkWorkerConflicts(workerIds, startOfTargetDay, endOfTargetDay);
      if (conflictCheck.conflict) {
        continue;
      }

      const crewCode = await this.getNextCrewCode();

      const newCrew = await crewRepository.create({
        campaign: activeCampaign._id,
        workDate: startOfTargetDay,
        crewName: prevCrew.crewName,
        crewCode,
        assignedPickers: prevCrew.assignedPickers,
        leader: prevCrew.leader,
        supervisor: prevCrew.supervisor,
        status: CrewStatus.DRAFT,
      });

      dashboardEventPublisher.publishCreated(DashboardEntity.CREW, String(newCrew._id));
    }

    const finalTodayCrews = await Crew.find({
      workDate: { $gte: startOfTargetDay, $lte: endOfTargetDay },
    })
      .populate('campaign', 'campaignName campaignCode')
      .populate('supervisor', 'firstName lastName name email')
      .populate('leader', 'firstName lastName internalCode')
      .populate('assignedPickers', 'firstName lastName internalCode')
      .sort({ createdAt: 1 })
      .exec();

    return ServiceResponse.success(
      `Successfully copied/retrieved ${finalTodayCrews.length} crew(s) with all linked workers for today.`,
      finalTodayCrews,
      httpStatus.CREATED
    );
  }

  async toggleCrewStatus(crewId: string, requestingUser?: any) {
    if (!mongoose.Types.ObjectId.isValid(crewId)) {
      return ServiceResponse.failure(CREW_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const crew = await crewRepository.findById(crewId);
    if (!crew) {
      return ServiceResponse.failure(CREW_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    let nextStatus: CrewStatus;
    const currentStatus = String(crew.status).toLowerCase();
    if (currentStatus === CrewStatus.DRAFT) {
      nextStatus = CrewStatus.ACTIVE;
    } else if (currentStatus === CrewStatus.ACTIVE) {
      nextStatus = CrewStatus.CLOSED;
    } else {
      const isAuthorized = requestingUser?.roles?.some((role: any) =>
        ['Field Engineer', 'System Administrator', 'Operations Director'].includes(role.name)
      );
      if (!isAuthorized) {
        return ServiceResponse.failure(
          'Editing is locked for closed crews unless authorized as a Field Engineer, System Administrator, or Operations Director',
          null,
          httpStatus.FORBIDDEN
        );
      }
      nextStatus = CrewStatus.DRAFT;
    }

    return this.updateCrew(crewId, { status: nextStatus }, requestingUser);
  }

  async checkInWorkers(crewId: string, workerIds: string[], entryTime?: Date | string) {
    if (!mongoose.Types.ObjectId.isValid(crewId)) {
      return ServiceResponse.failure(CREW_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }
    const crew = await crewRepository.findById(crewId);
    if (!crew) {
      return ServiceResponse.failure(CREW_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const AttendanceModel = (await import('../../models/attendance.model.ts')).default;
    const resolvedEntryTime = entryTime ? new Date(entryTime) : new Date();
    const todayStart = new Date(new Date(crew.workDate).setUTCHours(0, 0, 0, 0));
    const todayEnd = new Date(new Date(crew.workDate).setUTCHours(23, 59, 59, 999));

    const conflictCheck = await this.checkWorkerConflicts(workerIds, todayStart, todayEnd, crewId);
    if (conflictCheck.conflict) {
      return ServiceResponse.failure(conflictCheck.message, null, httpStatus.BAD_REQUEST);
    }

    const results = [];
    for (const wId of workerIds) {
      if (!mongoose.Types.ObjectId.isValid(wId)) continue;
      const workerObjId = new mongoose.Types.ObjectId(wId);

      const isAssigned = crew.assignedPickers.some((id: any) => id.toString() === wId) || 
                         (crew.leader && crew.leader.toString() === wId);
      if (!isAssigned) continue;

      let att = await AttendanceModel.findOne({
        crew: crew._id,
        worker: workerObjId,
        workDate: { $gte: todayStart, $lte: todayEnd },
      });

      if (!att) {
        att = await AttendanceModel.create({
          crew: crew._id,
          worker: workerObjId,
          workDate: crew.workDate,
          entryTime: resolvedEntryTime,
          shiftFraction: 1.0,
        });
      } else {
        att.entryTime = resolvedEntryTime;
        att.exitTime = undefined;
        att.shiftFraction = 1.0;
        await att.save();
      }
      results.push(att);
    }

    return ServiceResponse.success('Workers checked in successfully', results, httpStatus.OK);
  }

  async checkOutWorkers(crewId: string, workerIds: string[], exitTime?: Date | string) {
    if (!mongoose.Types.ObjectId.isValid(crewId)) {
      return ServiceResponse.failure(CREW_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }
    const crew = await crewRepository.findById(crewId);
    if (!crew) {
      return ServiceResponse.failure(CREW_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const AttendanceModel = (await import('../../models/attendance.model.ts')).default;
    const resolvedExitTime = exitTime ? new Date(exitTime) : new Date();
    const todayStart = new Date(new Date(crew.workDate).setUTCHours(0, 0, 0, 0));
    const todayEnd = new Date(new Date(crew.workDate).setUTCHours(23, 59, 59, 999));

    const results = [];
    for (const wId of workerIds) {
      if (!mongoose.Types.ObjectId.isValid(wId)) continue;
      const workerObjId = new mongoose.Types.ObjectId(wId);

      const att = await AttendanceModel.findOne({
        crew: crew._id,
        worker: workerObjId,
        workDate: { $gte: todayStart, $lte: todayEnd },
      });

      if (att) {
        att.exitTime = resolvedExitTime;
        const hoursWorked = (resolvedExitTime.getTime() - att.entryTime.getTime()) / (1000 * 60 * 60);
        att.shiftFraction = Math.min(1.0, Math.max(0.0, Number((hoursWorked / 8.0).toFixed(2))));
        await att.save();
        results.push(att);
      }
    }

    return ServiceResponse.success('Workers checked out successfully', results, httpStatus.OK);
  }

  async getCrewAttendance(crewId: string) {
    if (!mongoose.Types.ObjectId.isValid(crewId)) {
      return ServiceResponse.failure(CREW_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }
    const AttendanceModel = (await import('../../models/attendance.model.ts')).default;
    const logs = await AttendanceModel.find({ crew: new mongoose.Types.ObjectId(crewId) })
      .populate('worker')
      .sort({ createdAt: 1 });

    return ServiceResponse.success('Crew attendance logs fetched successfully', logs, httpStatus.OK);
  }

  async getUnassignedWorkers(filters: { workDate?: string; search?: string; page?: number; limit?: number }) {
    const date = filters.workDate ? new Date(filters.workDate) : new Date();
    const startOfDay = new Date(new Date(date).setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(date).setUTCHours(23, 59, 59, 999));

    // 1. Get all assigned workers in Crews today
    const crewsToday = await Crew.find({
      workDate: { $gte: startOfDay, $lte: endOfDay },
    });

    const assignedWorkerIdSet = new Set<string>();
    for (const c of crewsToday) {
      for (const picker of c.assignedPickers) {
        assignedWorkerIdSet.add(picker.toString());
      }
      if (c.leader) {
        assignedWorkerIdSet.add(c.leader.toString());
      }
    }

    // 2. Get all workers registered as Satellite Staff today
    const satelliteStaffToday = await SatelliteStaff.find({
      workDate: { $gte: startOfDay, $lte: endOfDay },
    });

    for (const staff of satelliteStaffToday) {
      if (staff.worker) {
        assignedWorkerIdSet.add(staff.worker.toString());
      }
    }

    const assignedWorkerObjectIds = Array.from(assignedWorkerIdSet).map((id) => new mongoose.Types.ObjectId(id));

    // 3. Query active workers who are NOT in assignedWorkerObjectIds
    const query: any = {
      status: WorkerStatus.ACTIVE,
      _id: { $nin: assignedWorkerObjectIds },
    };

    if (filters.search) {
      const searchRegex = new RegExp(escapeRegExp(filters.search), 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { documentIdNumber: searchRegex },
        { qrCode: searchRegex },
      ];
    }

    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, filters.limit || 50);
    const skip = (page - 1) * limit;

    const [workers, total] = await Promise.all([
      Worker.find(query)
        .populate('employmentCompany', 'companyName legalName')
        .sort({ lastName: 1, firstName: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Worker.countDocuments(query),
    ]);

    return ServiceResponse.success(
      'Unassigned workers fetched successfully',
      {
        workers,
        unassignedCount: total,
        workDate: startOfDay.toISOString().split('T')[0],
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      httpStatus.OK
    );
  }

  async validateWorkerCrewActive(workerId: string, date: Date = new Date()): Promise<boolean> {
    const startOfDay = new Date(new Date(date).setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(date).setUTCHours(23, 59, 59, 999));

    const crew = await crewRepository.findOne({
      workDate: { $gte: startOfDay, $lte: endOfDay },
      $or: [
        { assignedPickers: new mongoose.Types.ObjectId(workerId) },
        { leader: new mongoose.Types.ObjectId(workerId) },
      ],
      status: { $in: [CrewStatus.ACTIVE, 'active' as any] } as any,
    });

    return !!crew;
  }
}

export default new CrewService();
export { CREW_MESSAGES };
