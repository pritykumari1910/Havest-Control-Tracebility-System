import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { FarmStatus } from '../../models/farm.model.ts';
import Plot, { PlotStatus } from '../../models/plot.model.ts';
import Valve, { ValveStatus } from '../../models/valve.model.ts';
import Park, { ParkStatus } from '../../models/park.model.ts';
import ServiceResponse from '../../utils/ServiceResponse.ts';
import dashboardEventPublisher, { DashboardAction, DashboardEntity } from '../../events/dashboard.publisher.ts';
import farmRepository from './farm.repository.ts';
import type { CreateFarmBody, FarmListFilters, UpdateFarmBody } from './farm.types.ts';

const FARM_MESSAGES = {
  CREATE_SUCCESS: 'Farm created successfully',
  FETCH_SUCCESS: 'Farms fetched successfully',
  FETCH_ONE_SUCCESS: 'Farm fetched successfully',
  UPDATE_SUCCESS: 'Farm updated successfully',
  NOT_FOUND: 'Farm not found',
  DUPLICATE_NAME: 'Farm name must be unique',
} as const;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class FarmService {
  private async getNextInternalCode(): Promise<string> {
    const farms = await farmRepository.getAllFarms();
    let maxNum = 0;
    for (const farm of farms) {
      const match = farm.internalCode.match(/^FARM(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
    const nextNum = maxNum + 1;
    return `FARM${nextNum.toString().padStart(3, '0')}`;
  }

  async createFarm(payload: CreateFarmBody) {
    const { farmName, totalHectares, status = FarmStatus.ACTIVE, comments = '' } = payload;

    const nameExists = await farmRepository.findByName(farmName);
    if (nameExists) {
      return ServiceResponse.failure(FARM_MESSAGES.DUPLICATE_NAME, null, httpStatus.BAD_REQUEST);
    }

    const internalCode = await this.getNextInternalCode();

    const farm = await farmRepository.create({
      farmName,
      internalCode,
      totalHectares,
      status,
      comments,
    });

    dashboardEventPublisher.publishCreated(DashboardEntity.FARM, String(farm._id));

    return ServiceResponse.success(FARM_MESSAGES.CREATE_SUCCESS, farm, httpStatus.CREATED);
  }

  async getFarms(filters: FarmListFilters) {
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.search) {
      const searchRegex = new RegExp(escapeRegExp(filters.search), 'i');
      query.$or = [
        { farmName: searchRegex },
        { internalCode: searchRegex },
      ];
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 10);
    const skip = (page - 1) * limit;

    const [farms, total] = await Promise.all([
      farmRepository.findWithPagination(query, skip, limit),
      farmRepository.count(query),
    ]);

    const result = {
      farms,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    return ServiceResponse.success(FARM_MESSAGES.FETCH_SUCCESS, result, httpStatus.OK);
  }

  async getFarmById(farmId: string) {
    if (!mongoose.Types.ObjectId.isValid(farmId)) {
      return ServiceResponse.failure(FARM_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const farm = await farmRepository.findById(farmId);
    if (!farm) {
      return ServiceResponse.failure(FARM_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    return ServiceResponse.success(FARM_MESSAGES.FETCH_ONE_SUCCESS, farm, httpStatus.OK);
  }

  async updateFarm(farmId: string, payload: UpdateFarmBody) {
    if (!mongoose.Types.ObjectId.isValid(farmId)) {
      return ServiceResponse.failure(FARM_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const farm = await farmRepository.findById(farmId);
    if (!farm) {
      return ServiceResponse.failure(FARM_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }
    const previousStatus = farm.status;

    if (payload.farmName && payload.farmName.toLowerCase() !== farm.farmName.toLowerCase()) {
      const nameExists = await farmRepository.findByName(payload.farmName);
      if (nameExists) {
        return ServiceResponse.failure(FARM_MESSAGES.DUPLICATE_NAME, null, httpStatus.BAD_REQUEST);
      }
    }

    if (payload.farmName !== undefined) farm.farmName = payload.farmName;
    if (payload.totalHectares !== undefined) farm.totalHectares = payload.totalHectares;
    if (payload.status !== undefined) farm.status = payload.status;
    if (payload.comments !== undefined) farm.comments = payload.comments;

    await farm.save();

    if (payload.status === FarmStatus.INACTIVE) {
      await Plot.updateMany({ parentFarm: farm._id }, { status: PlotStatus.INACTIVE });
      await Valve.updateMany({ parentFarm: farm._id }, { status: ValveStatus.INACTIVE });
      await Park.updateMany({ parentFarm: farm._id }, { status: ParkStatus.INACTIVE });
    }

    if (payload.status === FarmStatus.ACTIVE && previousStatus !== FarmStatus.ACTIVE) {
      dashboardEventPublisher.publish(DashboardEntity.FARM, DashboardAction.ACTIVATED, String(farm._id));
    } else if (payload.status === FarmStatus.INACTIVE && previousStatus !== FarmStatus.INACTIVE) {
      dashboardEventPublisher.publish(DashboardEntity.FARM, DashboardAction.DEACTIVATED, String(farm._id));
    } else {
      dashboardEventPublisher.publishUpdated(DashboardEntity.FARM, String(farm._id));
    }

    return ServiceResponse.success(FARM_MESSAGES.UPDATE_SUCCESS, farm, httpStatus.OK);
  }
}

export default new FarmService();
