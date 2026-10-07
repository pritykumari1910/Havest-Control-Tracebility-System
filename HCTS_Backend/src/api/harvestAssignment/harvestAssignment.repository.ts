import HarvestAssignment from '../../models/harvestAssignment.model.ts';

class HarvestAssignmentRepository {
  async findOne(query: Record<string, any>) {
    return HarvestAssignment.findOne(query).exec();
  }

  async findById(assignmentId: string) {
    return HarvestAssignment.findById(assignmentId).exec();
  }

  async findByIdWithDetails(assignmentId: string) {
    return HarvestAssignment.findById(assignmentId)
      .populate('campaign')
      .populate('crew')
      .populate('farm')
      .populate('plot')
      .populate('valve')
      .populate('park')
      .populate('variety')
      .populate('qrSeries')
      .exec();
  }

  async create(payload: any) {
    return HarvestAssignment.create(payload);
  }

  async count(query: Record<string, any>): Promise<number> {
    return HarvestAssignment.countDocuments(query).exec();
  }

  async findWithPagination(query: Record<string, any>, skip: number, limit: number) {
    return HarvestAssignment.find(query)
      .populate('campaign')
      .populate('crew')
      .populate('farm')
      .populate('plot')
      .populate('valve')
      .populate('park')
      .populate('variety')
      .populate('qrSeries')
      .sort({ workDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }
}

export default new HarvestAssignmentRepository();
