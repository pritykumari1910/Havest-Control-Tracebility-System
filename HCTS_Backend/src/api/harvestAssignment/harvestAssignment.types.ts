import type { HarvestAssignmentStatus } from '../../models/harvestAssignment.model.ts';

export interface CreateAssignmentBody {
  crewId: string;
  farmId: string;
  plotId: string;
  valveId?: string | null;
  parkId?: string | null;
  assignedRows?: string | null;
  specialZone?: string | null;
  zoneType?: 'normal' | 'trial' | 'monitoring' | 'control' | 'other';
  varietyId: string;
  qrSeriesId: string;
  startQrNumber: number;
  endQrNumber: number;
  workDate?: Date | string;
  comments?: string;
}

export interface UpdateAssignmentBody {
  crewId?: string;
  farmId?: string;
  plotId?: string;
  valveId?: string | null;
  parkId?: string | null;
  assignedRows?: string | null;
  specialZone?: string | null;
  zoneType?: 'normal' | 'trial' | 'monitoring' | 'control' | 'other';
  varietyId?: string;
  workDate?: Date | string;
  comments?: string;
  changeReason?: string;
}

export interface AssignmentListFilters {
  crewId?: string;
  farmId?: string;
  plotId?: string;
  status?: string;
  workDate?: string;
  page?: number;
  limit?: number;
}

