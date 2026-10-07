import type { IWorker, WorkerStatus, DocumentIdType } from '../../models/worker.model.ts';

export interface CreateWorkerBody {
  firstName: string;
  lastName: string;
  documentIdType: DocumentIdType;
  documentIdNumber: string;
  employmentCompany: string;
  phoneNumber?: string;
  email?: string;
  status?: WorkerStatus;
}

export interface UpdateWorkerBody {
  firstName?: string;
  lastName?: string;
  documentIdType?: DocumentIdType;
  documentIdNumber?: string;
  employmentCompany?: string;
  phoneNumber?: string;
  email?: string;
  status?: WorkerStatus;
}

export interface WorkerListFilters {
  employmentCompany?: string;
  status?: WorkerStatus;
  documentIdType?: DocumentIdType;
  search?: string;
  page?: number;
  limit?: number;
}

export type WorkerDocument = IWorker;
