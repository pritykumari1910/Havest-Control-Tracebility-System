import type { BuyerStatus } from '../../models/buyer.model.ts';
import type { DestinationCenterStatus } from '../../models/destinationCenter.model.ts';
import type { TransportProviderStatus } from '../../models/transportProvider.model.ts';
import type { DispatchNoteStatus } from '../../models/dispatchNote.model.ts';

export interface CreateBuyerBody {
  name: string;
  internalCode?: string;
  contactDetails?: any;
  status?: BuyerStatus;
}

export interface UpdateBuyerBody {
  name?: string;
  internalCode?: string;
  contactDetails?: any;
  status?: BuyerStatus;
}

export interface BuyerFilters {
  status?: BuyerStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateDestinationCenterBody {
  name: string;
  internalCode?: string;
  contactDetails?: any;
  status?: DestinationCenterStatus;
}

export interface UpdateDestinationCenterBody {
  name?: string;
  internalCode?: string;
  contactDetails?: any;
  status?: DestinationCenterStatus;
}

export interface DestinationCenterFilters {
  status?: DestinationCenterStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateTransportProviderBody {
  legalName: string;
  contactDetails?: any;
  status?: TransportProviderStatus;
}

export interface UpdateTransportProviderBody {
  legalName?: string;
  contactDetails?: any;
  status?: TransportProviderStatus;
}

export interface TransportProviderFilters {
  status?: TransportProviderStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateDispatchNoteBody {
  campaign: string;
  buyer: string;
  destination: string;
  noteDate?: string;
}

export interface UpdateDispatchNoteBody {
  campaign?: string;
  buyer?: string;
  destination?: string;
  noteDate?: string;
}

export interface DispatchNoteFilters {
  status?: DispatchNoteStatus;
  campaign?: string;
  buyer?: string;
  page?: number;
  limit?: number;
}

export interface AssociateBinsBody {
  binIds: string[];
}

export interface RemoveBinBody {
  reason: string;
}

export interface ExportDispatchSummaryQuery {
  format: 'pdf' | 'excel' | 'csv';
}

export interface CreateTransferOrderBody {
  transferOrderNumber?: string;
  transferCode?: string;
  loadingDate?: string;
  departureDateTime?: string;
  truckLicensePlate?: string;
  transportProvider: string;
  driverName?: string;
  originCollectionPoint?: string;
  dispatchNotes: string[];
  totalPallets?: number;
  estimatedAvgWeightPerPallet?: number;
}
