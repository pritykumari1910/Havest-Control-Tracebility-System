import mongoose from 'mongoose';
import Plot from '../../models/plot.model.ts';

class PlotRepository {
  async getAllPlots(): Promise<any[]> {
    return Plot.find({}, 'plotCode').exec();
  }

  async findById(plotId: string) {
    return Plot.findById(plotId).exec();
  }

  async findByIdWithFarm(plotId: string) {
    return Plot.findById(plotId).populate('parentFarm').exec();
  }

  async findByNameAndFarm(parentFarm: string, plotName: string) {
    return Plot.findOne({
      parentFarm: new mongoose.Types.ObjectId(parentFarm),
      plotName: new RegExp(`^${plotName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    }).exec();
  }

  async findByNameAndFarmExcludingId(excludeId: any, parentFarm: any, plotName: string) {
    return Plot.findOne({
      _id: { $ne: excludeId },
      parentFarm,
      plotName: new RegExp(`^${plotName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    }).exec();
  }

  async create(payload: any) {
    return Plot.create(payload);
  }

  async count(query: Record<string, any>): Promise<number> {
    return Plot.countDocuments(query).exec();
  }

  async findWithPagination(query: Record<string, any>, skip: number, limit: number) {
    return Plot.find(query).populate('parentFarm').sort({ plotName: 1 }).skip(skip).limit(limit).exec();
  }
}

export default new PlotRepository();
