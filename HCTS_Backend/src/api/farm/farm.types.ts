import type { IFarm, FarmStatus } from '../../models/farm.model.ts';

export interface CreateFarmBody {
  farmName: string;
  totalHectares: number;
  status?: FarmStatus;
  comments?: string;
}

export interface UpdateFarmBody {
  farmName?: string;
  totalHectares?: number;
  status?: FarmStatus;
  comments?: string;
}

export interface FarmListFilters {
  status?: FarmStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export type FarmDocument = IFarm;
