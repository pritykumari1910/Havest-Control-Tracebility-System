import Farm, { FarmStatus } from '../../models/farm.model.ts';
import type { CreateFarmBody, FarmListFilters } from './farm.types.ts';

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class FarmRepository {
  async getAllFarms(): Promise<any[]> {
    return Farm.find({}, 'internalCode').exec();
  }

  async findByName(farmName: string) {
    return Farm.findOne({ farmName: new RegExp(`^${escapeRegExp(farmName)}$`, 'i') }).exec();
  }

  async findById(farmId: string) {
    return Farm.findById(farmId).exec();
  }

  async create(payload: CreateFarmBody & { internalCode: string }) {
    return Farm.create(payload);
  }

  async count(query: Record<string, any>): Promise<number> {
    return Farm.countDocuments(query).exec();
  }

  async findWithPagination(query: Record<string, any>, skip: number, limit: number) {
    return Farm.find(query).sort({ farmName: 1 }).skip(skip).limit(limit).exec();
  }
}

export default new FarmRepository();
