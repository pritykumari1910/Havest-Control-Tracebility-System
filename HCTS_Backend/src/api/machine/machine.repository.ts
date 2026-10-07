import Machine from '../../models/machine.model.ts';
import MachineOperator from '../../models/machineOperator.model.ts';

class MachineRepository {
  async findOne(query: Record<string, any>) {
    return Machine.findOne(query).exec();
  }

  async findById(machineId: string) {
    return Machine.findById(machineId).exec();
  }

  async create(payload: any) {
    return Machine.create(payload);
  }

  async count(query: Record<string, any>): Promise<number> {
    return Machine.countDocuments(query).exec();
  }

  async findWithPagination(query: Record<string, any>, skip: number, limit: number) {
    return Machine.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }
}

export default new MachineRepository();
