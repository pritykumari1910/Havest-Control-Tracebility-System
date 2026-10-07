import EmploymentCompany from '../../models/employmentCompany.model.ts';

const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class EmploymentCompanyRepository {
  async findByName(companyName: string) {
    return EmploymentCompany.findOne({
      companyName: new RegExp(`^${escapeRegExp(companyName)}$`, 'i'),
    }).exec();
  }

  async findByTaxId(taxId: string) {
    return EmploymentCompany.findOne({
      taxId: new RegExp(`^${escapeRegExp(taxId)}$`, 'i'),
    }).exec();
  }

  async findById(companyId: string) {
    return EmploymentCompany.findById(companyId).exec();
  }

  async create(payload: any) {
    return EmploymentCompany.create(payload);
  }

  async count(query: Record<string, any>): Promise<number> {
    return EmploymentCompany.countDocuments(query).exec();
  }

  async findWithPagination(query: Record<string, any>, skip: number, limit: number) {
    return EmploymentCompany.find(query).sort({ companyName: 1 }).skip(skip).limit(limit).exec();
  }
}

export default new EmploymentCompanyRepository();
