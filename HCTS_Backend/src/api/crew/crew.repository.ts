import mongoose from 'mongoose';
import Crew from '../../models/crew.model.ts';

class CrewRepository {
  async getAllCrews(): Promise<any[]> {
    return Crew.find({}, 'crewCode').exec();
  }

  async findById(crewId: string) {
    return Crew.findById(crewId).exec();
  }

  async findByIdWithDetails(crewId: string) {
    return Crew.findById(crewId)
      .populate('campaign')
      .populate('supervisor', 'firstName lastName name email')
      .populate('leader', 'firstName lastName internalCode')
      .populate('assignedPickers', 'firstName lastName internalCode')
      .exec();
  }

  async findOne(query: Record<string, any>) {
    return Crew.findOne(query).exec();
  }

  async find(query: Record<string, any>) {
    return Crew.find(query).exec();
  }

  async create(payload: any) {
    return Crew.create(payload);
  }

  async count(query: Record<string, any>): Promise<number> {
    return Crew.countDocuments(query).exec();
  }

  async findWithPagination(query: Record<string, any>, skip: number, limit: number) {
    return Crew.find(query)
      .populate('campaign', 'campaignName campaignCode')
      .populate('supervisor', 'firstName lastName name email')
      .populate('leader', 'firstName lastName internalCode')
      .populate('assignedPickers', 'firstName lastName internalCode')
      .sort({ workDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }
}

export default new CrewRepository();
