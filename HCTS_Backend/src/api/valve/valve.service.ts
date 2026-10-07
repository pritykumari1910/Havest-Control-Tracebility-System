import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { ValveStatus } from '../../models/valve.model.ts';
import Plot from '../../models/plot.model.ts';
import Park, { ParkStatus } from '../../models/park.model.ts';
import Variety, { VarietyStatus } from '../../models/variety.model.ts';
import ServiceResponse from '../../utils/ServiceResponse.ts';
import { aggregateAreaForPlot } from '../../services/areaAggregation.service.ts';
import valveRepository from './valve.repository.ts';
import type { CreateValveBody, ValveListFilters, UpdateValveBody } from './valve.types.ts';

const VALVE_MESSAGES = {
  CREATE_SUCCESS: 'Valve created successfully',
  FETCH_SUCCESS: 'Valves fetched successfully',
  FETCH_ONE_SUCCESS: 'Valve fetched successfully',
  UPDATE_SUCCESS: 'Valve updated successfully',
  NOT_FOUND: 'Valve not found',
  PLOT_NOT_FOUND: 'Parent plot not found',
  DUPLICATE_NAME: 'Valve name must be unique within this plot',
  INVALID_VARIETY: 'Invalid or inactive avocado variety name',
} as const;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class ValveService {
  private async getNextValveCode(): Promise<string> {
    const valves = await valveRepository.getAllValves();
    let maxNum = 0;
    for (const v of valves) {
      const match = v.valveCode.match(/^VAL(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
    const nextNum = maxNum + 1;
    return `VAL${nextNum.toString().padStart(3, '0')}`;
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

  async createValve(payload: CreateValveBody) {
    const { parentPlot, valveName, irrigationArea = 0, avocadoVariety, status = ValveStatus.ACTIVE, comments = '' } = payload;

    if (!mongoose.Types.ObjectId.isValid(parentPlot)) {
      return ServiceResponse.failure(VALVE_MESSAGES.PLOT_NOT_FOUND, null, httpStatus.BAD_REQUEST);
    }

    const plot = await Plot.findById(parentPlot);
    if (!plot) {
      return ServiceResponse.failure(VALVE_MESSAGES.PLOT_NOT_FOUND, null, httpStatus.BAD_REQUEST);
    }

    const resolvedVarieties = await this.validateAndResolveVarieties(avocadoVariety);
    if (!resolvedVarieties) {
      return ServiceResponse.failure(VALVE_MESSAGES.INVALID_VARIETY, null, httpStatus.BAD_REQUEST);
    }

    const nameExists = await valveRepository.findByNameAndPlot(parentPlot, valveName);
    if (nameExists) {
      return ServiceResponse.failure(VALVE_MESSAGES.DUPLICATE_NAME, null, httpStatus.BAD_REQUEST);
    }

    const valveCode = await this.getNextValveCode();

    const valve = await valveRepository.create({
      parentPlot: plot._id,
      parentFarm: plot.parentFarm,
      valveName,
      valveCode,
      irrigationArea,
      avocadoVariety: resolvedVarieties,
      status,
      comments,
    });

    await aggregateAreaForPlot(plot._id);

    return ServiceResponse.success(VALVE_MESSAGES.CREATE_SUCCESS, valve, httpStatus.CREATED);
  }

  async getValves(filters: ValveListFilters) {
    const query: any = {};

    if (filters.parentPlot && mongoose.Types.ObjectId.isValid(filters.parentPlot)) {
      query.parentPlot = new mongoose.Types.ObjectId(filters.parentPlot);
    }

    if (filters.parentFarm && mongoose.Types.ObjectId.isValid(filters.parentFarm)) {
      query.parentFarm = new mongoose.Types.ObjectId(filters.parentFarm);
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.search) {
      const searchRegex = new RegExp(escapeRegExp(filters.search), 'i');
      query.$or = [
        { valveName: searchRegex },
        { valveCode: searchRegex },
      ];
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 10);
    const skip = (page - 1) * limit;

    const [valves, total] = await Promise.all([
      valveRepository.findWithPagination(query, skip, limit),
      valveRepository.count(query),
    ]);

    const result = {
      valves,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    return ServiceResponse.success(VALVE_MESSAGES.FETCH_SUCCESS, result, httpStatus.OK);
  }

  async getValvesByPlotId(plotId: string, filters: { page?: number; limit?: number }) {
    if (!mongoose.Types.ObjectId.isValid(plotId)) {
      return ServiceResponse.failure(VALVE_MESSAGES.PLOT_NOT_FOUND, null, httpStatus.BAD_REQUEST);
    }
    const plot = await Plot.findById(plotId);
    if (!plot) {
      return ServiceResponse.failure(VALVE_MESSAGES.PLOT_NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    return this.getValves({ parentPlot: plotId, ...filters });
  }

  async getValveById(valveId: string) {
    if (!mongoose.Types.ObjectId.isValid(valveId)) {
      return ServiceResponse.failure(VALVE_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const valve = await valveRepository.findByIdWithPlotAndFarm(valveId);
    if (!valve) {
      return ServiceResponse.failure(VALVE_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    return ServiceResponse.success(VALVE_MESSAGES.FETCH_ONE_SUCCESS, valve, httpStatus.OK);
  }

  async updateValve(valveId: string, payload: UpdateValveBody) {
    if (!mongoose.Types.ObjectId.isValid(valveId)) {
      return ServiceResponse.failure(VALVE_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const valve = await valveRepository.findById(valveId);
    if (!valve) {
      return ServiceResponse.failure(VALVE_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const originalPlotId = valve.parentPlot;
    let targetPlotId = valve.parentPlot;

    if (payload.parentPlot) {
      if (!mongoose.Types.ObjectId.isValid(payload.parentPlot)) {
        return ServiceResponse.failure(VALVE_MESSAGES.PLOT_NOT_FOUND, null, httpStatus.BAD_REQUEST);
      }
      const plot = await Plot.findById(payload.parentPlot);
      if (!plot) {
        return ServiceResponse.failure(VALVE_MESSAGES.PLOT_NOT_FOUND, null, httpStatus.BAD_REQUEST);
      }
      targetPlotId = plot._id;
      valve.parentPlot = plot._id;
      valve.parentFarm = plot.parentFarm;
    }

    if (payload.avocadoVariety) {
      const resolvedVarieties = await this.validateAndResolveVarieties(payload.avocadoVariety);
      if (!resolvedVarieties) {
        return ServiceResponse.failure(VALVE_MESSAGES.INVALID_VARIETY, null, httpStatus.BAD_REQUEST);
      }
      valve.avocadoVariety = resolvedVarieties;
    }

    const targetValveName = payload.valveName ? payload.valveName : valve.valveName;

    if (payload.valveName || payload.parentPlot) {
      const nameExists = await valveRepository.findByNameAndPlotExcludingId(valve._id, targetPlotId, targetValveName);
      if (nameExists) {
        return ServiceResponse.failure(VALVE_MESSAGES.DUPLICATE_NAME, null, httpStatus.BAD_REQUEST);
      }
    }

    if (payload.valveName !== undefined) valve.valveName = payload.valveName;
    if (payload.irrigationArea !== undefined) valve.irrigationArea = payload.irrigationArea;
    if (payload.status !== undefined) valve.status = payload.status;
    if (payload.comments !== undefined) valve.comments = payload.comments;

    await valve.save();

    if (payload.status === ValveStatus.INACTIVE) {
      await Park.updateMany({ parentValve: valve._id }, { status: ParkStatus.INACTIVE });
    }

    await aggregateAreaForPlot(targetPlotId);
    if (originalPlotId.toString() !== targetPlotId.toString()) {
      await aggregateAreaForPlot(originalPlotId);
    }

    return ServiceResponse.success(VALVE_MESSAGES.UPDATE_SUCCESS, valve, httpStatus.OK);
  }
}

export default new ValveService();
export { VALVE_MESSAGES };
