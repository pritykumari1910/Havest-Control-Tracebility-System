import type { IMachine, MachineStatus } from '../../models/machine.model.ts';

export interface CreateMachineBody {
  name: string;
  machineType: string;
  licensePlateOrInternalId?: string;
  comments?: string;
  status?: MachineStatus;
}

export interface UpdateMachineBody {
  name?: string;
  machineType?: string;
  licensePlateOrInternalId?: string;
  comments?: string;
  status?: MachineStatus;
}

export interface MachineListFilters {
  status?: MachineStatus;
  machineType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export type MachineDocument = IMachine;
