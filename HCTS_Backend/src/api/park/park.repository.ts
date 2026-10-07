import mongoose from 'mongoose';
import Park from '../../models/park.model.ts';

class ParkRepository {
  async getAllParks(): Promise<any[]> {
    return Park.find({}, 'parkCode').exec();
  }

  async findById(parkId: string) {
    return Park.findById(parkId).exec();
  }

  async findByIdWithDetails(parkId: string) {
    return Park.findById(parkId).populate('parentValve').populate('parentPlot').populate('parentFarm').exec();
  }

  async findByNameAndValve(parentValve: string, parkName: string) {
    return Park.findOne({
      parentValve: new mongoose.Types.ObjectId(parentValve),
      parkName: new RegExp(`^${parkName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    }).exec();
  }

  async findByNameAndValveExcludingId(excludeId: any, parentValve: any, parkName: string) {
    return Park.findOne({
      _id: { $ne: excludeId },
      parentValve,
      parkName: new RegExp(`^${parkName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    }).exec();
  }

  async create(payload: any) {
    return Park.create(payload);
  }

  async count(query: Record<string, any>): Promise<number> {
    return Park.countDocuments(query).exec();
  }

  async findWithPagination(query: Record<string, any>, skip: number, limit: number) {
    return Park.find(query)
      .populate('parentValve')
      .populate('parentPlot')
      .populate('parentFarm')
      .sort({ parkName: 1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }
}

export default new ParkRepository();
