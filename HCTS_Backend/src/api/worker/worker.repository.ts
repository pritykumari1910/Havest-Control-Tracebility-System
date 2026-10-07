import Worker from '../../models/worker.model.ts';

const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class WorkerRepository {
  async findByDocumentId(documentIdNumber: string) {
    return Worker.findOne({
      documentIdNumber: new RegExp(`^${escapeRegExp(documentIdNumber)}$`, 'i'),
    }).exec();
  }

  async findById(workerId: string) {
    return Worker.findById(workerId).exec();
  }

  async findByIdWithCompany(workerId: string) {
    return Worker.findById(workerId).populate('employmentCompany').exec();
  }

  async create(payload: any) {
    return Worker.create(payload);
  }

  async count(query: Record<string, any>): Promise<number> {
    return Worker.countDocuments(query).exec();
  }

  async findWithPagination(query: Record<string, any>, skip: number, limit: number) {
    return Worker.find(query)
      .populate('employmentCompany')
      .sort({ firstName: 1, lastName: 1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }
}

export default new WorkerRepository();
