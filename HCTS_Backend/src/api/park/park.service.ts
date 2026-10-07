import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { ParkStatus } from '../../models/park.model.ts';
import Valve from '../../models/valve.model.ts';
import Variety, { VarietyStatus } from '../../models/variety.model.ts';
import ServiceResponse from '../../utils/ServiceResponse.ts';
import { aggregateAreaForValve } from '../../services/areaAggregation.service.ts';
import parkRepository from './park.repository.ts';
import type { CreateParkBody, ParkListFilters, UpdateParkBody } from './park.types.ts';

const PARK_MESSAGES = {
  CREATE_SUCCESS: 'Park created successfully',
  FETCH_SUCCESS: 'Parks fetched successfully',
  FETCH_ONE_SUCCESS: 'Park fetched successfully',
  UPDATE_SUCCESS: 'Park updated successfully',
  NOT_FOUND: 'Park not found',
  VALVE_NOT_FOUND: 'Parent valve not found',
  DUPLICATE_NAME: 'Park name must be unique within this valve',
  INVALID_VARIETY: 'Invalid or inactive avocado variety name',
} as const;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class ParkService {
  private async getNextParkCode(): Promise<string> {
    const parks = await parkRepository.getAllParks();
    let maxNum = 0;
    for (const p of parks) {
      const match = p.parkCode.match(/^PARK(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
    const nextNum = maxNum + 1;
    return `PARK${nextNum.toString().padStart(3, '0')}`;
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

  async createPark(payload: CreateParkBody) {
    const { parentValve, parkName, rowRange, area, avocadoVariety, status = ParkStatus.ACTIVE, comments = '' } = payload;

    if (!mongoose.Types.ObjectId.isValid(parentValve)) {
      return ServiceResponse.failure(PARK_MESSAGES.VALVE_NOT_FOUND, null, httpStatus.BAD_REQUEST);
    }

    const valve = await Valve.findById(parentValve);
    if (!valve) {
      return ServiceResponse.failure(PARK_MESSAGES.VALVE_NOT_FOUND, null, httpStatus.BAD_REQUEST);
    }

    const resolvedVarieties = await this.validateAndResolveVarieties(avocadoVariety);
    if (!resolvedVarieties) {
      return ServiceResponse.failure(PARK_MESSAGES.INVALID_VARIETY, null, httpStatus.BAD_REQUEST);
    }

    const nameExists = await parkRepository.findByNameAndValve(parentValve, parkName);
    if (nameExists) {
      return ServiceResponse.failure(PARK_MESSAGES.DUPLICATE_NAME, null, httpStatus.BAD_REQUEST);
    }

    const parkCode = await this.getNextParkCode();

    const park = await parkRepository.create({
      parentValve: valve._id,
      parentPlot: valve.parentPlot,
      parentFarm: valve.parentFarm,
      parkName,
      parkCode,
      rowRange,
      area,
      avocadoVariety: resolvedVarieties,
      status,
      comments,
    });

    await aggregateAreaForValve(valve._id);

    return ServiceResponse.success(PARK_MESSAGES.CREATE_SUCCESS, park, httpStatus.CREATED);
  }

  async getParks(filters: ParkListFilters) {
    const query: any = {};

    if (filters.parentValve && mongoose.Types.ObjectId.isValid(filters.parentValve)) {
      query.parentValve = new mongoose.Types.ObjectId(filters.parentValve);
    }

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
        { parkName: searchRegex },
        { parkCode: searchRegex },
      ];
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 10);
    const skip = (page - 1) * limit;

    const [parks, total] = await Promise.all([
      parkRepository.findWithPagination(query, skip, limit),
      parkRepository.count(query),
    ]);

    const result = {
      parks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    return ServiceResponse.success(PARK_MESSAGES.FETCH_SUCCESS, result, httpStatus.OK);
  }

  async getParksByValveId(valveId: string, filters: { page?: number; limit?: number }) {
    if (!mongoose.Types.ObjectId.isValid(valveId)) {
      return ServiceResponse.failure(PARK_MESSAGES.VALVE_NOT_FOUND, null, httpStatus.BAD_REQUEST);
    }
    const valve = await Valve.findById(valveId);
    if (!valve) {
      return ServiceResponse.failure(PARK_MESSAGES.VALVE_NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    return this.getParks({ parentValve: valveId, ...filters });
  }

  async getParkById(parkId: string) {
    if (!mongoose.Types.ObjectId.isValid(parkId)) {
      return ServiceResponse.failure(PARK_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const park = await parkRepository.findByIdWithDetails(parkId);
    if (!park) {
      return ServiceResponse.failure(PARK_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    return ServiceResponse.success(PARK_MESSAGES.FETCH_ONE_SUCCESS, park, httpStatus.OK);
  }

  async updatePark(parkId: string, payload: UpdateParkBody) {
    if (!mongoose.Types.ObjectId.isValid(parkId)) {
      return ServiceResponse.failure(PARK_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const park = await parkRepository.findById(parkId);
    if (!park) {
      return ServiceResponse.failure(PARK_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const originalValveId = park.parentValve;
    let targetValveId = park.parentValve;

    if (payload.parentValve) {
      if (!mongoose.Types.ObjectId.isValid(payload.parentValve)) {
        return ServiceResponse.failure(PARK_MESSAGES.VALVE_NOT_FOUND, null, httpStatus.BAD_REQUEST);
      }
      const valve = await Valve.findById(payload.parentValve);
      if (!valve) {
        return ServiceResponse.failure(PARK_MESSAGES.VALVE_NOT_FOUND, null, httpStatus.BAD_REQUEST);
      }
      targetValveId = valve._id;
      park.parentValve = valve._id;
      park.parentPlot = valve.parentPlot;
      park.parentFarm = valve.parentFarm;
    }

    if (payload.avocadoVariety) {
      const resolvedVarieties = await this.validateAndResolveVarieties(payload.avocadoVariety);
      if (!resolvedVarieties) {
        return ServiceResponse.failure(PARK_MESSAGES.INVALID_VARIETY, null, httpStatus.BAD_REQUEST);
      }
      park.avocadoVariety = resolvedVarieties;
    }

    const targetParkName = payload.parkName ? payload.parkName : park.parkName;

    if (payload.parkName || payload.parentValve) {
      const nameExists = await parkRepository.findByNameAndValveExcludingId(park._id, targetValveId, targetParkName);
      if (nameExists) {
        return ServiceResponse.failure(PARK_MESSAGES.DUPLICATE_NAME, null, httpStatus.BAD_REQUEST);
      }
    }

    if (payload.parkName !== undefined) park.parkName = payload.parkName;
    if (payload.rowRange !== undefined) park.rowRange = payload.rowRange;
    if (payload.area !== undefined) park.area = payload.area;
    if (payload.status !== undefined) park.status = payload.status;
    if (payload.comments !== undefined) park.comments = payload.comments;

    await park.save();

    await aggregateAreaForValve(targetValveId);
    if (originalValveId.toString() !== targetValveId.toString()) {
      await aggregateAreaForValve(originalValveId);
    }

    return ServiceResponse.success(PARK_MESSAGES.UPDATE_SUCCESS, park, httpStatus.OK);
  }
}

export default new ParkService();
export { PARK_MESSAGES };
