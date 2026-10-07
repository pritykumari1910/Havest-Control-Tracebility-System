import eventBus from './eventBus.ts';
import {
  createDashboardDomainEvent,
  DashboardAction,
  DashboardDomainEvents,
  DashboardEntity,
  type DashboardAction as DashboardActionType,
  type DashboardEntity as DashboardEntityType,
} from './domainEvents.ts';

const eventNameByEntityAction = new Map<string, string>(
  Object.entries(DashboardDomainEvents).map(([, eventName]) => [eventName, eventName])
);

class DashboardEventPublisher {
  publish(entity: DashboardEntityType, action: DashboardActionType, entityId?: string): void {
    const eventName = `${entity}.${action}`;

    if (!eventNameByEntityAction.has(eventName)) {
      return;
    }

    eventBus.publish(eventName, createDashboardDomainEvent(entity, action, entityId));
  }

  publishCreated(entity: DashboardEntityType, entityId?: string): void {
    this.publish(entity, DashboardAction.CREATED, entityId);
  }

  publishUpdated(entity: DashboardEntityType, entityId?: string): void {
    this.publish(entity, DashboardAction.UPDATED, entityId);
  }

  publishCancelled(entity: typeof DashboardEntity.QR_SERIES, entityId?: string): void {
    this.publish(entity, DashboardAction.CANCELLED, entityId);
  }
}

export default new DashboardEventPublisher();
export { DashboardAction, DashboardEntity };
