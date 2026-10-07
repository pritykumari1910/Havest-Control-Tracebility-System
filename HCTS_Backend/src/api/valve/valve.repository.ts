import mongoose from 'mongoose';
import Valve from '../../models/valve.model.ts';

class ValveRepository {
  async getAllValves(): Promise<any[]> {
    return Valve.find({}, 'valveCode').exec();
  }

  async findById(valveId: string) {
    return Valve.findById(valveId).exec();
  }

  async findByIdWithPlotAndFarm(valveId: string) {
    return Valve.findById(valveId).populate('parentPlot').populate('parentFarm').exec();
  }

  async findByNameAndPlot(parentPlot: string, valveName: string) {
    return Valve.findOne({
      parentPlot: new mongoose.Types.ObjectId(parentPlot),
      valveName: new RegExp(`^${valveName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    }).exec();
  }

  async findByNameAndPlotExcludingId(excludeId: any, parentPlot: any, valveName: string) {
    return Valve.findOne({
      _id: { $ne: excludeId },
      parentPlot,
      valveName: new RegExp(`^${valveName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    }).exec();
  }

  async create(payload: any) {
    return Valve.create(payload);
  }

  async count(query: Record<string, any>): Promise<number> {
    return Valve.countDocuments(query).exec();
  }

  async findWithPagination(query: Record<string, any>, skip: number, limit: number) {
    return Valve.find(query)
      .populate('parentPlot')
      .populate('parentFarm')
      .sort({ valveName: 1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }
}

export default new ValveRepository();
