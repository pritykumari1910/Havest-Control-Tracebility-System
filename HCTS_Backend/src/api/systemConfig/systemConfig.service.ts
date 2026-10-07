import mongoose from 'mongoose';
import httpStatus from 'http-status';
import ServiceResponse from '../../utils/ServiceResponse.ts';
import systemConfigRepository from './systemConfig.repository.ts';
import type { CreateSystemConfigBody, SystemConfigFilters, UpdateSystemConfigBody } from './systemConfig.types.ts';

class SystemConfigService {
  async getParameters(filters: SystemConfigFilters) {
    try {
      const query: any = {};
      if (filters.search) {
        const searchRegex = new RegExp(filters.search, 'i');
        query.$or = [
          { key: searchRegex },
          { description: searchRegex }
        ];
      }

      const page = Math.max(1, filters.page || 1);
      const limit = Math.max(1, filters.limit || 10);
      const skip = (page - 1) * limit;

      const [parameters, total] = await Promise.all([
        systemConfigRepository.findWithPagination(query, skip, limit),
        systemConfigRepository.count(query),
      ]);

      return ServiceResponse.success('System parameters retrieved successfully', {
        parameters,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      }, httpStatus.OK);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }

  async getParameterById(id: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ServiceResponse.failure('Invalid parameter ID', null, httpStatus.BAD_REQUEST);
      }
      const parameter = await systemConfigRepository.findByIdWithUser(id);
      if (!parameter) {
        return ServiceResponse.failure('System parameter not found', null, httpStatus.NOT_FOUND);
      }
      return ServiceResponse.success('System parameter retrieved successfully', parameter, httpStatus.OK);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }

  async getParameterByKey(key: string) {
    try {
      const parameter = await systemConfigRepository.findOneWithUser({ key });
      if (!parameter) {
        return ServiceResponse.failure('System parameter not found', null, httpStatus.NOT_FOUND);
      }
      return ServiceResponse.success('System parameter retrieved successfully', parameter, httpStatus.OK);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }

  async createParameter(payload: CreateSystemConfigBody, userId: string) {
    try {
      const existing = await systemConfigRepository.findOne({ key: payload.key });
      if (existing) {
        return ServiceResponse.failure(`System parameter key '${payload.key}' already exists`, null, httpStatus.BAD_REQUEST);
      }

      const parameter = await systemConfigRepository.create({
        key: payload.key,
        value: payload.value,
        description: payload.description || '',
        updatedBy: new mongoose.Types.ObjectId(userId),
      });

      return ServiceResponse.success('System parameter created successfully', parameter, httpStatus.CREATED);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }

  async updateParameter(id: string, payload: UpdateSystemConfigBody, userId: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ServiceResponse.failure('Invalid parameter ID', null, httpStatus.BAD_REQUEST);
      }

      const parameter = await systemConfigRepository.findById(id);
      if (!parameter) {
        return ServiceResponse.failure('System parameter not found', null, httpStatus.NOT_FOUND);
      }

      if (payload.value !== undefined) {
        parameter.value = payload.value;
      }
      if (payload.description !== undefined) {
        parameter.description = payload.description;
      }
      parameter.updatedBy = new mongoose.Types.ObjectId(userId);
      await parameter.save();

      return ServiceResponse.success('System parameter updated successfully', parameter, httpStatus.OK);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }

  async deleteParameter(id: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ServiceResponse.failure('Invalid parameter ID', null, httpStatus.BAD_REQUEST);
      }

      const parameter = await systemConfigRepository.findByIdAndDelete(id);
      if (!parameter) {
        return ServiceResponse.failure('System parameter not found', null, httpStatus.NOT_FOUND);
      }

      return ServiceResponse.success('System parameter deleted successfully', parameter, httpStatus.OK);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }
}

export default new SystemConfigService();
