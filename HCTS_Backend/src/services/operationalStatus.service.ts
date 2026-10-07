import mongoose from 'mongoose';
import httpStatus from 'http-status';
import {
  Crew,
  Attendance,
  QrInventory,
  SystemConfig,
  HarvestAssignment,
  UnassignedBinQueue,
} from '../models/index.ts';
import { CrewStatus } from '../models/crew.model.ts';
import { QrInventoryStatus } from '../models/qrInventory.model.ts';
import { UnassignedBinStatus } from '../models/unassignedBinQueue.model.ts';
import ServiceResponse from '../utils/ServiceResponse.ts';

class OperationalStatusService {
  async getOperationalStatus(dateString?: string) {
    try {
      const targetDate = dateString ? new Date(dateString) : new Date();
      const start = new Date(targetDate);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(targetDate);
      end.setUTCHours(23, 59, 59, 999);

      // 1. Fetch active crews on that day
      const activeCrews = await Crew.find({
        workDate: { $gte: start, $lte: end },
        status: CrewStatus.ACTIVE,
      });

      const totalActiveCrews = activeCrews.length;

      // 2. Count active pickers (assigned)
      let totalAssignedPickers = 0;
      activeCrews.forEach((crew) => {
        totalAssignedPickers += crew.assignedPickers.length;
        if (crew.leader) totalAssignedPickers += 1;
      });

      // 3. Count checked-in attendances
      const checkedInAttendanceCount = await Attendance.countDocuments({
        workDate: { $gte: start, $lte: end },
        entryTime: { $ne: null },
      });

      // 4. Fetch standard bin weight config
      const binWeightConfig = await SystemConfig.findOne({ key: 'standard_bin_weight_kg' });
      const standardWeight = binWeightConfig ? Number(binWeightConfig.value) : 400;

      // 5. Count scanned bins
      const scannedQrs = await QrInventory.find({
        updatedAt: { $gte: start, $lte: end },
        status: {
          $in: [
            QrInventoryStatus.SCANNED_AT_COLLECTION,
            QrInventoryStatus.USED,
            QrInventoryStatus.ASSIGNED_TO_DISPATCH,
            QrInventoryStatus.DISPATCHED,
          ],
        },
      });

      // 6. Count pending unassigned bins for today (mobile alert indicator)
      const pendingUnassignedCount = await UnassignedBinQueue.countDocuments({
        status: UnassignedBinStatus.PENDING,
        scannedAt: { $gte: start, $lte: end },
      });

      const totalScannedBins = scannedQrs.length;
      const totalEstimatedWeightKg = totalScannedBins * standardWeight;

      // 6. Get variety & plot progress from assignments active today
      const assignments = await HarvestAssignment.find({
        workDate: { $gte: start, $lte: end },
      })
        .populate('variety', 'varietyName varietyCode')
        .populate('plot', 'plotName plotCode');

      const assignmentMap = new Map(assignments.map((a) => [a._id.toString(), a]));

      // Aggregate variety distributions
      const varietyStats: Record<string, { varietyName: string; varietyCode: string; binCount: number; estimatedWeightKg: number }> = {};
      const plotStats: Record<string, { plotName: string; plotCode: string; binCount: number; estimatedWeightKg: number }> = {};

      for (const qr of scannedQrs) {
        if (qr.harvestAssignmentId) {
          const assoc = assignmentMap.get(qr.harvestAssignmentId);
          if (assoc) {
            // Variety Stats
            const varId = assoc.variety ? (assoc.variety as any)._id.toString() : 'unknown';
            if (!varietyStats[varId]) {
              varietyStats[varId] = {
                varietyName: assoc.variety ? (assoc.variety as any).varietyName : 'Unknown',
                varietyCode: assoc.variety ? (assoc.variety as any).varietyCode : 'N/A',
                binCount: 0,
                estimatedWeightKg: 0,
              };
            }
            varietyStats[varId].binCount += 1;
            varietyStats[varId].estimatedWeightKg += standardWeight;

            // Plot Stats
            const plotId = assoc.plot ? (assoc.plot as any)._id.toString() : 'unknown';
            if (!plotStats[plotId]) {
              plotStats[plotId] = {
                plotName: assoc.plot ? (assoc.plot as any).plotName : 'Unknown',
                plotCode: assoc.plot ? (assoc.plot as any).plotCode : 'N/A',
                binCount: 0,
                estimatedWeightKg: 0,
              };
            }
            plotStats[plotId].binCount += 1;
            plotStats[plotId].estimatedWeightKg += standardWeight;
          }
        }
      }

      return ServiceResponse.success('Operational status retrieved successfully', {
        date: start.toISOString().split('T')[0],
        crews: {
          activeCrewsCount: totalActiveCrews,
          assignedPickersCount: totalAssignedPickers,
          checkedInPickersCount: checkedInAttendanceCount,
        },
        harvest: {
          totalScannedBins,
          standardBinWeightKg: standardWeight,
          totalEstimatedWeightKg,
        },
        varietyDistribution: Object.values(varietyStats),
        plotProgress: Object.values(plotStats),
        unassignedQueue: {
          pendingCount: pendingUnassignedCount,
          hasUnresolved: pendingUnassignedCount > 0,
        },
      }, httpStatus.OK);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }
}

export default new OperationalStatusService();
