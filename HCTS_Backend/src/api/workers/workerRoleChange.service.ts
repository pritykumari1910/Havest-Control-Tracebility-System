import mongoose from 'mongoose';
import httpStatus from 'http-status';
import {
  Attendance,
  SatelliteStaff,
  Crew,
  SatelliteRole,
  Campaign,
  Worker,
  Farm,
  Plot,
  Valve,
} from '../../models/index.ts';
import { CampaignStatus } from '../../models/campaign.model.ts';
import { WorkerStatus } from '../../models/worker.model.ts';
import { FarmStatus } from '../../models/farm.model.ts';
import { PlotStatus } from '../../models/plot.model.ts';
import { ValveStatus } from '../../models/valve.model.ts';
import ServiceResponse from '../../utils/ServiceResponse.ts';
import type { RoleChangePayload } from './workerRoleChange.types.ts';

class WorkerRoleChangeService {
  async processRoleChange(workerId: string, payload: RoleChangePayload, registeredByUserId: string) {
    try {
      const activeCampaign = await Campaign.findOne({ status: CampaignStatus.ACTIVE });
      if (!activeCampaign) {
        return ServiceResponse.failure('Active campaign is required for role changes', null, httpStatus.BAD_REQUEST);
      }

      if (!mongoose.Types.ObjectId.isValid(workerId)) {
        return ServiceResponse.failure('Invalid workerId', null, httpStatus.BAD_REQUEST);
      }
      const workerDoc = await Worker.findOne({ _id: workerId, status: WorkerStatus.ACTIVE });
      if (!workerDoc) {
        return ServiceResponse.failure('Active worker not found', null, httpStatus.BAD_REQUEST);
      }

      const parsedWorkDate = new Date(payload.workDate);
      const start = new Date(new Date(parsedWorkDate).setUTCHours(0, 0, 0, 0));
      const end = new Date(new Date(parsedWorkDate).setUTCHours(23, 59, 59, 999));

      const changeTime = payload.changeTime ? new Date(payload.changeTime) : new Date();

      let exitedShiftFraction = 0.5;

      if (payload.exitContext === 'crew') {
        if (!mongoose.Types.ObjectId.isValid(payload.exitEntityId)) {
          return ServiceResponse.failure('Invalid exit crew ID', null, httpStatus.BAD_REQUEST);
        }
        const attendance = await Attendance.findOne({
          crew: payload.exitEntityId,
          worker: workerId,
          workDate: { $gte: start, $lte: end },
        });

        if (!attendance) {
          return ServiceResponse.failure('Crew attendance record not found for today', null, httpStatus.BAD_REQUEST);
        }

        attendance.exitTime = changeTime;
        const entryTime = attendance.entryTime || start;
        const durationMs = changeTime.getTime() - entryTime.getTime();
        const fraction = Math.min(1.0, Math.max(0.0, durationMs / (8 * 60 * 60 * 1000)));
        attendance.shiftFraction = Number(fraction.toFixed(2));
        await attendance.save();

        exitedShiftFraction = attendance.shiftFraction;
      } else if (payload.exitContext === 'satellite') {
        if (!mongoose.Types.ObjectId.isValid(payload.exitEntityId)) {
          return ServiceResponse.failure('Invalid exit satellite staff ID', null, httpStatus.BAD_REQUEST);
        }
        const staff = await SatelliteStaff.findById(payload.exitEntityId);
        if (!staff) {
          return ServiceResponse.failure('Satellite staff registration record not found', null, httpStatus.BAD_REQUEST);
        }

        staff.shiftType = 'partial';
        const entryTime = staff.workDate || start;
        const durationMs = changeTime.getTime() - entryTime.getTime();
        const fraction = Math.min(1.0, Math.max(0.0, durationMs / (8 * 60 * 60 * 1000)));
        staff.shiftFraction = Number(fraction.toFixed(2));
        staff.partialReason = `${staff.partialReason || ''} | Role change exit: ${payload.reason}`.trim();
        await staff.save();

        exitedShiftFraction = staff.shiftFraction;
      }

      const remainingShiftFraction = Number(Math.max(0.0, 1.0 - exitedShiftFraction).toFixed(2));

      if (payload.entryContext === 'crew') {
        if (!mongoose.Types.ObjectId.isValid(payload.entryEntityId)) {
          return ServiceResponse.failure('Invalid entry crew ID', null, httpStatus.BAD_REQUEST);
        }
        const crewDoc = await Crew.findById(payload.entryEntityId);
        if (!crewDoc) {
          return ServiceResponse.failure('Entry crew not found', null, httpStatus.BAD_REQUEST);
        }

        const attendance = await Attendance.create({
          crew: crewDoc._id,
          worker: workerId,
          workDate: changeTime,
          entryTime: changeTime,
          shiftFraction: remainingShiftFraction,
        });

        return ServiceResponse.success('Worker transitioned to Crew successfully', {
          exitedShiftFraction,
          enteredShiftFraction: remainingShiftFraction,
          attendance,
        }, httpStatus.CREATED);
      } else if (payload.entryContext === 'satellite') {
        if (!mongoose.Types.ObjectId.isValid(payload.entryEntityId)) {
          return ServiceResponse.failure('Invalid entry satellite role ID', null, httpStatus.BAD_REQUEST);
        }
        const roleDoc = await SatelliteRole.findOne({ _id: payload.entryEntityId, isActive: true });
        if (!roleDoc) {
          return ServiceResponse.failure('Active entry satellite role not found', null, httpStatus.BAD_REQUEST);
        }

        if (!payload.farmId || !mongoose.Types.ObjectId.isValid(payload.farmId)) {
          return ServiceResponse.failure('Valid farmId is required when entering satellite role', null, httpStatus.BAD_REQUEST);
        }
        const farmDoc = await Farm.findOne({ _id: payload.farmId, status: FarmStatus.ACTIVE });
        if (!farmDoc) {
          return ServiceResponse.failure('Active entry farm not found', null, httpStatus.BAD_REQUEST);
        }

        let plotObjectId: mongoose.Types.ObjectId | null = null;
        if (payload.plotId) {
          if (!mongoose.Types.ObjectId.isValid(payload.plotId)) {
            return ServiceResponse.failure('Invalid plotId', null, httpStatus.BAD_REQUEST);
          }
          const plotDoc = await Plot.findOne({ _id: payload.plotId, parentFarm: payload.farmId, status: PlotStatus.ACTIVE });
          if (!plotDoc) {
            return ServiceResponse.failure('Active entry plot not found under the selected farm', null, httpStatus.BAD_REQUEST);
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
            return ServiceResponse.failure('Active entry valve not found under the selected plot', null, httpStatus.BAD_REQUEST);
          }
          valveObjectId = valveDoc._id as mongoose.Types.ObjectId;
        }

        const staff = await SatelliteStaff.create({
          campaign: activeCampaign._id,
          workDate: changeTime,
          worker: workerId,
          employmentCompany: workerDoc.employmentCompany,
          satelliteRole: roleDoc._id,
          farm: farmDoc._id,
          plot: plotObjectId,
          valve: valveObjectId,
          workZone: payload.workZone || '',
          shiftType: 'partial',
          shiftFraction: remainingShiftFraction,
          partialReason: `Entered via mid-day role change: ${payload.reason}`,
          registeredBy: new mongoose.Types.ObjectId(registeredByUserId),
        });

        return ServiceResponse.success('Worker transitioned to Satellite Role successfully', {
          exitedShiftFraction,
          enteredShiftFraction: remainingShiftFraction,
          staff,
        }, httpStatus.CREATED);
      }

      return ServiceResponse.failure('Invalid entry context', null, httpStatus.BAD_REQUEST);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }
}

export default new WorkerRoleChangeService();
export { RoleChangePayload };
