import SatelliteRole from '../../models/satelliteRole.model.ts';

const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class SatelliteRoleRepository {
  async count(): Promise<number> {
    return SatelliteRole.countDocuments().exec();
  }

  async insertMany(roles: any[]) {
    return SatelliteRole.insertMany(roles);
  }

  async findByName(name: string) {
    return SatelliteRole.findOne({
      name: new RegExp(`^${escapeRegExp(name)}$`, 'i'),
    }).exec();
  }

  async findByNameExcludeId(name: string, excludeId: any) {
    return SatelliteRole.findOne({
      _id: { $ne: excludeId },
      name: new RegExp(`^${escapeRegExp(name)}$`, 'i'),
    }).exec();
  }

  async findById(roleId: string) {
    return SatelliteRole.findById(roleId).exec();
  }

  async find(query: Record<string, any>) {
    return SatelliteRole.find(query).sort({ name: 1 }).exec();
  }

  async create(payload: any) {
    return SatelliteRole.create(payload);
  }
}

export default new SatelliteRoleRepository();
