export type HarvestProgressGroupBy =
  | 'crew'
  | 'assignment'
  | 'variety'
  | 'farm'
  | 'plot'
  | 'valve'
  | 'park'
  | 'campaign';

export interface HarvestProgressFilters {
  startDate?: string;
  endDate?: string;
  farmId?: string;
  plotId?: string;
  varietyId?: string;
  crewId?: string;
  supervisorId?: string;
  groupBy?: HarvestProgressGroupBy;
  page?: number;
  limit?: number;
  format?: 'json' | 'excel' | 'csv' | 'pdf';
}

export interface ForecastVsActualFilters {
  startDate?: string;
  endDate?: string;
  farmId?: string;
  plotId?: string;
  period?: 'daily' | 'weekly' | 'monthly';
}

export interface HarvestReceiptScanReportFilters {
  qrCode?: string;
  crewId?: string;
  machineId?: string;
  varietyId?: string;
  farmId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  dispatchNoteStatus?: string;
  page?: number;
  limit?: number;
}

export interface TransferOrderReportFilters {
  date?: string;
  startDate?: string;
  endDate?: string;
  buyerId?: string;
  destinationId?: string;
  status?: string;
  transportProviderId?: string;
  page?: number;
  limit?: number;
}

export interface HarvestProgressReportItem {
  groupId: string;
  groupName: string;
  groupCode?: string;
  campaignName?: string;
  farmName?: string;
  plotName?: string;
  varietyName?: string;
  crewName?: string;
  supervisorName?: string;
  totalBinsScanned: number;
  standardBinWeightKg: number;
  totalHarvestedKg: number;
  percentageOfTotal: number;
}

export interface ForecastVsActualReportItem {
  periodLabel: string;
  farmName?: string;
  plotName?: string;
  forecastedKg: number;
  actualHarvestedKg: number;
  varianceKg: number;
  fulfillmentPercentage: number;
}

export interface DispatchNoteReportFilters {
  date?: string;
  startDate?: string;
  endDate?: string;
  buyerId?: string;
  destinationId?: string;
  campaignId?: string;
  transportProviderId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  format?: 'json' | 'excel' | 'csv' | 'pdf';
}

export interface DispatchNoteReportItem {
  id: string;
  noteNumber: string;
  noteDate: Date;
  status: string;
  buyerName?: string;
  buyerCode?: string;
  destinationName?: string;
  destinationCode?: string;
  transportProviderName?: string;
  transportProviderId?: string;
  campaignName?: string;
  binsCount: number;
  estimatedTotalWeightKg: number;
  isAssociatedWithBuyerDeliveryNote: boolean;
  isEditedAfterClosure: boolean;
  editCount: number;
  createdAt: Date;
}
