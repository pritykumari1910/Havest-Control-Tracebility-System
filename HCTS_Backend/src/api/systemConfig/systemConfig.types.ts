export interface CreateSystemConfigBody {
  key: string;
  value: any;
  description?: string;
}

export interface UpdateSystemConfigBody {
  value?: any;
  description?: string;
}

export interface SystemConfigFilters {
  search?: string;
  page?: number;
  limit?: number;
}
