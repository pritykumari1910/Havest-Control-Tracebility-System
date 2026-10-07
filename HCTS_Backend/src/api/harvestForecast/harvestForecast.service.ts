import mongoose from 'mongoose';
import httpStatus from 'http-status';
import * as xlsx from 'xlsx';
import {
  Campaign,
  Farm,
  Plot,
  Valve,
  Park,
  Variety,
  HarvestForecast,
  HarvestReceipt,
} from '../../models/index.ts';
import { ForecastStatus } from '../../models/harvestForecast.model.ts';
import { FarmStatus } from '../../models/farm.model.ts';
import { PlotStatus } from '../../models/plot.model.ts';
import { ValveStatus } from '../../models/valve.model.ts';
import { ParkStatus } from '../../models/park.model.ts';
import { VarietyStatus } from '../../models/variety.model.ts';
import ServiceResponse from '../../utils/ServiceResponse.ts';
import harvestForecastRepository from './harvestForecast.repository.ts';
import type { ForecastManualPayload, ForecastListFilters } from './harvestForecast.types.ts';

class HarvestForecastService {
  async validateHierarchy(
    farmId: string,
    plotId: string,
    valveId: string | null | undefined,
    parkId: string | null | undefined,
    varietyId: string
  ): Promise<void> {
    const plot = await Plot.findById(plotId);
    if (!plot) {
      throw new Error('Referenced Plot does not exist');
    }
    if (String(plot.parentFarm) !== String(farmId)) {
      throw new Error(`Plot '${plot.plotName}' does not belong to the selected Farm`);
    }

    if (valveId) {
      const valve = await Valve.findById(valveId);
      if (!valve) {
        throw new Error('Referenced Valve does not exist');
      }
      if (String(valve.parentPlot) !== String(plotId)) {
        throw new Error(`Valve '${valve.valveName}' does not belong to the selected Plot`);
      }
    }

    if (parkId) {
      const park = await Park.findById(parkId);
      if (!park) {
        throw new Error('Referenced Park does not exist');
      }
      if (String(park.parentFarm) !== String(farmId)) {
        throw new Error(`Park '${park.parkName}' parent Farm mismatch`);
      }
      if (String(park.parentPlot) !== String(plotId)) {
        throw new Error(`Park '${park.parkName}' parent Plot mismatch`);
      }
      if (valveId && String(park.parentValve) !== String(valveId)) {
        throw new Error(`Park '${park.parkName}' parent Valve mismatch`);
      }
    }

    const variety = await Variety.findById(varietyId);
    if (!variety) {
      throw new Error('Referenced Variety does not exist');
    }
    const plotVarieties = (plot.avocadoVariety || []).map((v: string) => v.toLowerCase().trim());
    const matchesVariety =
      plotVarieties.includes(variety.varietyName.toLowerCase().trim()) ||
      plotVarieties.includes(variety.varietyCode.toLowerCase().trim());

    if (!matchesVariety) {
      throw new Error(
        `Variety '${variety.varietyName}' is not configured for Plot '${plot.plotName}' (configured varieties are: ${plot.avocadoVariety.join(', ')})`
      );
    }
  }

  async createForecast(userId: string | mongoose.Types.ObjectId, payload: ForecastManualPayload) {
    try {
      await this.validateHierarchy(
        payload.farm,
        payload.plot,
        payload.valve,
        payload.park,
        payload.variety
      );

      const duplicate = await harvestForecastRepository.findOne({
        campaign: payload.campaign,
        farm: payload.farm,
        plot: payload.plot,
        valve: payload.valve || null,
        park: payload.park || null,
        variety: payload.variety,
      });

      if (duplicate) {
        return ServiceResponse.failure(
          'A forecast entry already exists for this Campaign, Farm, Plot, Valve, Park, and Variety combination',
          null,
          httpStatus.BAD_REQUEST
        );
      }

      const forecast = await harvestForecastRepository.create({
        ...payload,
        responsiblePerson: String(userId),
        valve: payload.valve || null,
        park: payload.park || null,
        status: payload.status || ForecastStatus.DRAFT,
        recordDate: payload.recordDate ? new Date(payload.recordDate) : new Date(),
      });

      return ServiceResponse.success('Harvest forecast entered successfully', forecast, httpStatus.CREATED);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }

  async updateForecast(forecastId: string, payload: Partial<ForecastManualPayload>, userId?: string) {
    try {
      const forecast = await harvestForecastRepository.findById(forecastId);
      if (!forecast) {
        return ServiceResponse.failure('Harvest forecast not found', null, httpStatus.NOT_FOUND);
      }

      const farm = payload.farm || String(forecast.farm);
      const plot = payload.plot || String(forecast.plot);
      const valve = payload.valve !== undefined ? payload.valve : forecast.valve;
      const park = payload.park !== undefined ? payload.park : forecast.park;
      const variety = payload.variety || String(forecast.variety);

      await this.validateHierarchy(
        farm,
        plot,
        valve ? String(valve) : null,
        park ? String(park) : null,
        variety
      );

      if (
        payload.campaign ||
        payload.farm ||
        payload.plot ||
        payload.valve !== undefined ||
        payload.park !== undefined ||
        payload.variety
      ) {
        const duplicate = await harvestForecastRepository.findOne({
          _id: { $ne: forecast._id },
          campaign: payload.campaign || forecast.campaign,
          farm,
          plot,
          valve: valve || null,
          park: park || null,
          variety,
        });

        if (duplicate) {
          return ServiceResponse.failure(
            'A duplicate forecast combination already exists',
            null,
            httpStatus.BAD_REQUEST
          );
        }
      }

      Object.assign(forecast, payload);
      if (userId) {
        forecast.responsiblePerson = String(userId);
      }
      if (payload.valve === null) forecast.valve = null;
      if (payload.park === null) forecast.park = null;

      await forecast.save();
      return ServiceResponse.success('Harvest forecast updated successfully', forecast, httpStatus.OK);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }

  async getForecasts(filters: ForecastListFilters) {
    const query: any = {};
    if (filters.campaignId) query.campaign = filters.campaignId;
    if (filters.farmId) query.farm = filters.farmId;
    if (filters.plotId) query.plot = filters.plotId;
    if (filters.varietyId) query.variety = filters.varietyId;
    if (filters.status) query.status = filters.status;

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 10);
    const skip = (page - 1) * limit;

    const [forecasts, total] = await Promise.all([
      harvestForecastRepository.findWithPagination(query, skip, limit),
      harvestForecastRepository.count(query),
    ]);

    const result = {
      forecasts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    return ServiceResponse.success('Forecasts retrieved successfully', result, httpStatus.OK);
  }

  async bulkUploadForecast(
    userId: string | mongoose.Types.ObjectId,
    fileBuffer: Buffer
  ): Promise<ServiceResponse> {
    const errors: string[] = [];
    const createdRecords: any[] = [];
    const seenCombinationKeys = new Set<string>();

    try {
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(sheet) as any[];

      if (rows.length === 0) {
        return ServiceResponse.failure('The uploaded sheet is empty', null, httpStatus.BAD_REQUEST);
      }

      const [campaigns, farms, plots, valves, parks, varieties] = await Promise.all([
        Campaign.find({ deletedAt: null }),
        Farm.find({ status: FarmStatus.ACTIVE }),
        Plot.find({ status: PlotStatus.ACTIVE }),
        Valve.find({ status: ValveStatus.ACTIVE }),
        Park.find({ status: ParkStatus.ACTIVE }),
        Variety.find({ status: VarietyStatus.ACTIVE }),
      ]);

      const campaignMap = new Map(campaigns.map((c) => [c.campaignCode.toLowerCase().trim(), c]));
      const farmMap = new Map(farms.map((f) => [f.internalCode.toLowerCase().trim(), f]));
      const plotMap = new Map(plots.map((p) => [p.plotCode.toLowerCase().trim(), p]));
      const valveMap = new Map(valves.map((v) => [v.valveCode.toLowerCase().trim(), v]));
      const parkMap = new Map(parks.map((p) => [p.parkCode.toLowerCase().trim(), p]));
      const varietyMap = new Map(varieties.map((v) => [v.varietyCode.toLowerCase().trim(), v]));

      for (let idx = 0; idx < rows.length; idx++) {
        const rawRow = rows[idx];
        const rowNum = idx + 2;

        const row: Record<string, any> = {};
        for (const [key, val] of Object.entries(rawRow)) {
          const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
          row[normKey] = val;
        }

        const campaignCode = String(row.campaigncode || row.campaign || '').trim().toLowerCase();
        const farmCode = String(row.farmcode || row.farm || '').trim().toLowerCase();
        const plotCode = String(row.plotcode || row.plot || '').trim().toLowerCase();
        const valveCode = String(row.valvecode || row.valve || '').trim().toLowerCase();
        const parkCode = String(row.parkcode || row.park || '').trim().toLowerCase();
        const varietyCode = String(row.varietycode || row.variety || '').trim().toLowerCase();
        const surfaceArea = Number(row.surfacearea || row.surfaceareaha || row.area || 0);
        const estimatedKg = Number(row.estimatedkg || row.estkg || row.kg || 0);
        const responsiblePerson = String(row.responsibleperson || row.responsible || row.person || '').trim();
        const comments = row.comments ? String(row.comments).trim() : '';
        const statusVal = String(row.status || 'draft').trim().toLowerCase() as ForecastStatus;

        if (!campaignCode) errors.push(`Row ${rowNum}: Campaign Code is required.`);
        if (!farmCode) errors.push(`Row ${rowNum}: Farm Code is required.`);
        if (!plotCode) errors.push(`Row ${rowNum}: Plot Code is required.`);
        if (!varietyCode) errors.push(`Row ${rowNum}: Variety Code is required.`);
        if (isNaN(surfaceArea) || surfaceArea <= 0) errors.push(`Row ${rowNum}: Surface Area must be greater than 0.`);
        if (isNaN(estimatedKg) || estimatedKg < 0) errors.push(`Row ${rowNum}: Estimated Kg must be a non-negative number.`);
        if (!responsiblePerson) errors.push(`Row ${rowNum}: Responsible Person is required.`);

        const campaignDoc = campaignMap.get(campaignCode);
        const farmDoc = farmMap.get(farmCode);
        const plotDoc = plotMap.get(plotCode);
        const varietyDoc = varietyMap.get(varietyCode);

        if (campaignCode && !campaignDoc) errors.push(`Row ${rowNum}: Campaign '${campaignCode}' not found.`);
        if (farmCode && !farmDoc) errors.push(`Row ${rowNum}: Farm '${farmCode}' not found.`);
        if (plotCode && !plotDoc) errors.push(`Row ${rowNum}: Plot '${plotCode}' not found.`);
        if (varietyCode && !varietyDoc) errors.push(`Row ${rowNum}: Variety '${varietyCode}' not found.`);

        const valveDoc = valveCode ? valveMap.get(valveCode) : null;
        if (valveCode && !valveDoc) errors.push(`Row ${rowNum}: Valve '${valveCode}' not found.`);

        const parkDoc = parkCode ? parkMap.get(parkCode) : null;
        if (parkCode && !parkDoc) errors.push(`Row ${rowNum}: Park '${parkCode}' not found.`);

        if (!campaignDoc || !farmDoc || !plotDoc || !varietyDoc || (valveCode && !valveDoc) || (parkCode && !parkDoc)) {
          continue;
        }

        try {
          await this.validateHierarchy(
            String(farmDoc._id),
            String(plotDoc._id),
            valveDoc ? String(valveDoc._id) : null,
            parkDoc ? String(parkDoc._id) : null,
            String(varietyDoc._id)
          );
        } catch (hierarchyErr: any) {
          errors.push(`Row ${rowNum}: ${hierarchyErr.message}`);
          continue;
        }

        const combinationKey = `${campaignDoc._id}_${farmDoc._id}_${plotDoc._id}_${valveDoc ? valveDoc._id : 'null'}_${parkDoc ? parkDoc._id : 'null'}_${varietyDoc._id}`;
        if (seenCombinationKeys.has(combinationKey)) {
          errors.push(`Row ${rowNum}: Duplicate campaign/farm/plot/valve/park/variety combination within the file.`);
          continue;
        }
        seenCombinationKeys.add(combinationKey);

        const dbDuplicate = await HarvestForecast.findOne({
          campaign: campaignDoc._id,
          farm: farmDoc._id,
          plot: plotDoc._id,
          valve: valveDoc ? valveDoc._id : null,
          park: parkDoc ? parkDoc._id : null,
          variety: varietyDoc._id,
        });
        if (dbDuplicate) {
          errors.push(`Row ${rowNum}: A forecast already exists in the database for this exact combination.`);
          continue;
        }

        createdRecords.push({
          campaign: campaignDoc._id,
          farm: farmDoc._id,
          plot: plotDoc._id,
          valve: valveDoc ? valveDoc._id : null,
          park: parkDoc ? parkDoc._id : null,
          variety: varietyDoc._id,
          surfaceArea,
          estimatedKg,
          recordDate: new Date(),
          responsiblePerson,
          status: statusVal,
          comments,
        });
      }

      if (errors.length > 0) {
        return ServiceResponse.failure('Validation errors found in template', { errors }, httpStatus.BAD_REQUEST);
      }

      await HarvestForecast.insertMany(createdRecords);
      return ServiceResponse.success(
        `Successfully uploaded ${createdRecords.length} harvest forecasts.`,
        createdRecords,
        httpStatus.CREATED
      );
    } catch (excelErr: any) {
      return ServiceResponse.failure(`Excel parse error: ${excelErr.message}`, null, httpStatus.BAD_REQUEST);
    }
  }

  async getProgressDashboard(filters: { campaignId?: string }) {
    const matchStage: any = {};
    if (filters.campaignId && mongoose.Types.ObjectId.isValid(filters.campaignId)) {
      matchStage.campaign = new mongoose.Types.ObjectId(filters.campaignId);
    }

    const forecastAggregation = await HarvestForecast.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            campaign: '$campaign',
            farm: '$farm',
            plot: '$plot',
            variety: '$variety',
          },
          forecastKg: { $sum: '$estimatedKg' },
        },
      },
    ]);

    const receiptsAggregation = await HarvestReceipt.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            campaign: '$campaign',
            farm: '$farm',
            plot: '$plot',
            variety: '$variety',
          },
          actualKg: { $sum: '$harvestedKg' },
        },
      },
    ]);

    const dashboardMap = new Map<string, any>();

    const getOrInitKey = (cId: string, fId: string, pId: string, vId: string) => {
      const key = `${cId}_${fId}_${pId}_${vId}`;
      if (!dashboardMap.has(key)) {
        dashboardMap.set(key, {
          campaignId: cId,
          farmId: fId,
          plotId: pId,
          varietyId: vId,
          forecastKg: 0,
          actualKg: 0,
        });
      }
      return dashboardMap.get(key);
    };

    forecastAggregation.forEach((f) => {
      const entry = getOrInitKey(
        String(f._id.campaign),
        String(f._id.farm),
        String(f._id.plot),
        String(f._id.variety)
      );
      entry.forecastKg = f.forecastKg;
    });

    receiptsAggregation.forEach((r) => {
      const entry = getOrInitKey(
        String(r._id.campaign),
        String(r._id.farm),
        String(r._id.plot),
        String(r._id.variety)
      );
      entry.actualKg = r.actualKg;
    });

    const dashboardItems = Array.from(dashboardMap.values());
    const populatedItems = [];

    for (const item of dashboardItems) {
      const [campaign, farm, plot, variety] = await Promise.all([
        Campaign.findById(item.campaignId).select('campaignName campaignCode'),
        Farm.findById(item.farmId).select('farmName farmCode'),
        Plot.findById(item.plotId).select('plotName plotCode'),
        Variety.findById(item.varietyId).select('varietyName varietyCode'),
      ]);

      const percentage = item.forecastKg > 0 ? (item.actualKg / item.forecastKg) * 100 : 0;

      populatedItems.push({
        campaign: campaign || { campaignName: 'Unknown', campaignCode: '' },
        farm: farm || { farmName: 'Unknown', farmCode: '' },
        plot: plot || { plotName: 'Unknown', plotCode: '' },
        variety: variety || { varietyName: 'Unknown', varietyCode: '' },
        forecastKg: item.forecastKg,
        actualKg: item.actualKg,
        progressPercentage: Number(percentage.toFixed(2)),
      });
    }

    return ServiceResponse.success('Forecast vs Actual progress analytics fetched', populatedItems, httpStatus.OK);
  }

  async seedMockReceipts(payload: {
    campaign: string;
    farm: string;
    plot: string;
    valve?: string | null;
    park?: string | null;
    variety: string;
    harvestedKg: number;
  }) {
    const receipt = await HarvestReceipt.create({
      campaign: new mongoose.Types.ObjectId(payload.campaign),
      farm: new mongoose.Types.ObjectId(payload.farm),
      plot: new mongoose.Types.ObjectId(payload.plot),
      valve: payload.valve ? new mongoose.Types.ObjectId(payload.valve) : null,
      park: payload.park ? new mongoose.Types.ObjectId(payload.park) : null,
      variety: new mongoose.Types.ObjectId(payload.variety),
      harvestedKg: payload.harvestedKg,
      weighingDate: new Date(),
    });
    return ServiceResponse.success('Mock harvested weight logged successfully', receipt, httpStatus.CREATED);
  }
}

export default new HarvestForecastService();
