import type { Request, Response } from 'express';
import handleServiceResponse from '../../utils/handleServiceResponse.ts';
import satelliteRoleService from './satelliteRole.service.ts';

class SatelliteRoleController {
  constructor(private readonly service = satelliteRoleService) {}

  createSatelliteRole = async (req: Request, res: Response): Promise<void> => {
    const { name, isActive } = req.body;
    const serviceResponse = await this.service.createSatelliteRole({ name, isActive });
    handleServiceResponse(serviceResponse, res);
  };

  getSatelliteRoles = async (req: Request, res: Response): Promise<void> => {
    const { isActive } = req.query as { isActive?: boolean };
    const serviceResponse = await this.service.getSatelliteRoles({ isActive });
    handleServiceResponse(serviceResponse, res);
  };

  updateSatelliteRole = async (req: Request, res: Response): Promise<void> => {
    const { roleId } = req.params;
    const { name, isActive } = req.body;
    const serviceResponse = await this.service.updateSatelliteRole(roleId as string, { name, isActive });
    handleServiceResponse(serviceResponse, res);
  };

  toggleSatelliteRoleStatus = async (req: Request, res: Response): Promise<void> => {
    const { roleId } = req.params;
    const serviceResponse = await this.service.toggleSatelliteRoleStatus(roleId as string);
    handleServiceResponse(serviceResponse, res);
  };
}

export default new SatelliteRoleController();
