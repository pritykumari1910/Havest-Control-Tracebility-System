import SatelliteStaff from '../../models/satelliteStaff.model.ts';

class SatelliteStaffRepository {
  async findById(id: any) {
    return SatelliteStaff.findById(id).exec();
  }

  async findByIdWithDetails(id: any) {
    return SatelliteStaff.findById(id)
      .populate('worker', 'firstName lastName internalCode')
      .populate('campaign', 'campaignName campaignCode')
      .populate('employmentCompany', 'companyName taxId')
      .populate('satelliteRole', 'name')
      .populate('farm', 'farmName internalCode')
      .populate('plot', 'plotName plotCode')
      .populate('valve', 'valveName valveCode')
      .populate({
        path: 'registeredBy',
        select: 'firstName lastName email',
        populate: { path: 'roleIds', select: 'name' },
      })
      .exec();
  }

  async find(query: Record<string, any>) {
    return SatelliteStaff.find(query).exec();
  }

  async create(payload: any) {
    return SatelliteStaff.create(payload);
  }

  async count(query: Record<string, any>): Promise<number> {
    return SatelliteStaff.countDocuments(query).exec();
  }

  async findWithPagination(query: Record<string, any>, skip: number, limit: number) {
    return SatelliteStaff.find(query)
      .populate('worker', 'firstName lastName internalCode')
      .populate('campaign', 'campaignName campaignCode')
      .populate('employmentCompany', 'companyName taxId')
      .populate('satelliteRole', 'name')
      .populate('farm', 'farmName internalCode')
      .populate('plot', 'plotName plotCode')
      .populate('valve', 'valveName valveCode')
      .populate({
        path: 'registeredBy',
        select: 'firstName lastName email',
        populate: { path: 'roleIds', select: 'name' },
      })
      .sort({ workDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }
}

export default new SatelliteStaffRepository();
