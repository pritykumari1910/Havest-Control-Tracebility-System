import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { Machine, MachineOperator, Worker } from '../../models/index.ts';
import { MachineStatus } from '../../models/machine.model.ts';
import { WorkerStatus } from '../../models/worker.model.ts';
import ServiceResponse from '../../utils/ServiceResponse.ts';
import machineRepository from './machine.repository.ts';
import type { CreateMachineBody, MachineListFilters, UpdateMachineBody } from './machine.types.ts';

const MACHINE_MESSAGES = {
  CREATE_SUCCESS: 'Machine registered successfully',
  FETCH_SUCCESS: 'Machines fetched successfully',
  FETCH_ONE_SUCCESS: 'Machine details fetched successfully',
  UPDATE_SUCCESS: 'Machine details updated successfully',
  NOT_FOUND: 'Machine not found',
  INACTIVE_MACHINE: 'Machine is inactive and cannot be assigned operators',
  TOGGLE_SUCCESS: 'Machine status updated successfully',
  OPERATOR_ASSIGN_SUCCESS: 'Operator assigned to machine successfully',
  OPERATOR_REMOVE_SUCCESS: 'Operator removed from machine successfully',
  OPERATOR_NOT_FOUND: 'Operator assignment not found',
  INVALID_WORKER: 'Worker is invalid or inactive',
  DUPLICATE_ASSIGNMENT: 'Worker is already assigned to this machine',
} as const;

const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class MachineService {
  private async getNextMachineCode(): Promise<string> {
    const lastMachine = await Machine.findOne().sort({ createdAt: -1 });
    if (!lastMachine) {
      return 'MAC001';
    }
    const lastCode = lastMachine.internalCode;
    const match = lastCode.match(/MAC(\d+)/);
    if (!match) {
      return 'MAC001';
    }
    const nextNum = parseInt(match[1], 10) + 1;
    return `MAC${String(nextNum).padStart(3, '0')}`;
  }

  async createMachine(payload: CreateMachineBody) {
    const internalCode = await this.getNextMachineCode();

    const machine = await machineRepository.create({
      internalCode,
      name: payload.name.trim(),
      machineType: payload.machineType.trim(),
      licensePlateOrInternalId: payload.licensePlateOrInternalId?.trim() || '',
      comments: payload.comments?.trim() || '',
      status: payload.status || MachineStatus.ACTIVE,
    });

    return ServiceResponse.success(MACHINE_MESSAGES.CREATE_SUCCESS, machine, httpStatus.CREATED);
  }

  async getMachines(filters: MachineListFilters = {}) {
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.machineType) {
      query.machineType = new RegExp(`^${escapeRegExp(filters.machineType.trim())}$`, 'i');
    }

    if (filters.search) {
      const searchRegex = new RegExp(escapeRegExp(filters.search.trim()), 'i');
      query.$or = [
        { internalCode: searchRegex },
        { name: searchRegex },
        { licensePlateOrInternalId: searchRegex },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [machines, total] = await Promise.all([
      machineRepository.findWithPagination(query, skip, limit),
      machineRepository.count(query),
    ]);

    return ServiceResponse.success(
      MACHINE_MESSAGES.FETCH_SUCCESS,
      {
        machines,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      httpStatus.OK
    );
  }

  async getMachineById(machineId: string) {
    if (!mongoose.Types.ObjectId.isValid(machineId)) {
      return ServiceResponse.failure(MACHINE_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const machine = await machineRepository.findById(machineId);
    if (!machine) {
      return ServiceResponse.failure(MACHINE_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    return ServiceResponse.success(MACHINE_MESSAGES.FETCH_ONE_SUCCESS, machine, httpStatus.OK);
  }

  async updateMachine(machineId: string, payload: UpdateMachineBody) {
    if (!mongoose.Types.ObjectId.isValid(machineId)) {
      return ServiceResponse.failure(MACHINE_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const machine = await machineRepository.findById(machineId);
    if (!machine) {
      return ServiceResponse.failure(MACHINE_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    if (payload.name !== undefined) machine.name = payload.name.trim();
    if (payload.machineType !== undefined) machine.machineType = payload.machineType.trim();
    if (payload.licensePlateOrInternalId !== undefined) {
      machine.licensePlateOrInternalId = payload.licensePlateOrInternalId.trim();
    }
    if (payload.comments !== undefined) machine.comments = payload.comments.trim();
    if (payload.status !== undefined) machine.status = payload.status;

    await machine.save();
    return ServiceResponse.success(MACHINE_MESSAGES.UPDATE_SUCCESS, machine, httpStatus.OK);
  }

  async toggleMachineStatus(machineId: string) {
    if (!mongoose.Types.ObjectId.isValid(machineId)) {
      return ServiceResponse.failure(MACHINE_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const machine = await machineRepository.findById(machineId);
    if (!machine) {
      return ServiceResponse.failure(MACHINE_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    machine.status = machine.status === MachineStatus.ACTIVE ? MachineStatus.INACTIVE : MachineStatus.ACTIVE;
    await machine.save();

    return ServiceResponse.success(MACHINE_MESSAGES.TOGGLE_SUCCESS, machine, httpStatus.OK);
  }

  async assignOperators(machineId: string, workerIds: string[]) {
    if (!mongoose.Types.ObjectId.isValid(machineId)) {
      return ServiceResponse.failure(MACHINE_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const machine = await machineRepository.findById(machineId);
    if (!machine) {
      return ServiceResponse.failure(MACHINE_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }
    if (machine.status !== MachineStatus.ACTIVE) {
      return ServiceResponse.failure(MACHINE_MESSAGES.INACTIVE_MACHINE, null, httpStatus.BAD_REQUEST);
    }

    const assignments = [];
    for (const workerId of workerIds) {
      if (!mongoose.Types.ObjectId.isValid(workerId)) {
        return ServiceResponse.failure(`Invalid workerId: ${workerId}`, null, httpStatus.BAD_REQUEST);
      }

      const worker = await Worker.findOne({
        _id: new mongoose.Types.ObjectId(workerId),
        status: WorkerStatus.ACTIVE,
      });
      if (!worker) {
        return ServiceResponse.failure(`Worker not found or is inactive: ${workerId}`, null, httpStatus.BAD_REQUEST);
      }

      const existingAssignment = await MachineOperator.findOne({
        machine: machine._id,
        worker: worker._id,
      });
      if (existingAssignment) {
        assignments.push(existingAssignment);
        continue;
      }

      const assignment = await MachineOperator.create({
        machine: machine._id,
        worker: worker._id,
        isActive: true,
      });
      assignments.push(assignment);
    }

    const populatedAssignments = await MachineOperator.find({
      _id: { $in: assignments.map((a) => a._id) },
    }).populate('worker');

    return ServiceResponse.success(MACHINE_MESSAGES.OPERATOR_ASSIGN_SUCCESS, populatedAssignments, httpStatus.CREATED);
  }

  async getOperatorsForMachine(machineId: string) {
    if (!mongoose.Types.ObjectId.isValid(machineId)) {
      return ServiceResponse.failure(MACHINE_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const machine = await machineRepository.findById(machineId);
    if (!machine) {
      return ServiceResponse.failure(MACHINE_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const operators = await MachineOperator.find({ machine: machine._id })
      .populate({
        path: 'worker',
        populate: {
          path: 'employmentCompany',
          select: 'companyName',
        },
      })
      .sort({ createdAt: -1 });

    return ServiceResponse.success(MACHINE_MESSAGES.FETCH_SUCCESS, operators, httpStatus.OK);
  }

  async removeOperator(machineId: string, workerId: string) {
    if (!mongoose.Types.ObjectId.isValid(machineId) || !mongoose.Types.ObjectId.isValid(workerId)) {
      return ServiceResponse.failure(MACHINE_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const assignment = await MachineOperator.findOneAndDelete({
      machine: new mongoose.Types.ObjectId(machineId),
      worker: new mongoose.Types.ObjectId(workerId),
    });

    if (!assignment) {
      return ServiceResponse.failure(MACHINE_MESSAGES.OPERATOR_NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    return ServiceResponse.success(MACHINE_MESSAGES.OPERATOR_REMOVE_SUCCESS, null, httpStatus.OK);
  }
}

export default new MachineService();
export { MACHINE_MESSAGES };
