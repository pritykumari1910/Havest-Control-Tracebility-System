export interface UnassignedBinQueueListFilters {
  status?: string;
  failureReason?: string;
  campaignId?: string;
  date?: string;
  page?: number;
  limit?: number;
}

export interface ResolveQueueItemPayload {
  harvestAssignmentId: string;
  note?: string;
}

export interface RejectQueueItemPayload {
  reason: string;
}
