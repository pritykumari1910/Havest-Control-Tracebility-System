import httpStatus from 'http-status';
import { VarietyStatus, VarietyType } from '../../models/variety.model.ts';
import ServiceResponse from '../../utils/ServiceResponse.ts';
import dashboardEventPublisher, { DashboardEntity } from '../../events/dashboard.publisher.ts';
import varietyRepository from './variety.repository.ts';
import type { CreateVarietyBody, VarietyListFilters, UpdateVarietyBody } from './variety.types.ts';

const VARIETY_MESSAGES = {
  CREATE_SUCCESS: 'Variety created successfully',
  FETCH_SUCCESS: 'Varieties fetched successfully',
  FETCH_ONE_SUCCESS: 'Variety fetched successfully',
  UPDATE_SUCCESS: 'Variety updated successfully',
  NOT_FOUND: 'Variety not found',
  DUPLICATE_NAME: 'Variety name must be unique',
} as const;

const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class VarietyService {
  private async getNextVarietyCode(): Promise<string> {
    const varieties = await varietyRepository.getAllVarieties();
    let maxNum = 0;
    for (const v of varieties) {
      const match = v.varietyCode.match(/^VAR(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
    const nextNum = maxNum + 1;
    return `VAR${nextNum.toString().padStart(3, '0')}`;
  }

  async createVariety(payload: CreateVarietyBody) {
    const { varietyName, varietyType, otherVarietyType = '', status = VarietyStatus.ACTIVE, technicalComments = '' } = payload;

    const nameExists = await varietyRepository.findByName(varietyName);
    if (nameExists) {
      return ServiceResponse.failure(VARIETY_MESSAGES.DUPLICATE_NAME, null, httpStatus.BAD_REQUEST);
    }

    const varietyCode = await this.getNextVarietyCode();

    const variety = await varietyRepository.create({
      varietyName,
      varietyCode,
      varietyType,
      otherVarietyType: varietyType === VarietyType.OTHER ? otherVarietyType : '',
      status,
      technicalComments,
    });

    dashboardEventPublisher.publishCreated(DashboardEntity.VARIETY, String(variety._id));

    return ServiceResponse.success(VARIETY_MESSAGES.CREATE_SUCCESS, variety, httpStatus.CREATED);
  }

  async getVarieties(filters: VarietyListFilters) {
    const query: any = {};

    if (filters.varietyType) {
      query.varietyType = filters.varietyType;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    const varieties = await varietyRepository.find(query);
    return ServiceResponse.success(VARIETY_MESSAGES.FETCH_SUCCESS, varieties, httpStatus.OK);
  }

  async getVarietyById(varietyId: string) {
    const variety = await varietyRepository.findById(varietyId);
    if (!variety) {
      return ServiceResponse.failure(VARIETY_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    return ServiceResponse.success(VARIETY_MESSAGES.FETCH_ONE_SUCCESS, variety, httpStatus.OK);
  }

  async updateVariety(varietyId: string, payload: UpdateVarietyBody) {
    const variety = await varietyRepository.findById(varietyId);
    if (!variety) {
      return ServiceResponse.failure(VARIETY_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    if (payload.varietyName && payload.varietyName.toLowerCase() !== variety.varietyName.toLowerCase()) {
      const nameExists = await varietyRepository.findByName(payload.varietyName);
      if (nameExists) {
        return ServiceResponse.failure(VARIETY_MESSAGES.DUPLICATE_NAME, null, httpStatus.BAD_REQUEST);
      }
    }

    if (payload.varietyName !== undefined) variety.varietyName = payload.varietyName;
    if (payload.varietyType !== undefined) {
      variety.varietyType = payload.varietyType;
      if (payload.varietyType !== VarietyType.OTHER) {
        variety.otherVarietyType = '';
      }
    }
    if (payload.otherVarietyType !== undefined) {
      variety.otherVarietyType = payload.otherVarietyType;
    }
    if (payload.status !== undefined) variety.status = payload.status;
    if (payload.technicalComments !== undefined) variety.technicalComments = payload.technicalComments;

    await variety.save();

    dashboardEventPublisher.publishUpdated(DashboardEntity.VARIETY, String(variety._id));

    return ServiceResponse.success(VARIETY_MESSAGES.UPDATE_SUCCESS, variety, httpStatus.OK);
  }
}

export default new VarietyService();
export { VARIETY_MESSAGES };
