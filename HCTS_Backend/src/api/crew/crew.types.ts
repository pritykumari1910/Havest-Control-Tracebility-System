import type { ICrew, CrewStatus } from '../../models/crew.model.ts';

export interface CreateCrewBody {
  crewName: string;
  assignedPickers: string[];
  supervisor: string;
  leader?: string;
  workDate?: string | Date;
  status?: CrewStatus;
}

export interface UpdateCrewBody {
  crewName?: string;
  assignedPickers?: string[];
  supervisor?: string;
  leader?: string;
  workDate?: string | Date;
  status?: CrewStatus;
}

export interface CrewListFilters {
  campaign?: string;
  supervisor?: string;
  workDate?: string;
  status?: CrewStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CopyPreviousCrewsBody {
  crewIds?: string[];
}

export interface GetPreviousDayCrewsQuery {
  supervisorId?: string;
}

export interface GetUnassignedWorkersQuery {
  workDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export type CrewDocument = ICrew;


