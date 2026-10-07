import type { IPlot, PlotStatus } from '../../models/plot.model.ts';

export interface CreatePlotBody {
  parentFarm: string;
  plotName: string;
  totalArea: number;
  avocadoVariety: string[];
  status?: PlotStatus;
  comments?: string;
}

export interface UpdatePlotBody {
  parentFarm?: string;
  plotName?: string;
  totalArea?: number;
  avocadoVariety?: string[];
  status?: PlotStatus;
  comments?: string;
}

export interface PlotListFilters {
  parentFarm?: string;
  status?: PlotStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export type PlotDocument = IPlot;
