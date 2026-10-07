import type { IEmploymentCompany, EmploymentCompanyStatus } from '../../models/employmentCompany.model.ts';

export interface CreateCompanyBody {
  companyName: string;
  taxId: string;
  contactPerson: string;
  phoneNumber: string;
  email?: string;
  status?: EmploymentCompanyStatus;
  comments?: string;
}

export interface UpdateCompanyBody {
  companyName?: string;
  taxId?: string;
  contactPerson?: string;
  phoneNumber?: string;
  email?: string;
  status?: EmploymentCompanyStatus;
  comments?: string;
}

export interface CompanyListFilters {
  status?: EmploymentCompanyStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export type CompanyDocument = IEmploymentCompany;
