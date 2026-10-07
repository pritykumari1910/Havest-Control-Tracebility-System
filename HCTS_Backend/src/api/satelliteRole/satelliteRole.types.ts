export interface CreateSatelliteRoleBody {
  name: string;
  isActive?: boolean;
}

export interface UpdateSatelliteRoleBody {
  name?: string;
  isActive?: boolean;
}

export interface SatelliteRoleFilters {
  isActive?: boolean;
}
