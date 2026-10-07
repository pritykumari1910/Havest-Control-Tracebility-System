import type { IVariety, VarietyStatus, VarietyType } from '../../models/variety.model.ts';

export interface CreateVarietyBody {
  varietyName: string;
  varietyType: VarietyType;
  otherVarietyType?: string;
  status?: VarietyStatus;
  technicalComments?: string;
}

export interface UpdateVarietyBody {
  varietyName?: string;
  varietyType?: VarietyType;
  otherVarietyType?: string;
  status?: VarietyStatus;
  technicalComments?: string;
}

export interface VarietyListFilters {
  varietyType?: VarietyType;
  status?: VarietyStatus;
}

export type VarietyDocument = IVariety;
