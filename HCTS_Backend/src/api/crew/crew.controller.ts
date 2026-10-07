import type { Request, Response } from 'express';
import handleServiceResponse from '../../utils/handleServiceResponse.ts';
import crewService from './crew.service.ts';
import type { CrewStatus } from '../../models/crew.model.ts';

class CrewController {
  constructor(private readonly service = crewService) {}

  createCrew = async (req: Request, res: Response): Promise<void> => {
    const { crewName, assignedPickers, supervisor, leader, workDate, status } = req.body;

    const serviceResponse = await this.service.createCrew(
      {
        crewName,
        assignedPickers,
        supervisor,
        leader,
        workDate,
        status,
      },
      (req as any).user?.userId
    );

    handleServiceResponse(serviceResponse, res);
  };

  getCrews = async (req: Request, res: Response): Promise<void> => {
    const { campaign, workDate, supervisor, status, search, page, limit } = req.query as {
      campaign?: string;
      workDate?: string;
      supervisor?: string;
      status?: CrewStatus;
      search?: string;
      page?: number;
      limit?: number;
    };

    const serviceResponse = await this.service.getCrews({
      campaign,
      workDate,
      supervisor,
      status,
      search,
      page,
      limit,
    });

    handleServiceResponse(serviceResponse, res);
  };

  getCrewsBySupervisor = async (req: Request, res: Response): Promise<void> => {
    const supervisorId = String(req.params.supervisorId || req.params.manijeroId);
    const { campaign, workDate, status, search, page, limit } = req.query as {
      campaign?: string;
      workDate?: string;
      status?: CrewStatus;
      search?: string;
      page?: number;
      limit?: number;
    };

    const serviceResponse = await this.service.getCrewsBySupervisor(supervisorId, {
      campaign,
      workDate,
      status,
      search,
      page,
      limit,
    });

    handleServiceResponse(serviceResponse, res);
  };

  getCrewById = async (req: Request, res: Response): Promise<void> => {
    const { crewId } = req.params;

    const serviceResponse = await this.service.getCrewById(crewId as string);

    handleServiceResponse(serviceResponse, res);
  };

  updateCrew = async (req: Request, res: Response): Promise<void> => {
    const { crewId } = req.params;
    const { crewName, assignedPickers, supervisor, leader, workDate, status } = req.body;

    const serviceResponse = await this.service.updateCrew(
      crewId as string,
      {
        crewName,
        assignedPickers,
        supervisor,
        leader,
        workDate,
        status,
      },
      (req as any).user
    );

    handleServiceResponse(serviceResponse, res);
  };

  toggleCrewStatus = async (req: Request, res: Response): Promise<void> => {
    const { crewId } = req.params;
    const serviceResponse = await this.service.toggleCrewStatus(crewId as string, (req as any).user);
    handleServiceResponse(serviceResponse, res);
  };

  getPreviousDayCrews = async (req: Request, res: Response): Promise<void> => {
    const { supervisorId } = req.query;
    const serviceResponse = await this.service.getPreviousDayCrews(supervisorId as string | undefined);
    handleServiceResponse(serviceResponse, res);
  };

  copyPreviousCrews = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.copyPreviousCrews(req.body);
    handleServiceResponse(serviceResponse, res);
  };

  // Attendance Endpoints
  checkInAttendance = async (req: Request, res: Response): Promise<void> => {
    const { crewId } = req.params;
    const { workerIds, entryTime } = req.body;
    const serviceResponse = await this.service.checkInWorkers(crewId as string, workerIds, entryTime);
    handleServiceResponse(serviceResponse, res);
  };

  checkOutAttendance = async (req: Request, res: Response): Promise<void> => {
    const { crewId } = req.params;
    const { workerIds, exitTime } = req.body;
    const serviceResponse = await this.service.checkOutWorkers(crewId as string, workerIds, exitTime);
    handleServiceResponse(serviceResponse, res);
  };

  getCrewAttendance = async (req: Request, res: Response): Promise<void> => {
    const { crewId } = req.params;
    const serviceResponse = await this.service.getCrewAttendance(crewId as string);
    handleServiceResponse(serviceResponse, res);
  };

  getUnassignedWorkers = async (req: Request, res: Response): Promise<void> => {
    const { workDate, search, page, limit } = req.query as {
      workDate?: string;
      search?: string;
      page?: string;
      limit?: string;
    };

    const serviceResponse = await this.service.getUnassignedWorkers({
      workDate,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    handleServiceResponse(serviceResponse, res);
  };
}

export default new CrewController();
