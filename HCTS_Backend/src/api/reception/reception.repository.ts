import ReceptionBatch from '../../models/receptionBatch.model.ts';
import HarvestReceiptScan from '../../models/harvestReceiptScan.model.ts';

class ReceptionRepository {
  async findOne(query: Record<string, any>) {
    return ReceptionBatch.findOne(query).exec();
  }

  async findById(batchId: string) {
    return ReceptionBatch.findById(batchId).exec();
  }

  async create(payload: any) {
    return ReceptionBatch.create(payload);
  }

  async count(query: Record<string, any>): Promise<number> {
    return ReceptionBatch.countDocuments(query).exec();
  }

  async findWithPagination(query: Record<string, any>, skip: number, limit: number) {
    return ReceptionBatch.find(query)
      .populate('machine', 'name internalCode licensePlateOrInternalId')
      .populate({
        path: 'operator',
        populate: { path: 'worker', select: 'firstName lastName' },
      })
      .populate('openedBy', 'name email')
      .populate('closedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }
}

export default new ReceptionRepository();
