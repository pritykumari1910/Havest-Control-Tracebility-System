import type { IPark, ParkStatus } from '../../models/park.model.ts';

export interface CreateParkBody {
  parentValve: string;
  parkName: string;
  rowRange: string;
  area: number;
  avocadoVariety: string[];
  status?: ParkStatus;
  comments?: string;
}

export interface UpdateParkBody {
  parentValve?: string;
  parkName?: string;
  rowRange?: string;
  area?: number;
  avocadoVariety?: string[];
  status?: ParkStatus;
  comments?: string;
}

export interface ParkListFilters {
  parentValve?: string;
  parentPlot?: string;
  parentFarm?: string;
  status?: ParkStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export type ParkDocument = IPark;
