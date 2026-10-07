import type { Request, Response } from 'express';
import handleServiceResponse from '../../utils/handleServiceResponse.ts';
import employmentCompanyService from './employmentCompany.service.ts';
import type { EmploymentCompanyStatus } from '../../models/employmentCompany.model.ts';

class EmploymentCompanyController {
  constructor(private readonly service = employmentCompanyService) {}

  createCompany = async (req: Request, res: Response): Promise<void> => {
    const { companyName, taxId, contactPerson, phoneNumber, email, status, comments } = req.body;

    const serviceResponse = await this.service.createCompany({
      companyName,
      taxId,
      contactPerson,
      phoneNumber,
      email,
      status,
      comments,
    });

    handleServiceResponse(serviceResponse, res);
  };

  getCompanies = async (req: Request, res: Response): Promise<void> => {
    const { status, search, page, limit } = req.query as {
      status?: EmploymentCompanyStatus;
      search?: string;
      page?: string;
      limit?: string;
    };

    const serviceResponse = await this.service.getCompanies({
      status,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    handleServiceResponse(serviceResponse, res);
  };

  getCompanyById = async (req: Request, res: Response): Promise<void> => {
    const { companyId } = req.params;

    const serviceResponse = await this.service.getCompanyById(companyId as string);

    handleServiceResponse(serviceResponse, res);
  };

  updateCompany = async (req: Request, res: Response): Promise<void> => {
    const { companyId } = req.params;
    const { companyName, taxId, contactPerson, phoneNumber, email, status, comments } = req.body;

    const serviceResponse = await this.service.updateCompany(companyId as string, {
      companyName,
      taxId,
      contactPerson,
      phoneNumber,
      email,
      status,
      comments,
    });

    handleServiceResponse(serviceResponse, res);
  };
}

export default new EmploymentCompanyController();
