import type { Request, Response } from 'express';
import handleServiceResponse from '../../utils/handleServiceResponse.ts';
import workerService from './worker.service.ts';
import type { DocumentIdType, WorkerStatus } from '../../models/worker.model.ts';

class WorkerController {
  constructor(private readonly service = workerService) {}

  createWorker = async (req: Request, res: Response): Promise<void> => {
    const { firstName, lastName, documentIdType, documentIdNumber, employmentCompany, phoneNumber, email, status } = req.body;

    const serviceResponse = await this.service.createWorker({
      firstName,
      lastName,
      documentIdType,
      documentIdNumber,
      employmentCompany,
      phoneNumber,
      email,
      status,
    });

    handleServiceResponse(serviceResponse, res);
  };

  getWorkers = async (req: Request, res: Response): Promise<void> => {
    const { employmentCompany, status, documentIdType, search, page, limit } = req.query as {
      employmentCompany?: string;
      status?: WorkerStatus;
      documentIdType?: DocumentIdType;
      search?: string;
      page?: number;
      limit?: number;
    };

    const serviceResponse = await this.service.getWorkers({
      employmentCompany,
      status,
      documentIdType,
      search,
      page,
      limit,
    });

    handleServiceResponse(serviceResponse, res);
  };

  getWorkerById = async (req: Request, res: Response): Promise<void> => {
    const { workerId } = req.params;

    const serviceResponse = await this.service.getWorkerById(workerId as string);

    handleServiceResponse(serviceResponse, res);
  };

  updateWorker = async (req: Request, res: Response): Promise<void> => {
    const { workerId } = req.params;
    const { firstName, lastName, documentIdType, documentIdNumber, employmentCompany, phoneNumber, email, status } = req.body;

    const serviceResponse = await this.service.updateWorker(workerId as string, {
      firstName,
      lastName,
      documentIdType,
      documentIdNumber,
      employmentCompany,
      phoneNumber,
      email,
      status,
    });

    handleServiceResponse(serviceResponse, res);
  };

  getWorkerQrCard = async (req: Request, res: Response): Promise<void> => {
    const { workerId } = req.params;
    const serviceResponse = await this.service.getWorkerQrCard(workerId as string);
    handleServiceResponse(serviceResponse, res);
  };

  downloadWorkerQrCardPdf = async (req: Request, res: Response): Promise<void> => {
    const { workerId } = req.params;
    const serviceResponse = await this.service.downloadWorkerQrCardPdf(workerId as string);
    if (!serviceResponse.success || !serviceResponse.responseObject) {
      handleServiceResponse(serviceResponse, res);
      return;
    }
    const { buffer, filename } = serviceResponse.responseObject;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  };

  downloadWorkerQrBooklet = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.downloadWorkerQrBooklet();
    if (!serviceResponse.success || !serviceResponse.responseObject) {
      handleServiceResponse(serviceResponse, res);
      return;
    }
    const { buffer, filename } = serviceResponse.responseObject;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  };

  regenerateWorkerQrCode = async (req: Request, res: Response): Promise<void> => {
    const { workerId } = req.params;
    const serviceResponse = await this.service.regenerateWorkerQrCode(workerId as string);
    handleServiceResponse(serviceResponse, res);
  };

  getWorkerByQrCode = async (req: Request, res: Response): Promise<void> => {
    const { qrCode } = req.params;
    const { workDate } = req.query as { workDate?: string };
    const serviceResponse = await this.service.getWorkerByQrCode(qrCode as string, workDate);
    handleServiceResponse(serviceResponse, res);
  };

  getWorkersByCompanyId = async (req: Request, res: Response): Promise<void> => {
    const { companyId } = req.params;
    const { page, limit } = req.query as { page?: string; limit?: string };

    const serviceResponse = await this.service.getWorkers({
      employmentCompany: companyId as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    handleServiceResponse(serviceResponse, res);
  };
}

export default new WorkerController();
