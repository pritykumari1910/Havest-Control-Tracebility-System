import mongoose from 'mongoose';
import {
  HarvestReceiptScan,
  HarvestForecast,
  SystemConfig,
  TransferOrder,
  DispatchNote,
} from '../../models/index.ts';
import type {
  HarvestProgressFilters,
  ForecastVsActualFilters,
  HarvestReceiptScanReportFilters,
  TransferOrderReportFilters,
  DispatchNoteReportFilters,
  DispatchNoteReportItem,
} from './reports.types.ts';

class ReportsRepository {
  private async getStandardBinWeightKg(): Promise<number> {
    try {
      const config = await SystemConfig.findOne({ key: 'STANDARD_BIN_WEIGHT_KG' });
      if (config && typeof config.value === 'number' && config.value > 0) {
        return config.value;
      }
    } catch {
      // fallback
    }
    return 400; // default 400 kg
  }

  async getHarvestProgressData(filters: HarvestProgressFilters) {
    const {
      startDate,
      endDate,
      farmId,
      plotId,
      varietyId,
      crewId,
      supervisorId,
      groupBy = 'assignment',
      page = 1,
      limit = 100,
    } = filters;

    const matchQuery: any = {};

    if (startDate || endDate) {
      matchQuery.scannedAt = {};
      if (startDate) {
        matchQuery.scannedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        matchQuery.scannedAt.$lte = end;
      }
    }

    if (farmId && mongoose.Types.ObjectId.isValid(farmId)) {
      matchQuery.farm = new mongoose.Types.ObjectId(farmId);
    }
    if (plotId && mongoose.Types.ObjectId.isValid(plotId)) {
      matchQuery.plot = new mongoose.Types.ObjectId(plotId);
    }
    if (varietyId && mongoose.Types.ObjectId.isValid(varietyId)) {
      matchQuery.variety = new mongoose.Types.ObjectId(varietyId);
    }
    if (crewId && mongoose.Types.ObjectId.isValid(crewId)) {
      matchQuery.crew = new mongoose.Types.ObjectId(crewId);
    }

    // Determine group key for MongoDB aggregation
    let groupKey = '$harvestAssignment';
    if (groupBy === 'crew') groupKey = '$crew';
    else if (groupBy === 'variety') groupKey = '$variety';
    else if (groupBy === 'farm') groupKey = '$farm';
    else if (groupBy === 'plot') groupKey = '$plot';
    else if (groupBy === 'valve') groupKey = '$valve';
    else if (groupBy === 'campaign') groupKey = '$campaign';

    const stdWeight = await this.getStandardBinWeightKg();

    const pipeline: any[] = [
      { $match: matchQuery },
      {
        $group: {
          _id: groupKey,
          totalBinsScanned: { $sum: 1 },
          farm: { $first: '$farm' },
          plot: { $first: '$plot' },
          variety: { $first: '$variety' },
          crew: { $first: '$crew' },
          campaign: { $first: '$campaign' },
          harvestAssignment: { $first: '$harvestAssignment' },
        },
      },
      {
        $lookup: {
          from: 'farms',
          localField: 'farm',
          foreignField: '_id',
          as: 'farmDoc',
        },
      },
      {
        $lookup: {
          from: 'plots',
          localField: 'plot',
          foreignField: '_id',
          as: 'plotDoc',
        },
      },
      {
        $lookup: {
          from: 'varieties',
          localField: 'variety',
          foreignField: '_id',
          as: 'varietyDoc',
        },
      },
      {
        $lookup: {
          from: 'crews',
          localField: 'crew',
          foreignField: '_id',
          as: 'crewDoc',
        },
      },
      {
        $lookup: {
          from: 'campaigns',
          localField: 'campaign',
          foreignField: '_id',
          as: 'campaignDoc',
        },
      },
      {
        $lookup: {
          from: 'harvestassignments',
          localField: 'harvestAssignment',
          foreignField: '_id',
          as: 'assignmentDoc',
        },
      },
      {
        $unwind: { path: '$farmDoc', preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: '$plotDoc', preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: '$varietyDoc', preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: '$crewDoc', preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: '$campaignDoc', preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: '$assignmentDoc', preserveNullAndEmptyArrays: true },
      },
    ];

    if (supervisorId && mongoose.Types.ObjectId.isValid(supervisorId)) {
      pipeline.push({
        $match: {
          'crewDoc.supervisor': new mongoose.Types.ObjectId(supervisorId),
        },
      });
    }

    const aggregated = await HarvestReceiptScan.aggregate(pipeline).exec();

    const overallTotalBins = aggregated.reduce((acc, curr) => acc + curr.totalBinsScanned, 0);

    const formattedData = aggregated.map((item) => {
      const totalHarvestedKg = item.totalBinsScanned * stdWeight;
      const percentageOfTotal =
        overallTotalBins > 0
          ? Number(((item.totalBinsScanned / overallTotalBins) * 100).toFixed(2))
          : 0;

      let groupName = item._id ? item._id.toString() : 'N/A';
      let groupCode = '';

      if (groupBy === 'farm' && item.farmDoc) {
        groupName = item.farmDoc.farmName;
        groupCode = item.farmDoc.internalCode || '';
      } else if (groupBy === 'plot' && item.plotDoc) {
        groupName = item.plotDoc.plotName;
        groupCode = item.plotDoc.plotCode || '';
      } else if (groupBy === 'variety' && item.varietyDoc) {
        groupName = item.varietyDoc.varietyName;
        groupCode = item.varietyDoc.varietyCode || '';
      } else if (groupBy === 'crew' && item.crewDoc) {
        groupName = item.crewDoc.crewName;
        groupCode = item.crewDoc.crewCode || '';
      } else if (groupBy === 'campaign' && item.campaignDoc) {
        groupName = item.campaignDoc.campaignName;
        groupCode = item.campaignDoc.campaignCode || '';
      } else if (groupBy === 'assignment' && item.assignmentDoc) {
        groupName = `Assignment ${item.assignmentDoc._id}`;
      }

      return {
        groupId: item._id ? item._id.toString() : '',
        groupName,
        groupCode,
        campaignName: item.campaignDoc?.campaignName || '',
        farmName: item.farmDoc?.farmName || '',
        plotName: item.plotDoc?.plotName || '',
        varietyName: item.varietyDoc?.varietyName || '',
        crewName: item.crewDoc?.crewName || '',
        totalBinsScanned: item.totalBinsScanned,
        standardBinWeightKg: stdWeight,
        totalHarvestedKg,
        percentageOfTotal,
      };
    });

    const totalRecords = formattedData.length;
    const skip = (page - 1) * limit;
    const paginatedData = formattedData.slice(skip, skip + limit);
    const totalHarvestedKgSum = overallTotalBins * stdWeight;

    return {
      items: paginatedData,
      summary: {
        totalBinsScanned: overallTotalBins,
        standardBinWeightKg: stdWeight,
        totalHarvestedKg: totalHarvestedKgSum,
        totalHarvestedTonnes: Number((totalHarvestedKgSum / 1000).toFixed(2)),
      },
      pagination: {
        total: totalRecords,
        page,
        limit,
        totalPages: Math.ceil(totalRecords / limit) || 1,
      },
    };
  }

  async getForecastVsActualData(filters: ForecastVsActualFilters) {
    const { startDate, endDate, farmId, plotId, period = 'daily' } = filters;

    const dateQuery: any = {};
    if (startDate || endDate) {
      if (startDate) dateQuery.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        dateQuery.$lte = end;
      }
    } else {
      const now = new Date();
      const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      dateQuery.$gte = startOfMonth;
    }

    const forecastMatch: any = { recordDate: dateQuery };
    const scanMatch: any = { scannedAt: dateQuery };

    if (farmId && mongoose.Types.ObjectId.isValid(farmId)) {
      const farmObjId = new mongoose.Types.ObjectId(farmId);
      forecastMatch.farm = farmObjId;
      scanMatch.farm = farmObjId;
    }
    if (plotId && mongoose.Types.ObjectId.isValid(plotId)) {
      const plotObjId = new mongoose.Types.ObjectId(plotId);
      forecastMatch.plot = plotObjId;
      scanMatch.plot = plotObjId;
    }

    const stdWeight = await this.getStandardBinWeightKg();

    const [forecasts, scans] = await Promise.all([
      HarvestForecast.find(forecastMatch)
        .populate('farm', 'farmName')
        .populate('plot', 'plotName')
        .exec(),
      HarvestReceiptScan.find(scanMatch)
        .populate('farm', 'farmName')
        .populate('plot', 'plotName')
        .exec(),
    ]);

    const formatPeriodKey = (date: Date) => {
      const d = new Date(date);
      if (period === 'monthly') {
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      }
      if (period === 'weekly') {
        const startOfYear = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNum = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getUTCDay() + 1) / 7);
        return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      }
      return d.toISOString().split('T')[0];
    };

    const map = new Map<string, { periodLabel: string; farmName: string; plotName: string; forecastedKg: number; actualBins: number }>();

    for (const f of forecasts) {
      const key = `${formatPeriodKey(f.recordDate)}_${f.farm ? (f.farm as any).farmName : ''}_${f.plot ? (f.plot as any).plotName : ''}`;
      if (!map.has(key)) {
        map.set(key, {
          periodLabel: formatPeriodKey(f.recordDate),
          farmName: f.farm ? (f.farm as any).farmName : 'All Farms',
          plotName: f.plot ? (f.plot as any).plotName : 'All Plots',
          forecastedKg: 0,
          actualBins: 0,
        });
      }
      const entry = map.get(key)!;
      entry.forecastedKg += f.estimatedKg || 0;
    }

    for (const s of scans) {
      const key = `${formatPeriodKey(s.scannedAt)}_${s.farm ? (s.farm as any).farmName : ''}_${s.plot ? (s.plot as any).plotName : ''}`;
      if (!map.has(key)) {
        map.set(key, {
          periodLabel: formatPeriodKey(s.scannedAt),
          farmName: s.farm ? (s.farm as any).farmName : 'All Farms',
          plotName: s.plot ? (s.plot as any).plotName : 'All Plots',
          forecastedKg: 0,
          actualBins: 0,
        });
      }
      const entry = map.get(key)!;
      entry.actualBins += 1;
    }

    const items = Array.from(map.values()).map((entry) => {
      const actualHarvestedKg = entry.actualBins * stdWeight;
      const varianceKg = actualHarvestedKg - entry.forecastedKg;
      const fulfillmentPercentage =
        entry.forecastedKg > 0
          ? Number(((actualHarvestedKg / entry.forecastedKg) * 100).toFixed(2))
          : 0;

      return {
        periodLabel: entry.periodLabel,
        farmName: entry.farmName,
        plotName: entry.plotName,
        forecastedKg: entry.forecastedKg,
        actualHarvestedKg,
        varianceKg,
        fulfillmentPercentage,
      };
    });

    items.sort((a, b) => a.periodLabel.localeCompare(b.periodLabel));

    return {
      period,
      standardBinWeightKg: stdWeight,
      comparison: items,
    };
  }

  async getHarvestReceiptScanReportData(filters: HarvestReceiptScanReportFilters) {
    const {
      qrCode,
      crewId,
      machineId,
      varietyId,
      farmId,
      date,
      startDate,
      endDate,
      dispatchNoteStatus,
      page = 1,
      limit = 100,
    } = filters;

    const matchQuery: any = {};

    if (qrCode) {
      matchQuery.qrCode = { $regex: qrCode, $options: 'i' };
    }

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setUTCHours(23, 59, 59, 999);
      matchQuery.scannedAt = { $gte: start, $lte: end };
    } else if (startDate || endDate) {
      matchQuery.scannedAt = {};
      if (startDate) {
        matchQuery.scannedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        matchQuery.scannedAt.$lte = end;
      }
    }

    const postLookupMatch: any = {};

    if (crewId && mongoose.Types.ObjectId.isValid(crewId)) {
      postLookupMatch['assignmentDoc.crew'] = new mongoose.Types.ObjectId(crewId);
    }
    if (machineId && mongoose.Types.ObjectId.isValid(machineId)) {
      postLookupMatch['receptionBatchDoc.machine'] = new mongoose.Types.ObjectId(machineId);
    }
    if (varietyId && mongoose.Types.ObjectId.isValid(varietyId)) {
      postLookupMatch['assignmentDoc.variety'] = new mongoose.Types.ObjectId(varietyId);
    }
    if (farmId && mongoose.Types.ObjectId.isValid(farmId)) {
      postLookupMatch['assignmentDoc.farm'] = new mongoose.Types.ObjectId(farmId);
    }
    if (dispatchNoteStatus) {
      postLookupMatch['dispatchNoteDocs.status'] = dispatchNoteStatus;
    }

    const pipeline: any[] = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'receptionbatches',
          localField: 'receptionBatch',
          foreignField: '_id',
          as: 'receptionBatchDoc',
        },
      },
      { $unwind: { path: '$receptionBatchDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'harvestassignments',
          localField: 'harvestAssignment',
          foreignField: '_id',
          as: 'assignmentDoc',
        },
      },
      { $unwind: { path: '$assignmentDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'qrinventories',
          localField: 'qrInventory',
          foreignField: '_id',
          as: 'qrInventoryDoc',
        },
      },
      { $unwind: { path: '$qrInventoryDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'machines',
          localField: 'receptionBatchDoc.machine',
          foreignField: '_id',
          as: 'machineDoc',
        },
      },
      { $unwind: { path: '$machineDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'machineoperators',
          localField: 'receptionBatchDoc.operator',
          foreignField: '_id',
          as: 'machineOperatorDoc',
        },
      },
      { $unwind: { path: '$machineOperatorDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'workers',
          localField: 'machineOperatorDoc.worker',
          foreignField: '_id',
          as: 'operatorWorkerDoc',
        },
      },
      { $unwind: { path: '$operatorWorkerDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'crews',
          localField: 'assignmentDoc.crew',
          foreignField: '_id',
          as: 'crewDoc',
        },
      },
      { $unwind: { path: '$crewDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'farms',
          localField: 'assignmentDoc.farm',
          foreignField: '_id',
          as: 'farmDoc',
        },
      },
      { $unwind: { path: '$farmDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'plots',
          localField: 'assignmentDoc.plot',
          foreignField: '_id',
          as: 'plotDoc',
        },
      },
      { $unwind: { path: '$plotDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'valves',
          localField: 'assignmentDoc.valve',
          foreignField: '_id',
          as: 'valveDoc',
        },
      },
      { $unwind: { path: '$valveDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'varieties',
          localField: 'assignmentDoc.variety',
          foreignField: '_id',
          as: 'varietyDoc',
        },
      },
      { $unwind: { path: '$varietyDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'dispatchnotes',
          localField: 'assignmentDoc.campaign',
          foreignField: 'campaign',
          as: 'dispatchNoteDocs',
        },
      },
    ];

    if (Object.keys(postLookupMatch).length > 0) {
      pipeline.push({ $match: postLookupMatch });
    }

    pipeline.push(
      { $sort: { scannedAt: -1, _id: -1 } },
      {
        $facet: {
          items: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                timestamp: '$scannedAt',
                qrCode: { $ifNull: ['$qrInventoryDoc.qrCode', '$qrCode'] },
                qrInventory: {
                  _id: '$qrInventoryDoc._id',
                  qrCode: '$qrInventoryDoc.qrCode',
                  qrNumber: '$qrInventoryDoc.qrNumber',
                  series: '$qrInventoryDoc.series',
                  status: '$qrInventoryDoc.status',
                },
                machine: {
                  _id: '$machineDoc._id',
                  name: '$machineDoc.name',
                  internalCode: '$machineDoc.internalCode',
                  machineType: '$machineDoc.machineType',
                  licensePlateOrInternalId: '$machineDoc.licensePlateOrInternalId',
                },
                machineOperator: {
                  _id: '$machineOperatorDoc._id',
                  worker: '$machineOperatorDoc.worker',
                  firstName: '$operatorWorkerDoc.firstName',
                  lastName: '$operatorWorkerDoc.lastName',
                  documentIdNumber: '$operatorWorkerDoc.documentIdNumber',
                },
                crew: {
                  _id: '$crewDoc._id',
                  crewName: '$crewDoc.crewName',
                  crewCode: '$crewDoc.crewCode',
                  status: '$crewDoc.status',
                },
                farm: {
                  _id: '$farmDoc._id',
                  farmName: '$farmDoc.farmName',
                  internalCode: '$farmDoc.internalCode',
                },
                plot: {
                  _id: '$plotDoc._id',
                  plotName: '$plotDoc.plotName',
                  plotCode: '$plotDoc.plotCode',
                },
                valve: {
                  _id: '$valveDoc._id',
                  valveName: '$valveDoc.valveName',
                  valveCode: '$valveDoc.valveCode',
                },
                zoneType: '$assignmentDoc.zoneType',
                variety: {
                  _id: '$varietyDoc._id',
                  varietyName: '$varietyDoc.varietyName',
                  varietyCode: '$varietyDoc.varietyCode',
                  varietyType: '$varietyDoc.varietyType',
                },
                reception: {
                  _id: '$receptionBatchDoc._id',
                  batchCode: '$receptionBatchDoc.batchCode',
                  workDate: '$receptionBatchDoc.workDate',
                  status: '$receptionBatchDoc.status',
                },
                harvestAssignment: {
                  _id: '$assignmentDoc._id',
                  campaign: '$assignmentDoc.campaign',
                  workDate: '$assignmentDoc.workDate',
                  qrSeries: '$assignmentDoc.qrSeries',
                  startQrNumber: '$assignmentDoc.startQrNumber',
                  endQrNumber: '$assignmentDoc.endQrNumber',
                  status: '$assignmentDoc.status',
                },
                dispatchNotes: {
                  $map: {
                    input: '$dispatchNoteDocs',
                    as: 'note',
                    in: {
                      _id: '$$note._id',
                      internalNoteNumber: '$$note.internalNoteNumber',
                      dispatchCode: '$$note.dispatchCode',
                      noteDate: '$$note.noteDate',
                      status: '$$note.status',
                      buyer: '$$note.buyer',
                      destination: '$$note.destination',
                      isAssociatedWithBuyerDeliveryNote: '$$note.isAssociatedWithBuyerDeliveryNote',
                    },
                  },
                },
              },
            },
          ],
          total: [{ $count: 'count' }],
        },
      }
    );

    const [result] = await HarvestReceiptScan.aggregate(pipeline).exec();
    const total = result?.total?.[0]?.count || 0;

    return {
      items: result?.items || [],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getTransferOrderReportData(filters: TransferOrderReportFilters) {
    const {
      date,
      startDate,
      endDate,
      buyerId,
      destinationId,
      status,
      transportProviderId,
      page = 1,
      limit = 100,
    } = filters;

    const matchQuery: any = {};

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setUTCHours(23, 59, 59, 999);
      matchQuery.createdAt = { $gte: start, $lte: end };
    } else if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) {
        matchQuery.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        matchQuery.createdAt.$lte = end;
      }
    }

    if (buyerId && mongoose.Types.ObjectId.isValid(buyerId)) {
      matchQuery.buyer = new mongoose.Types.ObjectId(buyerId);
    }
    if (destinationId && mongoose.Types.ObjectId.isValid(destinationId)) {
      matchQuery.destination = new mongoose.Types.ObjectId(destinationId);
    }
    if (transportProviderId && mongoose.Types.ObjectId.isValid(transportProviderId)) {
      matchQuery.transportProvider = new mongoose.Types.ObjectId(transportProviderId);
    }
    if (status) {
      matchQuery.status = status;
    }

    const closedOrBeyondStatuses = [
      'closed',
      'associated_to_load_order',
      'dispatched',
      'pending_buyer_note',
      'reconciled',
    ];

    const pipeline: any[] = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'buyers',
          localField: 'buyer',
          foreignField: '_id',
          as: 'buyerDoc',
        },
      },
      { $unwind: { path: '$buyerDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'destinationcenters',
          localField: 'destination',
          foreignField: '_id',
          as: 'destinationDoc',
        },
      },
      { $unwind: { path: '$destinationDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'transportproviders',
          localField: 'transportProvider',
          foreignField: '_id',
          as: 'transportProviderDoc',
        },
      },
      { $unwind: { path: '$transportProviderDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'dispatchnotes',
          localField: 'dispatchNotes',
          foreignField: '_id',
          as: 'dispatchNoteDocs',
        },
      },
      { $sort: { createdAt: -1, _id: -1 } },
      {
        $facet: {
          items: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $addFields: {
                dispatchNoteSummaries: {
                  $map: {
                    input: '$dispatchNoteDocs',
                    as: 'note',
                    in: {
                      _id: '$$note._id',
                      internalNoteNumber: '$$note.internalNoteNumber',
                      dispatchCode: '$$note.dispatchCode',
                      status: '$$note.status',
                      binCount: { $size: { $ifNull: ['$$note.bins', []] } },
                      editedAfterClosure: {
                        $and: [
                          { $in: ['$$note.status', closedOrBeyondStatuses] },
                          { $gt: [{ $size: { $ifNull: ['$$note.editAuditTrail', []] } }, 0] },
                        ],
                      },
                      editCount: { $size: { $ifNull: ['$$note.editAuditTrail', []] } },
                      noteDate: '$$note.noteDate',
                    },
                  },
                },
              },
            },
            {
              $project: {
                _id: 1,
                transferCode: 1,
                status: 1,
                timestamp: '$createdAt',
                createdAt: 1,
                updatedAt: 1,
                buyer: {
                  _id: '$buyerDoc._id',
                  name: '$buyerDoc.name',
                  internalCode: '$buyerDoc.internalCode',
                  status: '$buyerDoc.status',
                  contactDetails: '$buyerDoc.contactDetails',
                },
                destination: {
                  _id: '$destinationDoc._id',
                  name: '$destinationDoc.name',
                  internalCode: '$destinationDoc.internalCode',
                  status: '$destinationDoc.status',
                  contactDetails: '$destinationDoc.contactDetails',
                },
                transportProvider: {
                  _id: '$transportProviderDoc._id',
                  legalName: '$transportProviderDoc.legalName',
                  status: '$transportProviderDoc.status',
                  contactDetails: '$transportProviderDoc.contactDetails',
                },
                dispatchNotes: '$dispatchNoteSummaries',
                dispatchNoteCount: { $size: { $ifNull: ['$dispatchNoteDocs', []] } },
                totalBinCount: {
                  $sum: {
                    $map: {
                      input: '$dispatchNoteDocs',
                      as: 'note',
                      in: { $size: { $ifNull: ['$$note.bins', []] } },
                    },
                  },
                },
                hasDispatchNotesEditedAfterClosure: {
                  $anyElementTrue: {
                    $map: {
                      input: '$dispatchNoteSummaries',
                      as: 'note',
                      in: '$$note.editedAfterClosure',
                    },
                  },
                },
              },
            },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ];

    const [result] = await TransferOrder.aggregate(pipeline).exec();
    const total = result?.total?.[0]?.count || 0;

    return {
      items: result?.items || [],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getDispatchNoteReportData(filters: DispatchNoteReportFilters) {
    const {
      date,
      startDate,
      endDate,
      buyerId,
      destinationId,
      campaignId,
      transportProviderId,
      status,
      search,
      page = 1,
      limit = 10,
    } = filters;

    const matchStage: any = {};

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setUTCHours(23, 59, 59, 999);
      matchStage.noteDate = { $gte: start, $lte: end };
    } else if (startDate || endDate) {
      matchStage.noteDate = {};
      if (startDate) matchStage.noteDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        matchStage.noteDate.$lte = end;
      }
    }

    if (buyerId && mongoose.Types.ObjectId.isValid(buyerId)) {
      matchStage.buyer = new mongoose.Types.ObjectId(buyerId);
    }
    if (destinationId && mongoose.Types.ObjectId.isValid(destinationId)) {
      matchStage.destination = new mongoose.Types.ObjectId(destinationId);
    }
    if (campaignId && mongoose.Types.ObjectId.isValid(campaignId)) {
      matchStage.campaign = new mongoose.Types.ObjectId(campaignId);
    }
    if (status) {
      matchStage.status = status;
    }
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      matchStage.$or = [
        { internalNoteNumber: searchRegex },
        { dispatchCode: searchRegex },
      ];
    }

    const pipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'transferorders',
          localField: '_id',
          foreignField: 'dispatchNotes',
          as: 'transferOrderDocs',
        },
      },
      {
        $lookup: {
          from: 'transportproviders',
          localField: 'transferOrderDocs.transportProvider',
          foreignField: '_id',
          as: 'transportProviderDocs',
        },
      },
    ];

    if (transportProviderId && mongoose.Types.ObjectId.isValid(transportProviderId)) {
      pipeline.push({
        $match: {
          'transportProviderDocs._id': new mongoose.Types.ObjectId(transportProviderId),
        },
      });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'buyers',
          localField: 'buyer',
          foreignField: '_id',
          as: 'buyerDocs',
        },
      },
      {
        $lookup: {
          from: 'destinationcenters',
          localField: 'destination',
          foreignField: '_id',
          as: 'destinationDocs',
        },
      },
      {
        $lookup: {
          from: 'campaigns',
          localField: 'campaign',
          foreignField: '_id',
          as: 'campaignDocs',
        },
      }
    );

    const skip = (page - 1) * limit;

    const facetPipeline: any[] = [
      ...pipeline,
      {
        $facet: {
          items: [
            { $sort: { noteDate: -1, createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
          ],
          allNotes: [
            {
              $project: {
                status: 1,
                bins: 1,
                totalEstimatedWeightKg: 1,
              },
            },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ];

    const [facetResult] = await DispatchNote.aggregate(facetPipeline).exec();
    const itemsRaw = facetResult?.items || [];
    const allNotes = facetResult?.allNotes || [];
    const totalCount = facetResult?.totalCount?.[0]?.count || 0;

    let totalPalletBins = 0;
    let totalEstimatedWeightKg = 0;
    const statusCounts: Record<string, number> = {
      draft: 0,
      closed: 0,
      associated_to_load_order: 0,
      dispatched: 0,
      pending_buyer_note: 0,
      reconciled: 0,
    };

    allNotes.forEach((note: any) => {
      const bins = Array.isArray(note.bins) ? note.bins.length : 0;
      const weight = Number(note.totalEstimatedWeightKg) || 0;
      totalPalletBins += bins;
      totalEstimatedWeightKg += weight;
      const st = String(note.status || 'draft').toLowerCase();
      statusCounts[st] = (statusCounts[st] || 0) + 1;
    });

    const items: DispatchNoteReportItem[] = itemsRaw.map((note: any) => {
      const binsCount = Array.isArray(note.bins) ? note.bins.length : 0;
      const editAuditTrail = Array.isArray(note.editAuditTrail) ? note.editAuditTrail : [];
      const buyerDoc = note.buyerDocs?.[0];
      const destDoc = note.destinationDocs?.[0];
      const tpDoc = note.transportProviderDocs?.[0];
      const campDoc = note.campaignDocs?.[0];

      return {
        id: String(note._id),
        noteNumber: note.internalNoteNumber || note.dispatchCode || `DN-${String(note._id).slice(-6).toUpperCase()}`,
        noteDate: note.noteDate || note.createdAt,
        status: note.status || 'draft',
        buyerName: buyerDoc?.name || 'N/A',
        buyerCode: buyerDoc?.internalCode || 'N/A',
        destinationName: destDoc?.name || 'N/A',
        destinationCode: destDoc?.internalCode || 'N/A',
        transportProviderName: tpDoc?.legalName || 'N/A',
        transportProviderId: tpDoc?._id ? String(tpDoc._id) : undefined,
        campaignName: campDoc?.campaignName || 'N/A',
        binsCount,
        estimatedTotalWeightKg: note.totalEstimatedWeightKg || 0,
        isAssociatedWithBuyerDeliveryNote: !!note.isAssociatedWithBuyerDeliveryNote,
        isEditedAfterClosure: editAuditTrail.length > 0,
        editCount: editAuditTrail.length,
        createdAt: note.createdAt,
      };
    });

    return {
      kpis: {
        totalDispatchNotes: totalCount,
        totalPalletBins,
        totalEstimatedWeightKg,
        statusCounts,
      },
      items,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }
}

export default new ReportsRepository();
