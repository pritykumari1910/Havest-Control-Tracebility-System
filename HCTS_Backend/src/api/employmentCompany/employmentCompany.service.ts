import httpStatus from 'http-status';
import { EmploymentCompanyStatus } from '../../models/employmentCompany.model.ts';
import ServiceResponse from '../../utils/ServiceResponse.ts';
import employmentCompanyRepository from './employmentCompany.repository.ts';
import type { CreateCompanyBody, CompanyListFilters, UpdateCompanyBody } from './employmentCompany.types.ts';

const COMPANY_MESSAGES = {
  CREATE_SUCCESS: 'Employment company created successfully',
  FETCH_SUCCESS: 'Employment companies fetched successfully',
  FETCH_ONE_SUCCESS: 'Employment company fetched successfully',
  UPDATE_SUCCESS: 'Employment company updated successfully',
  NOT_FOUND: 'Employment company not found',
  DUPLICATE_NAME: 'Company name must be unique',
  DUPLICATE_TAX_ID: 'Tax ID must be unique',
} as const;

const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class EmploymentCompanyService {
  async createCompany(payload: CreateCompanyBody) {
    const { companyName, taxId, contactPerson, phoneNumber, email = '', status = EmploymentCompanyStatus.ACTIVE, comments = '' } = payload;

    const nameExists = await employmentCompanyRepository.findByName(companyName);
    if (nameExists) {
      return ServiceResponse.failure(COMPANY_MESSAGES.DUPLICATE_NAME, null, httpStatus.BAD_REQUEST);
    }

    const taxIdExists = await employmentCompanyRepository.findByTaxId(taxId);
    if (taxIdExists) {
      return ServiceResponse.failure(COMPANY_MESSAGES.DUPLICATE_TAX_ID, null, httpStatus.BAD_REQUEST);
    }

    const company = await employmentCompanyRepository.create({
      companyName,
      taxId: taxId.toUpperCase(),
      contactPerson,
      phoneNumber,
      email,
      status,
      comments,
    });

    return ServiceResponse.success(COMPANY_MESSAGES.CREATE_SUCCESS, company, httpStatus.CREATED);
  }

  async getCompanies(filters: CompanyListFilters) {
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.search) {
      const searchRegex = new RegExp(escapeRegExp(filters.search), 'i');
      query.$or = [
        { companyName: searchRegex },
        { taxId: searchRegex },
      ];
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 10);
    const skip = (page - 1) * limit;

    const [companies, total] = await Promise.all([
      employmentCompanyRepository.findWithPagination(query, skip, limit),
      employmentCompanyRepository.count(query),
    ]);

    const result = {
      companies,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    return ServiceResponse.success(COMPANY_MESSAGES.FETCH_SUCCESS, result, httpStatus.OK);
  }

  async getCompanyById(companyId: string) {
    const company = await employmentCompanyRepository.findById(companyId);
    if (!company) {
      return ServiceResponse.failure(COMPANY_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    return ServiceResponse.success(COMPANY_MESSAGES.FETCH_ONE_SUCCESS, company, httpStatus.OK);
  }

  async updateCompany(companyId: string, payload: UpdateCompanyBody) {
    const company = await employmentCompanyRepository.findById(companyId);
    if (!company) {
      return ServiceResponse.failure(COMPANY_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    if (payload.companyName && payload.companyName.toLowerCase() !== company.companyName.toLowerCase()) {
      const nameExists = await employmentCompanyRepository.findByName(payload.companyName);
      if (nameExists) {
        return ServiceResponse.failure(COMPANY_MESSAGES.DUPLICATE_NAME, null, httpStatus.BAD_REQUEST);
      }
    }

    if (payload.taxId && payload.taxId.toLowerCase() !== company.taxId.toLowerCase()) {
      const taxIdExists = await employmentCompanyRepository.findByTaxId(payload.taxId);
      if (taxIdExists) {
        return ServiceResponse.failure(COMPANY_MESSAGES.DUPLICATE_TAX_ID, null, httpStatus.BAD_REQUEST);
      }
    }

    if (payload.companyName !== undefined) company.companyName = payload.companyName;
    if (payload.taxId !== undefined) company.taxId = payload.taxId.toUpperCase();
    if (payload.contactPerson !== undefined) company.contactPerson = payload.contactPerson;
    if (payload.phoneNumber !== undefined) company.phoneNumber = payload.phoneNumber;
    if (payload.email !== undefined) company.email = payload.email;
    if (payload.status !== undefined) company.status = payload.status;
    if (payload.comments !== undefined) company.comments = payload.comments;

    await company.save();

    return ServiceResponse.success(COMPANY_MESSAGES.UPDATE_SUCCESS, company, httpStatus.OK);
  }
}

export default new EmploymentCompanyService();
export { COMPANY_MESSAGES };
