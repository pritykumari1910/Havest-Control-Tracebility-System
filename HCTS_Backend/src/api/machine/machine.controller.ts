import type { Request, Response } from 'express';
import handleServiceResponse from '../../utils/handleServiceResponse.ts';
import machineService from './machine.service.ts';
import type { MachineStatus } from '../../models/machine.model.ts';

class MachineController {
  constructor(private readonly service = machineService) {}

  createMachine = async (req: Request, res: Response): Promise<void> => {
    const { name, machineType, licensePlateOrInternalId, comments, status } = req.body;
    const serviceResponse = await this.service.createMachine({
      name,
      machineType,
      licensePlateOrInternalId,
      comments,
      status,
    });
    handleServiceResponse(serviceResponse, res);
  };

  getMachines = async (req: Request, res: Response): Promise<void> => {
    const { status, machineType, search, page, limit } = req.query as {
      status?: MachineStatus;
      machineType?: string;
      search?: string;
      page?: number;
      limit?: number;
    };
    const serviceResponse = await this.service.getMachines({
      status,
      machineType,
      search,
      page,
      limit,
    });
    handleServiceResponse(serviceResponse, res);
  };

  getMachineById = async (req: Request, res: Response): Promise<void> => {
    const { machineId } = req.params;
    const serviceResponse = await this.service.getMachineById(machineId as string);
    handleServiceResponse(serviceResponse, res);
  };

  updateMachine = async (req: Request, res: Response): Promise<void> => {
    const { machineId } = req.params;
    const { name, machineType, licensePlateOrInternalId, comments, status } = req.body;
    const serviceResponse = await this.service.updateMachine(machineId as string, {
      name,
      machineType,
      licensePlateOrInternalId,
      comments,
      status,
    });
    handleServiceResponse(serviceResponse, res);
  };

  toggleMachineStatus = async (req: Request, res: Response): Promise<void> => {
    const { machineId } = req.params;
    const serviceResponse = await this.service.toggleMachineStatus(machineId as string);
    handleServiceResponse(serviceResponse, res);
  };

  assignOperator = async (req: Request, res: Response): Promise<void> => {
    const { machineId } = req.params;
    const { workerIds } = req.body;
    const serviceResponse = await this.service.assignOperators(machineId as string, workerIds as string[]);
    handleServiceResponse(serviceResponse, res);
  };

  getOperatorsForMachine = async (req: Request, res: Response): Promise<void> => {
    const { machineId } = req.params;
    const serviceResponse = await this.service.getOperatorsForMachine(machineId as string);
    handleServiceResponse(serviceResponse, res);
  };

  removeOperator = async (req: Request, res: Response): Promise<void> => {
    const { machineId, workerId } = req.params;
    const serviceResponse = await this.service.removeOperator(machineId as string, workerId as string);
    handleServiceResponse(serviceResponse, res);
  };
}

export default new MachineController();
