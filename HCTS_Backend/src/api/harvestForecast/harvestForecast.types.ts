import type { ForecastStatus } from '../../models/harvestForecast.model.ts';

export interface ForecastManualPayload {
  campaign: string;
  farm: string;
  plot: string;
  valve?: string | null;
  park?: string | null;
  variety: string;
  surfaceArea: number;
  estimatedKg: number;
  recordDate?: string;
  responsiblePerson: string;
  status?: ForecastStatus;
  comments?: string;
}

export interface ForecastListFilters {
  campaignId?: string;
  farmId?: string;
  plotId?: string;
  varietyId?: string;
  status?: ForecastStatus;
  page?: number;
  limit?: number;
}
