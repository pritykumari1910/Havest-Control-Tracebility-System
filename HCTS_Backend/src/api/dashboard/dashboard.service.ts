import mongoose from 'mongoose';
import httpStatus from 'http-status';
import ServiceResponse from '../../utils/ServiceResponse.ts';
import dashboardRepository from './dashboard.repository.ts';
import { RoleModel } from '../../models/index.ts';
import type { DashboardSummary } from './dashboard.types.ts';

class DashboardService {
  constructor(private readonly repository = dashboardRepository) {}

  async getDashboardSummary(params: { userRoleId?: string; userRole?: string; date?: string }) {
    const { userRoleId, userRole, date } = params;
    let resolvedRoleName = userRole || userRoleId;

    if (userRoleId && mongoose.Types.ObjectId.isValid(userRoleId)) {
      const roleDoc = await RoleModel.findById(userRoleId).exec();
      if (roleDoc) {
        resolvedRoleName = roleDoc.name;
      } else {
        return ServiceResponse.failure<DashboardSummary>(
          `Role not found for userRoleId '${userRoleId}'`,
          null,
          httpStatus.NOT_FOUND
        );
      }
    }

    if (!resolvedRoleName) {
      return ServiceResponse.failure<DashboardSummary>(
        'userRoleId parameter is required (ObjectId or role name)',
        null,
        httpStatus.BAD_REQUEST
      );
    }

    const normalizedRole = resolvedRoleName.toLowerCase().trim();

    if (normalizedRole === 'operations director' || normalizedRole.includes('director') || normalizedRole.includes('operations')) {
      const summary = await this.repository.getOperationsDirectorSummary(date);
      return ServiceResponse.success(
        'Operations Director dashboard summary retrieved successfully',
        summary,
        httpStatus.OK
      );
    }

    if (normalizedRole === 'system administrator' || normalizedRole.includes('admin')) {
      const summary = await this.repository.getSystemAdministratorSummary();
      return ServiceResponse.success(
        'Dashboard summary retrieved successfully',
        summary,
        httpStatus.OK
      );
    }

    if (normalizedRole === 'farm manager' || normalizedRole.includes('farm') || normalizedRole.includes('manager')) {
      const summary = await this.repository.getFarmManagerSummary(date);
      return ServiceResponse.success(
        'Dashboard summary retrieved successfully',
        summary,
        httpStatus.OK
      );
    }

    // Default fallback to Operations Director summary
    const summary = await this.repository.getOperationsDirectorSummary(date);
    return ServiceResponse.success(
      'Dashboard summary retrieved successfully',
      summary,
      httpStatus.OK
    );
  }

  async getOperationsDirectorDashboard(date?: string) {
    const summary = await this.repository.getOperationsDirectorSummary(date);
    return ServiceResponse.success(
      'Operations Director dashboard summary retrieved successfully',
      summary,
      httpStatus.OK
    );
  }
}

export default new DashboardService();
