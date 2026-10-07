import Variety from '../../models/variety.model.ts';

const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class VarietyRepository {
  async getAllVarieties(): Promise<any[]> {
    return Variety.find({}, 'varietyCode').exec();
  }

  async findByName(varietyName: string) {
    return Variety.findOne({
      varietyName: new RegExp(`^${escapeRegExp(varietyName)}$`, 'i'),
    }).exec();
  }

  async findById(varietyId: string) {
    return Variety.findById(varietyId).exec();
  }

  async create(payload: any) {
    return Variety.create(payload);
  }

  async find(query: Record<string, any>) {
    return Variety.find(query).sort({ varietyName: 1 }).exec();
  }
}

export default new VarietyRepository();
