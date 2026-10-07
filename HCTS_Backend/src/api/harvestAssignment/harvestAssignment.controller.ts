import type { Request, Response } from 'express';
import handleServiceResponse from '../../utils/handleServiceResponse.ts';
import harvestAssignmentService from './harvestAssignment.service.ts';
import type { HarvestAssignmentStatus } from '../../models/harvestAssignment.model.ts';

class HarvestAssignmentController {
  constructor(private readonly service = harvestAssignmentService) {}

  createAssignment = async (req: Request, res: Response): Promise<void> => {
    const {
      crewId,
      farmId,
      plotId,
      valveId,
      parkId,
      assignedRows,
      specialZone,
      zoneType,
      varietyId,
      qrSeriesId,
      startQrNumber,
      endQrNumber,
      workDate,
      comments,
    } = req.body;

    const serviceResponse = await this.service.createAssignment(
      {
        crewId,
        farmId,
        plotId,
        valveId,
        parkId,
        assignedRows,
        specialZone,
        zoneType,
        varietyId,
        qrSeriesId,
        startQrNumber,
        endQrNumber,
        workDate,
        comments,
      },
      (req as any).user
    );

    handleServiceResponse(serviceResponse, res);
  };

  getAssignments = async (req: Request, res: Response): Promise<void> => {
    const { crewId, farmId, plotId, status, workDate, page, limit } = req.query as {
      crewId?: string;
      farmId?: string;
      plotId?: string;
      status?: string;
      workDate?: string;
      page?: number;
      limit?: number;
    };

    const serviceResponse = await this.service.getAssignments({
      crewId,
      farmId,
      plotId,
      status,
      workDate,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    handleServiceResponse(serviceResponse, res);
  };

  getAssignmentsByCrewId = async (req: Request, res: Response): Promise<void> => {
    const { crewId } = req.params;
    const { status, workDate, page, limit } = req.query as {
      status?: string;
      workDate?: string;
      page?: number;
      limit?: number;
    };

    const serviceResponse = await this.service.getAssignmentsByCrewId(crewId as string, {
      status,
      workDate,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    handleServiceResponse(serviceResponse, res);
  };

  getAssignmentById = async (req: Request, res: Response): Promise<void> => {
    const { assignmentId } = req.params;
    const serviceResponse = await this.service.getAssignmentById(assignmentId as string);
    handleServiceResponse(serviceResponse, res);
  };

  updateAssignmentStatus = async (req: Request, res: Response): Promise<void> => {
    const { assignmentId } = req.params;
    const { status } = req.body;

    const serviceResponse = await this.service.updateAssignmentStatus(
      assignmentId as string,
      status as HarvestAssignmentStatus,
      (req as any).user
    );

    handleServiceResponse(serviceResponse, res);
  };

  assignQrRange = async (req: Request, res: Response): Promise<void> => {
    const { assignmentId } = req.params;
    const { qrSeriesId, startQrNumber, endQrNumber } = req.body;

    const serviceResponse = await this.service.assignQrRange(
      assignmentId as string,
      { qrSeriesId, startQrNumber, endQrNumber },
      (req as any).user
    );

    handleServiceResponse(serviceResponse, res);
  };

  returnUnusedQrs = async (req: Request, res: Response): Promise<void> => {
    const { assignmentId } = req.params;

    const serviceResponse = await this.service.returnUnusedQrs(
      assignmentId as string,
      (req as any).user
    );

    handleServiceResponse(serviceResponse, res);
  };

  updateAssignment = async (req: Request, res: Response): Promise<void> => {
    const { assignmentId } = req.params;

    const serviceResponse = await this.service.updateAssignment(
      assignmentId as string,
      req.body,
      (req as any).user
    );

    handleServiceResponse(serviceResponse, res);
  };

  getVarietyChangeAudit = async (req: Request, res: Response): Promise<void> => {
    const { assignmentId } = req.params;
    const serviceResponse = await this.service.getVarietyChangeAudit(assignmentId as string);
    handleServiceResponse(serviceResponse, res);
  };

  changeVarietyMidDay = async (req: Request, res: Response): Promise<void> => {
    const { assignmentId } = req.params;
    const { newVarietyId, confirm } = req.body;

    const serviceResponse = await this.service.changeVarietyMidDay(
      assignmentId as string,
      { newVarietyId, confirm },
      (req as any).user
    );

    handleServiceResponse(serviceResponse, res);
  };

  getFarmManagerHistory = async (req: Request, res: Response): Promise<void> => {
    const { filter, farmId, crewId, startDate, endDate, page, limit } = req.query as any;

    const serviceResponse = await this.service.getFarmManagerHistory({
      filter,
      farmId,
      crewId,
      startDate,
      endDate,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    handleServiceResponse(serviceResponse, res);
  };

  getFarmManagerHistoryById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const serviceResponse = await this.service.getFarmManagerHistoryById(id as string);

    handleServiceResponse(serviceResponse, res);
  };
}

export default new HarvestAssignmentController();
