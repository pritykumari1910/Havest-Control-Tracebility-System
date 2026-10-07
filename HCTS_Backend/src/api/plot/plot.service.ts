import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { PlotStatus } from '../../models/plot.model.ts';
import Farm from '../../models/farm.model.ts';
import Valve, { ValveStatus } from '../../models/valve.model.ts';
import Park, { ParkStatus } from '../../models/park.model.ts';
import Variety, { VarietyStatus } from '../../models/variety.model.ts';
import ServiceResponse from '../../utils/ServiceResponse.ts';
import { aggregateAreaForFarm } from '../../services/areaAggregation.service.ts';
import plotRepository from './plot.repository.ts';
import type { CreatePlotBody, PlotListFilters, UpdatePlotBody } from './plot.types.ts';

const PLOT_MESSAGES = {
  CREATE_SUCCESS: 'Plot created successfully',
  FETCH_SUCCESS: 'Plots fetched successfully',
  FETCH_ONE_SUCCESS: 'Plot fetched successfully',
  UPDATE_SUCCESS: 'Plot updated successfully',
  NOT_FOUND: 'Plot not found',
  FARM_NOT_FOUND: 'Parent farm not found',
  DUPLICATE_NAME: 'Plot name must be unique within this farm',
  INVALID_VARIETY: 'Invalid or inactive avocado variety name',
} as const;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class PlotService {
  private async getNextPlotCode(): Promise<string> {
    const plots = await plotRepository.getAllPlots();
    let maxNum = 0;
    for (const plot of plots) {
      const match = plot.plotCode.match(/^PLOT(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
    const nextNum = maxNum + 1;
    return `PLOT${nextNum.toString().padStart(3, '0')}`;
  }

  private async validateAndResolveVarieties(varietyNames: string[]): Promise<string[] | null> {
    if (!Array.isArray(varietyNames) || varietyNames.length === 0) {
      return null;
    }
    const resolvedNames: string[] = [];
    for (const name of varietyNames) {
      const query: any = { status: VarietyStatus.ACTIVE };
      if (mongoose.Types.ObjectId.isValid(name)) {
        query._id = new mongoose.Types.ObjectId(name);
      } else {
        query.$or = [
          { varietyName: new RegExp(`^${escapeRegExp(name)}$`, 'i') },
          { varietyCode: new RegExp(`^${escapeRegExp(name)}$`, 'i') },
        ];
      }
      const v = await Variety.findOne(query);
      if (!v) return null;
      resolvedNames.push(v.varietyName);
    }
    return resolvedNames;
  }

  async createPlot(payload: CreatePlotBody) {
    const { parentFarm, plotName, totalArea, avocadoVariety, status = PlotStatus.ACTIVE, comments = '' } = payload;

    if (!mongoose.Types.ObjectId.isValid(parentFarm)) {
      return ServiceResponse.failure(PLOT_MESSAGES.FARM_NOT_FOUND, null, httpStatus.BAD_REQUEST);
    }

    const farm = await Farm.findById(parentFarm);
    if (!farm) {
      return ServiceResponse.failure(PLOT_MESSAGES.FARM_NOT_FOUND, null, httpStatus.BAD_REQUEST);
    }

    const resolvedVarieties = await this.validateAndResolveVarieties(avocadoVariety);
    if (!resolvedVarieties) {
      return ServiceResponse.failure(PLOT_MESSAGES.INVALID_VARIETY, null, httpStatus.BAD_REQUEST);
    }

    const nameExists = await plotRepository.findByNameAndFarm(parentFarm, plotName);
    if (nameExists) {
      return ServiceResponse.failure(PLOT_MESSAGES.DUPLICATE_NAME, null, httpStatus.BAD_REQUEST);
    }

    const plotCode = await this.getNextPlotCode();

    const plot = await plotRepository.create({
      parentFarm: new mongoose.Types.ObjectId(parentFarm),
      plotName,
      plotCode,
      totalArea,
      avocadoVariety: resolvedVarieties,
      status,
      comments,
    });

    await aggregateAreaForFarm(farm._id);

    return ServiceResponse.success(PLOT_MESSAGES.CREATE_SUCCESS, plot, httpStatus.CREATED);
  }

  async getPlots(filters: PlotListFilters) {
    const query: any = {};

    if (filters.parentFarm) {
      if (mongoose.Types.ObjectId.isValid(filters.parentFarm)) {
        query.parentFarm = new mongoose.Types.ObjectId(filters.parentFarm);
      }
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.search) {
      const searchRegex = new RegExp(escapeRegExp(filters.search), 'i');
      query.$or = [
        { plotName: searchRegex },
        { plotCode: searchRegex },
      ];
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 10);
    const skip = (page - 1) * limit;

    const [plots, total] = await Promise.all([
      plotRepository.findWithPagination(query, skip, limit),
      plotRepository.count(query),
    ]);

    const result = {
      plots,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    return ServiceResponse.success(PLOT_MESSAGES.FETCH_SUCCESS, result, httpStatus.OK);
  }

  async getPlotsByFarmId(farmId: string, filters: { page?: number; limit?: number }) {
    if (!mongoose.Types.ObjectId.isValid(farmId)) {
      return ServiceResponse.failure(PLOT_MESSAGES.FARM_NOT_FOUND, null, httpStatus.BAD_REQUEST);
    }
    const farm = await Farm.findById(farmId);
    if (!farm) {
      return ServiceResponse.failure(PLOT_MESSAGES.FARM_NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    return this.getPlots({ parentFarm: farmId, ...filters });
  }

  async getPlotById(plotId: string) {
    if (!mongoose.Types.ObjectId.isValid(plotId)) {
      return ServiceResponse.failure(PLOT_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const plot = await plotRepository.findByIdWithFarm(plotId);
    if (!plot) {
      return ServiceResponse.failure(PLOT_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    return ServiceResponse.success(PLOT_MESSAGES.FETCH_ONE_SUCCESS, plot, httpStatus.OK);
  }

  async updatePlot(plotId: string, payload: UpdatePlotBody) {
    if (!mongoose.Types.ObjectId.isValid(plotId)) {
      return ServiceResponse.failure(PLOT_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const plot = await plotRepository.findById(plotId);
    if (!plot) {
      return ServiceResponse.failure(PLOT_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const originalFarmId = plot.parentFarm;
    let targetFarmId = plot.parentFarm;

    if (payload.parentFarm) {
      if (!mongoose.Types.ObjectId.isValid(payload.parentFarm)) {
        return ServiceResponse.failure(PLOT_MESSAGES.FARM_NOT_FOUND, null, httpStatus.BAD_REQUEST);
      }
      const farm = await Farm.findById(payload.parentFarm);
      if (!farm) {
        return ServiceResponse.failure(PLOT_MESSAGES.FARM_NOT_FOUND, null, httpStatus.BAD_REQUEST);
      }
      targetFarmId = farm._id;
      plot.parentFarm = farm._id;
    }

    if (payload.avocadoVariety) {
      const resolvedVarieties = await this.validateAndResolveVarieties(payload.avocadoVariety);
      if (!resolvedVarieties) {
        return ServiceResponse.failure(PLOT_MESSAGES.INVALID_VARIETY, null, httpStatus.BAD_REQUEST);
      }
      plot.avocadoVariety = resolvedVarieties;
    }

    const targetPlotName = payload.plotName ? payload.plotName : plot.plotName;

    if (payload.plotName || payload.parentFarm) {
      const nameExists = await plotRepository.findByNameAndFarmExcludingId(plot._id, targetFarmId, targetPlotName);
      if (nameExists) {
        return ServiceResponse.failure(PLOT_MESSAGES.DUPLICATE_NAME, null, httpStatus.BAD_REQUEST);
      }
    }

    if (payload.parentFarm !== undefined) {
      plot.parentFarm = new mongoose.Types.ObjectId(payload.parentFarm);
    }
    if (payload.plotName !== undefined) plot.plotName = payload.plotName;
    if (payload.totalArea !== undefined) plot.totalArea = payload.totalArea;
    if (payload.status !== undefined) plot.status = payload.status;
    if (payload.comments !== undefined) plot.comments = payload.comments;

    await plot.save();

    if (payload.status === PlotStatus.INACTIVE) {
      await Valve.updateMany({ parentPlot: plot._id }, { status: ValveStatus.INACTIVE });
      await Park.updateMany({ parentPlot: plot._id }, { status: ParkStatus.INACTIVE });
    }

    await aggregateAreaForFarm(targetFarmId);
    if (originalFarmId.toString() !== targetFarmId.toString()) {
      await aggregateAreaForFarm(originalFarmId);
    }

    return ServiceResponse.success(PLOT_MESSAGES.UPDATE_SUCCESS, plot, httpStatus.OK);
  }
}

export default new PlotService();
