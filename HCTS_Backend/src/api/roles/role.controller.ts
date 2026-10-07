import type { NextFunction, Request, Response } from 'express';
import handleServiceResponse from '../../utils/handleServiceResponse.ts';
import roleService from './role.service.ts';

class RoleController {
  constructor(private readonly service = roleService) {}

  createPermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { permissionName, permissionIdentifier } = req.body;
    const serviceResponse = await this.service.createPermission(permissionName, permissionIdentifier);
    handleServiceResponse(serviceResponse, res, next);
  };

  getAllPermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const serviceResponse = await this.service.getAllPermissions();
    handleServiceResponse(serviceResponse, res);
  };

  updatePermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const serviceResponse = await this.service.updatePermission(String(req.params.permissionId), req.body);
    handleServiceResponse(serviceResponse, res, next);
  };

  deletePermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const serviceResponse = await this.service.deletePermission(String(req.params.permissionId));
    handleServiceResponse(serviceResponse, res, next);
  };

  createRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const serviceResponse = await this.service.createRole(req.body);
    handleServiceResponse(serviceResponse, res, next);
  };

  getAllRoles = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.getAllRoles();
    handleServiceResponse(serviceResponse, res);
  };

  getRoleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const serviceResponse = await this.service.getRoleById(String(req.params.roleId));
    handleServiceResponse(serviceResponse, res, next);
  };

  updateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const serviceResponse = await this.service.updateRole(String(req.params.roleId), req.body);
    handleServiceResponse(serviceResponse, res, next);
  };

  deleteRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const serviceResponse = await this.service.deleteRole(String(req.params.roleId));
    handleServiceResponse(serviceResponse, res, next);
  };
}

export default new RoleController();
