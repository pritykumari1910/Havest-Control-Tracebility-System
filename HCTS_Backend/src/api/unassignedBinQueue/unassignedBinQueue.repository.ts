import UnassignedBinQueue from '../../models/unassignedBinQueue.model.ts';

class UnassignedBinQueueRepository {
  async findById(id: string) {
    return UnassignedBinQueue.findById(id).exec();
  }

  async findOne(query: Record<string, any>) {
    return UnassignedBinQueue.findOne(query).exec();
  }

  async create(payload: any) {
    return UnassignedBinQueue.create(payload);
  }

  async count(query: Record<string, any>): Promise<number> {
    return UnassignedBinQueue.countDocuments(query).exec();
  }

  async findWithPagination(query: Record<string, any>, skip: number, limit: number) {
    return UnassignedBinQueue.find(query)
      .populate('qrInventory', 'qrCode qrNumber status series')
      .populate('receptionBatch', 'batchCode workDate status')
      .populate('scannedBy', 'name email')
      .populate('campaign', 'name campaignCode')
      .populate('resolvedBy', 'name email')
      .populate('resolvedHarvestAssignment', 'workDate farm plot variety status')
      .sort({ scannedAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async findByIdWithDetails(id: any) {
    return UnassignedBinQueue.findById(id)
      .populate('qrInventory', 'qrCode qrNumber status series history')
      .populate('receptionBatch', 'batchCode workDate status machine operator')
      .populate('scannedBy', 'name email')
      .populate('campaign', 'name campaignCode')
      .populate('resolvedBy', 'name email')
      .populate({
        path: 'resolvedHarvestAssignment',
        populate: [
          { path: 'farm', select: 'farmName internalCode' },
          { path: 'plot', select: 'plotName plotCode' },
          { path: 'variety', select: 'varietyName varietyCode' },
          { path: 'crew', select: 'crewCode crewName' },
        ],
      })
      .exec();
  }
}

export default new UnassignedBinQueueRepository();
