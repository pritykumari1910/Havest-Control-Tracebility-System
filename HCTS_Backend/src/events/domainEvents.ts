export const DashboardEntity = {
  FARM: 'farm',
  WORKER: 'worker',
  VARIETY: 'variety',
  CAMPAIGN: 'campaign',
  CREW: 'crew',
  DISPATCH_NOTE: 'dispatchNote',
  QR_INVENTORY: 'qrInventory',
  QR_SERIES: 'qrSeries',
} as const;

export const DashboardAction = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  ACTIVATED: 'activated',
  DEACTIVATED: 'deactivated',
  CANCELLED: 'cancelled',
} as const;

export type DashboardEntity = (typeof DashboardEntity)[keyof typeof DashboardEntity];
export type DashboardAction = (typeof DashboardAction)[keyof typeof DashboardAction];

export type DashboardDomainEventPayload = {
  entity: DashboardEntity;
  action: DashboardAction;
  entityId?: string;
  timestamp: number;
};

const dashboardEventName = (entity: DashboardEntity, action: DashboardAction) => `${entity}.${action}`;

export const DashboardDomainEvents = {
  FARM_CREATED: dashboardEventName(DashboardEntity.FARM, DashboardAction.CREATED),
  FARM_UPDATED: dashboardEventName(DashboardEntity.FARM, DashboardAction.UPDATED),
  FARM_DELETED: dashboardEventName(DashboardEntity.FARM, DashboardAction.DELETED),
  FARM_ACTIVATED: dashboardEventName(DashboardEntity.FARM, DashboardAction.ACTIVATED),
  FARM_DEACTIVATED: dashboardEventName(DashboardEntity.FARM, DashboardAction.DEACTIVATED),

  WORKER_CREATED: dashboardEventName(DashboardEntity.WORKER, DashboardAction.CREATED),
  WORKER_UPDATED: dashboardEventName(DashboardEntity.WORKER, DashboardAction.UPDATED),
  WORKER_DELETED: dashboardEventName(DashboardEntity.WORKER, DashboardAction.DELETED),

  VARIETY_CREATED: dashboardEventName(DashboardEntity.VARIETY, DashboardAction.CREATED),
  VARIETY_UPDATED: dashboardEventName(DashboardEntity.VARIETY, DashboardAction.UPDATED),
  VARIETY_DELETED: dashboardEventName(DashboardEntity.VARIETY, DashboardAction.DELETED),

  CAMPAIGN_CREATED: dashboardEventName(DashboardEntity.CAMPAIGN, DashboardAction.CREATED),
  CAMPAIGN_UPDATED: dashboardEventName(DashboardEntity.CAMPAIGN, DashboardAction.UPDATED),
  CAMPAIGN_DELETED: dashboardEventName(DashboardEntity.CAMPAIGN, DashboardAction.DELETED),

  CREW_CREATED: dashboardEventName(DashboardEntity.CREW, DashboardAction.CREATED),
  CREW_UPDATED: dashboardEventName(DashboardEntity.CREW, DashboardAction.UPDATED),
  CREW_DELETED: dashboardEventName(DashboardEntity.CREW, DashboardAction.DELETED),

  DISPATCH_NOTE_CREATED: dashboardEventName(DashboardEntity.DISPATCH_NOTE, DashboardAction.CREATED),
  DISPATCH_NOTE_UPDATED: dashboardEventName(DashboardEntity.DISPATCH_NOTE, DashboardAction.UPDATED),
  DISPATCH_NOTE_DELETED: dashboardEventName(DashboardEntity.DISPATCH_NOTE, DashboardAction.DELETED),

  QR_INVENTORY_CREATED: dashboardEventName(DashboardEntity.QR_INVENTORY, DashboardAction.CREATED),
  QR_INVENTORY_UPDATED: dashboardEventName(DashboardEntity.QR_INVENTORY, DashboardAction.UPDATED),
  QR_INVENTORY_DELETED: dashboardEventName(DashboardEntity.QR_INVENTORY, DashboardAction.DELETED),

  QR_SERIES_CREATED: dashboardEventName(DashboardEntity.QR_SERIES, DashboardAction.CREATED),
  QR_SERIES_UPDATED: dashboardEventName(DashboardEntity.QR_SERIES, DashboardAction.UPDATED),
  QR_SERIES_DELETED: dashboardEventName(DashboardEntity.QR_SERIES, DashboardAction.DELETED),
  QR_SERIES_CANCELLED: dashboardEventName(DashboardEntity.QR_SERIES, DashboardAction.CANCELLED),
} as const;

export const DashboardDomainEventNames = Object.values(DashboardDomainEvents);

export const createDashboardDomainEvent = (
  entity: DashboardEntity,
  action: DashboardAction,
  entityId?: string
): DashboardDomainEventPayload => ({
  entity,
  action,
  entityId,
  timestamp: Date.now(),
});
