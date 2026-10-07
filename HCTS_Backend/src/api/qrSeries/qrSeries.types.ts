import type { QrSeriesStatus, PrinterStatus } from '../../models/qrSeries.model.ts';
import type { QrInventoryStatus } from '../../models/qrInventory.model.ts';

export interface CreateSeriesPayload {
  seriesName: string;
  startNumber: number;
  endNumber: number;
  comments?: string;
}

export interface PrinterOrderPayload {
  sentToPrinterDate?: string;
  printerName?: string;
  fileReference?: string;
  printerStatus?: PrinterStatus;
}

export interface ReceiptPayload {
  dateReceived?: string;
  quantityReceived?: number;
  responsiblePerson?: string;
  printingIssues?: string;
  qualityCheckResult?: string;
}

export interface QrSeriesListFilters {
  status?: QrSeriesStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface QrInventoryFilters {
  seriesId?: string;
  status?: QrInventoryStatus;
  startDate?: string;
  endDate?: string;
  harvestAssignmentId?: string;
  page?: number;
  limit?: number;
}
