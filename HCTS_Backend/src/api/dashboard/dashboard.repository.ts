import mongoose from 'mongoose';
import {
  Campaign,
  Crew,
  DispatchNote,
  Farm,
  HarvestAssignment,
  HarvestReceiptScan,
  QrInventory,
  QrSeries,
  SatelliteStaff,
  Variety,
  Worker,
  SystemConfig,
  TransferOrder,
  HarvestForecast,
} from '../../models/index.ts';
import { FarmStatus } from '../../models/farm.model.ts';
import { QrSeriesStatus } from '../../models/qrSeries.model.ts';
import { QrInventoryStatus } from '../../models/qrInventory.model.ts';
import { CrewStatus } from '../../models/crew.model.ts';
import { HarvestAssignmentStatus } from '../../models/harvestAssignment.model.ts';
import { CampaignStatus } from '../../models/campaign.model.ts';
import { DispatchNoteStatus } from '../../models/dispatchNote.model.ts';
import type {
  SystemAdministratorDashboardSummary,
  FarmManagerDashboardSummary,
  FarmManagerCrewItem,
  OperationsDirectorDashboardSummary,
} from './dashboard.types.ts';

class DashboardRepository {
  async getSystemAdministratorSummary(): Promise<SystemAdministratorDashboardSummary> {
    const [
      activeFarmsCount,
      workersCount,
      varietiesCount,
      campaignsCount,
      crewsCount,
      palletBinsCount,
      dispatchNotesCount,
      qrSeriesResult,
    ] = await Promise.all([
      Farm.countDocuments({ status: FarmStatus.ACTIVE }),
      Worker.countDocuments(),
      Variety.countDocuments(),
      Campaign.countDocuments(),
      Crew.countDocuments(),
      QrInventory.countDocuments({ status: QrInventoryStatus.ASSIGNED }),
      DispatchNote.countDocuments(),
      QrSeries.aggregate<{ total: number }>([
        {
          $match: {
            status: {
              $nin: [
                QrSeriesStatus.CANCELLED,
                'Canceled',
                'cancelled',
                'canceled',
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $ifNull: [
                  '$totalQRs',
                  {
                    $add: [
                      { $subtract: ['$endNumber', '$startNumber'] },
                      1,
                    ],
                  },
                ],
              },
            },
          },
        },
      ]),
    ]);

    return {
      activeFarmsCount,
      workersCount,
      varietiesCount,
      campaignsCount,
      crewsCount,
      palletBinsCount,
      dispatchNotesCount,
      qrSeriesCount: qrSeriesResult[0]?.total || 0,
    };
  }

  async getFarmManagerSummary(date?: string | Date): Promise<FarmManagerDashboardSummary> {
    /*
    // OLD CODE - Overall counts (Commented out as requested)
    // 1. Fetch all active crews
    const activeCrews = await Crew.find({
      status: CrewStatus.ACTIVE,
    }).exec();

    const activeCrewsCount = activeCrews.length;

    // Calculate total pickers across active crews
    let pickersCount = 0;
    const crewIds = activeCrews.map((crew) => crew._id);

    activeCrews.forEach((crew) => {
      pickersCount += crew.assignedPickers ? crew.assignedPickers.length : 0;
      if (crew.leader) pickersCount += 1;
    });

    // 2. Count total pallets received
    const palletsReceivedCount = await HarvestReceiptScan.countDocuments();

    // 3. Count open / active harvest assignments
    const openAssignmentsCount = await HarvestAssignment.countDocuments({
      status: HarvestAssignmentStatus.ACTIVE,
    });

    // 4. Count total registered satellite staff
    const satelliteStaffRegisteredTodayCount = await SatelliteStaff.countDocuments();

    // 5. Build yourCrews breakdown list for active crews
    const assignmentsPerCrew = await HarvestAssignment.aggregate<{ _id: any; count: number }>([
      {
        $match: {
          crew: { $in: crewIds },
          status: HarvestAssignmentStatus.ACTIVE,
        },
      },
      {
        $group: {
          _id: '$crew',
          count: { $sum: 1 },
        },
      },
    ]);

    const assignmentCountMap = new Map<string, number>();
    assignmentsPerCrew.forEach((item) => {
      if (item._id) {
        assignmentCountMap.set(item._id.toString(), item.count);
      }
    });

    const yourCrews: FarmManagerCrewItem[] = activeCrews.map((crew) => {
      const crewPickers = (crew.assignedPickers ? crew.assignedPickers.length : 0) + (crew.leader ? 1 : 0);
      const crewAssignments = assignmentCountMap.get(crew._id.toString()) || 0;

      return {
        id: crew._id.toString(),
        crewCode: crew.crewCode,
        crewName: crew.crewName,
        status: crew.status,
        pickersCount: crewPickers,
        assignmentsCount: crewAssignments,
      };
    });
    */

    // NEW CODE - Filtered strictly by Current Date (Today / Selected Date)
    const targetDate = date ? new Date(date) : new Date();
    const startOfDate = new Date(new Date(targetDate).setUTCHours(0, 0, 0, 0));
    const endOfDate = new Date(new Date(targetDate).setUTCHours(23, 59, 59, 999));
    const dateRangeQuery = { $gte: startOfDate, $lte: endOfDate };

    // 1. Fetch crews for the date
    const dateCrews = await Crew.find({
      workDate: dateRangeQuery,
    }).exec();

    const activeCrewsCount = dateCrews.length;

    // Calculate total pickers across crews for the date
    let pickersCount = 0;
    const crewIds = dateCrews.map((crew) => crew._id);

    dateCrews.forEach((crew) => {
      pickersCount += crew.assignedPickers ? crew.assignedPickers.length : 0;
      if (crew.leader) pickersCount += 1;
    });

    // 2. Count total pallets received on the date
    const palletsReceivedCount = await HarvestReceiptScan.countDocuments({
      $or: [{ scannedAt: dateRangeQuery }, { createdAt: dateRangeQuery }],
    });

    // 3. Count open / active harvest assignments for the date
    const openAssignmentsCount = await HarvestAssignment.countDocuments({
      workDate: dateRangeQuery,
    });

    // 4. Count total registered satellite staff for the date
    const satelliteStaffRegisteredTodayCount = await SatelliteStaff.countDocuments({
      $or: [{ workDate: dateRangeQuery }, { createdAt: dateRangeQuery }],
    });

    // 5. Build yourCrews breakdown list for crews on the date
    const assignmentsPerCrew = await HarvestAssignment.aggregate<{ _id: any; count: number }>([
      {
        $match: {
          crew: { $in: crewIds },
        },
      },
      {
        $group: {
          _id: '$crew',
          count: { $sum: 1 },
        },
      },
    ]);

    const assignmentCountMap = new Map<string, number>();
    assignmentsPerCrew.forEach((item) => {
      if (item._id) {
        assignmentCountMap.set(item._id.toString(), item.count);
      }
    });

    const yourCrews: FarmManagerCrewItem[] = dateCrews.map((crew) => {
      const crewPickers = (crew.assignedPickers ? crew.assignedPickers.length : 0) + (crew.leader ? 1 : 0);
      const crewAssignments = assignmentCountMap.get(crew._id.toString()) || 0;

      return {
        id: crew._id.toString(),
        crewCode: crew.crewCode,
        crewName: crew.crewName,
        status: crew.status,
        pickersCount: crewPickers,
        assignmentsCount: crewAssignments,
      };
    });

    return {
      activeCrewsCount,
      pickersCount,
      palletsReceivedCount,
      openAssignmentsCount,
      yourCrews,
      satelliteStaffRegisteredTodayCount,
    };
  }

  async getOperationsDirectorSummary(date?: string | Date): Promise<OperationsDirectorDashboardSummary> {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDate = new Date(new Date(targetDate).setUTCHours(0, 0, 0, 0));
    const endOfDate = new Date(new Date(targetDate).setUTCHours(23, 59, 59, 999));
    const dateRangeQuery = { $gte: startOfDate, $lte: endOfDate };

    // Standard Bin Weight (default 300 kg = 0.3t)
    let standardBinWeightKg = 300;
    try {
      const config = await SystemConfig.findOne({ key: 'STANDARD_BIN_WEIGHT_KG' });
      if (config && typeof config.value === 'number' && config.value > 0) {
        standardBinWeightKg = config.value;
      }
    } catch {
      // fallback
    }

    const [
      activeCampaign,
      scansTodayCount,
      allScansCount,
      forecastDocs,
      activeFarmsCount,
      dateCrews,
      satStaffCount,
      openBatchesCount,
      openDispatchCount,
      completedDispatchTotal,
      completedDispatchToday,
      vehiclesWaitingCount,
      incidentsCount,
    ] = await Promise.all([
      Campaign.findOne({ status: CampaignStatus.ACTIVE }).lean(),
      HarvestReceiptScan.countDocuments({
        $or: [{ scannedAt: dateRangeQuery }, { createdAt: dateRangeQuery }],
      }),
      HarvestReceiptScan.countDocuments(),
      HarvestForecast.find().lean(),
      Farm.countDocuments({ status: FarmStatus.ACTIVE }),
      Crew.find({ workDate: dateRangeQuery }).exec(),
      SatelliteStaff.countDocuments({
        $or: [{ workDate: dateRangeQuery }, { createdAt: dateRangeQuery }],
      }),
      mongoose.models.ReceptionBatch ? mongoose.models.ReceptionBatch.countDocuments({ status: 'open' }) : Promise.resolve(0),
      DispatchNote.countDocuments({ status: { $in: [DispatchNoteStatus.DRAFT, DispatchNoteStatus.CLOSED, DispatchNoteStatus.ASSOCIATED_TO_LOAD_ORDER] as any } }),
      DispatchNote.countDocuments({ status: { $in: [DispatchNoteStatus.DISPATCHED, DispatchNoteStatus.RECONCILED] as any } }),
      DispatchNote.countDocuments({
        status: { $in: [DispatchNoteStatus.DISPATCHED, DispatchNoteStatus.RECONCILED] as any },
        updatedAt: dateRangeQuery,
      }),
      TransferOrder.countDocuments({ status: { $in: ['draft', 'open', 'loaded'] } as any }),
      mongoose.models.UnassignedBinQueue ? mongoose.models.UnassignedBinQueue.countDocuments({ status: 'pending' }) : Promise.resolve(0),
    ]);

    // 1. Current Campaign
    const currentCampaign = activeCampaign
      ? {
          id: String(activeCampaign._id),
          campaignName: activeCampaign.campaignName,
          campaignCode: activeCampaign.campaignCode,
          status: activeCampaign.status,
        }
      : null;

    // 2. Today's Harvest
    const todaysHarvestWeightKg = scansTodayCount * standardBinWeightKg;

    // 3. Actual & Estimated Production
    const totalActualTonnes = Number(((allScansCount * standardBinWeightKg) / 1000).toFixed(1));
    const approvedForecastTonnes = forecastDocs.reduce((acc: number, f: any) => acc + (Number(f.forecastedTonnes) || Number(f.quantityTonnes) || 0), 0);
    const forecastTonnesRound = Number(approvedForecastTonnes.toFixed(1));
    const forecastAchPercentage = forecastTonnesRound > 0 ? Number(((totalActualTonnes / forecastTonnesRound) * 100).toFixed(1)) : 0;

    // 4. Active Crews & Pickers
    const activeCrewsCount = dateCrews.length;
    let activePickersCount = 0;
    dateCrews.forEach((crew: any) => {
      activePickersCount += crew.assignedPickers ? crew.assignedPickers.length : 0;
      if (crew.leader) activePickersCount += 1;
    });

    // 5. Satellite Ratio
    const ratioVal = activePickersCount > 0 ? (activePickersCount / Math.max(1, satStaffCount)).toFixed(1) : '0';
    const satelliteRatioString = `1:${ratioVal}`;

    return {
      currentCampaign,
      todaysHarvest: {
        weightKg: todaysHarvestWeightKg,
        binsToday: scansTodayCount,
      },
      forecastAchievement: {
        actualTonnes: totalActualTonnes,
        forecastTonnes: forecastTonnesRound,
        percentage: forecastAchPercentage,
      },
      actualProduction: {
        totalTonnes: totalActualTonnes,
        totalBinsCount: allScansCount,
      },
      estimatedProduction: {
        approvedForecastTonnes: forecastTonnesRound,
      },
      totalFarms: {
        activeFarmsCount,
      },
      activeCrews: {
        activeCrewsCount,
      },
      activePickers: {
        activePickersCount,
      },
      satelliteStaff: {
        todaysShiftCount: satStaffCount,
      },
      satelliteRatio: {
        ratioString: satelliteRatioString,
        supportPickersCount: activePickersCount,
      },
      collectionPoints: {
        openBatchesCount,
      },
      openDispatchNotes: {
        activeLoadOrdersCount: openDispatchCount,
      },
      completedDispatches: {
        totalCompleted: completedDispatchTotal,
        completedToday: completedDispatchToday,
      },
      vehiclesWaiting: {
        awaitingLoadCount: vehiclesWaitingCount,
      },
      operationalIncidents: {
        palletIncidentsLoggedCount: incidentsCount,
      },
    };
  }
}

export default new DashboardRepository();
