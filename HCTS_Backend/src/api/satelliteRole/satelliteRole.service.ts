import httpStatus from 'http-status';
import mongoose from 'mongoose';
import ServiceResponse from '../../utils/ServiceResponse.ts';
import satelliteRoleRepository from './satelliteRole.repository.ts';
import type { CreateSatelliteRoleBody, SatelliteRoleFilters, UpdateSatelliteRoleBody } from './satelliteRole.types.ts';

const SATELLITE_ROLE_MESSAGES = {
  CREATE_SUCCESS: 'Satellite role created successfully',
  FETCH_SUCCESS: 'Satellite roles fetched successfully',
  UPDATE_SUCCESS: 'Satellite role updated successfully',
  NOT_FOUND: 'Satellite role not found',
  DUPLICATE_NAME: 'Satellite role name already exists',
  TOGGLE_SUCCESS: 'Satellite role status updated successfully',
} as const;

class SatelliteRoleService {
  async seedDefaultSatelliteRoles() {
    try {
      const defaults = [
        'Manijero',
        'Cleaning',
        'Logistics',
        'Loading',
        'Machinery',
        'Quality Control',
        'Supervision',
        'Internal Transport',
        'Operational Support',
        'Other',
      ];
      const count = await satelliteRoleRepository.count();
      if (count === 0) {
        await satelliteRoleRepository.insertMany(defaults.map((name) => ({ name, isActive: true })));
        console.log('🌱 Default Satellite Roles seeded successfully');
      }
    } catch (error) {
      console.error('❌ Failed to seed default satellite roles:', error);
    }
  }

  async createSatelliteRole(payload: CreateSatelliteRoleBody) {
    const nameTrimmed = payload.name.trim();
    
    const exists = await satelliteRoleRepository.findByName(nameTrimmed);
    if (exists) {
      return ServiceResponse.failure(SATELLITE_ROLE_MESSAGES.DUPLICATE_NAME, null, httpStatus.BAD_REQUEST);
    }

    const satelliteRole = await satelliteRoleRepository.create({
      name: nameTrimmed,
      isActive: payload.isActive !== undefined ? payload.isActive : true,
    });

    return ServiceResponse.success(SATELLITE_ROLE_MESSAGES.CREATE_SUCCESS, satelliteRole, httpStatus.CREATED);
  }

  async getSatelliteRoles(filters: SatelliteRoleFilters = {}) {
    const query: any = {};
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    const roles = await satelliteRoleRepository.find(query);
    return ServiceResponse.success(SATELLITE_ROLE_MESSAGES.FETCH_SUCCESS, roles, httpStatus.OK);
  }

  async updateSatelliteRole(roleId: string, payload: UpdateSatelliteRoleBody) {
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return ServiceResponse.failure(SATELLITE_ROLE_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const role = await satelliteRoleRepository.findById(roleId);
    if (!role) {
      return ServiceResponse.failure(SATELLITE_ROLE_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    if (payload.name !== undefined) {
      const nameTrimmed = payload.name.trim();
      const exists = await satelliteRoleRepository.findByNameExcludeId(nameTrimmed, role._id);
      if (exists) {
        return ServiceResponse.failure(SATELLITE_ROLE_MESSAGES.DUPLICATE_NAME, null, httpStatus.BAD_REQUEST);
      }
      role.name = nameTrimmed;
    }

    if (payload.isActive !== undefined) {
      role.isActive = payload.isActive;
    }

    await role.save();
    return ServiceResponse.success(SATELLITE_ROLE_MESSAGES.UPDATE_SUCCESS, role, httpStatus.OK);
  }

  async toggleSatelliteRoleStatus(roleId: string) {
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return ServiceResponse.failure(SATELLITE_ROLE_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const role = await satelliteRoleRepository.findById(roleId);
    if (!role) {
      return ServiceResponse.failure(SATELLITE_ROLE_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    role.isActive = !role.isActive;
    await role.save();

    return ServiceResponse.success(SATELLITE_ROLE_MESSAGES.TOGGLE_SUCCESS, role, httpStatus.OK);
  }
}

export default new SatelliteRoleService();
export { SATELLITE_ROLE_MESSAGES };
