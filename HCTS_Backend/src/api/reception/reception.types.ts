export interface CreateReceptionBatchBody {
  machineId: string;
  operatorId: string;
  workDate?: string;
}

export interface UpdateReceptionBatchBody {
  machineId?: string;
  operatorId?: string;
  workDate?: string;
  status?: 'open' | 'closed';
}

export interface ReceptionBatchListFilters {
  status?: 'open' | 'closed';
  page?: number;
  limit?: number;
}

export interface ReceivedBinInventoryFilters {
  batchId?: string;
  crewId?: string;
  machineId?: string;
  varietyId?: string;
  date?: string;
  page?: number;
  limit?: number;
}

export interface CreateIncidentPayload {
  qrCode: string;
  receptionBatchId?: string;
  category: string;
  comments?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
}

export interface IncidentListFilters {
  qrCode?: string;
  receptionBatchId?: string;
  category?: string;
  date?: string;
  page?: number;
  limit?: number;
}

