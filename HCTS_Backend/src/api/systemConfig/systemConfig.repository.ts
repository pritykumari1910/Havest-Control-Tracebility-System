import { SystemConfig } from '../../models/index.ts';

class SystemConfigRepository {
  async findById(id: string) {
    return SystemConfig.findById(id).exec();
  }

  async findByIdWithUser(id: string) {
    return SystemConfig.findById(id).populate('updatedBy', 'firstName lastName name email').exec();
  }

  async findOne(query: Record<string, any>) {
    return SystemConfig.findOne(query).exec();
  }

  async findOneWithUser(query: Record<string, any>) {
    return SystemConfig.findOne(query).populate('updatedBy', 'firstName lastName name email').exec();
  }

  async create(payload: any) {
    return SystemConfig.create(payload);
  }

  async findByIdAndDelete(id: string) {
    return SystemConfig.findByIdAndDelete(id).exec();
  }

  async count(query: Record<string, any>): Promise<number> {
    return SystemConfig.countDocuments(query).exec();
  }

  async findWithPagination(query: Record<string, any>, skip: number, limit: number) {
    return SystemConfig.find(query)
      .populate('updatedBy', 'firstName lastName name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }
}

export default new SystemConfigRepository();
