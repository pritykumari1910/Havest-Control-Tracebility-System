import type { IValve, ValveStatus } from '../../models/valve.model.ts';

export interface CreateValveBody {
  parentPlot: string;
  valveName: string;
  irrigationArea?: number;
  avocadoVariety: string[];
  status?: ValveStatus;
  comments?: string;
}

export interface UpdateValveBody {
  parentPlot?: string;
  valveName?: string;
  irrigationArea?: number;
  avocadoVariety?: string[];
  status?: ValveStatus;
  comments?: string;
}

export interface ValveListFilters {
  parentPlot?: string;
  parentFarm?: string;
  status?: ValveStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export type ValveDocument = IValve;
