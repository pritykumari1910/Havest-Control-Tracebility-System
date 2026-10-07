export interface RegisterStaffPayload {
  workDate: Date | string;
  workerId: string;
  satelliteRoleId: string;
  farmId: string;
  plotId?: string | null;
  valveId?: string | null;
  workZone?: string;
  shiftType?: 'full' | 'partial';
  shiftFraction?: number;
  partialReason?: string;
  checkInTime?: string | Date;
  checkOutTime?: string | Date;
}

export interface SatelliteStaffListFilters {
  workDate?: string;
  satelliteRoleId?: string;
  farmId?: string;
  campaignId?: string;
  page?: number;
  limit?: number;
}

export interface CheckInStaffBody {
  entryTime?: string | Date;
}

export interface CheckOutStaffBody {
  exitTime?: string | Date;
}

