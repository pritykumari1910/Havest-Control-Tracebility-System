import type { Server as SocketServer } from 'socket.io';
import eventBus from '../eventBus.ts';
import {
  DashboardDomainEventNames,
  type DashboardDomainEventPayload,
} from '../domainEvents.ts';
import {
  DASHBOARD_REFRESH_EVENT,
  SYSTEM_ADMIN_DASHBOARD_ROOM,
  OPERATIONS_DIRECTOR_DASHBOARD_ROOM,
} from '../../infrastructure/socket/dashboardSocket.ts';
import dashboardService from '../../api/dashboard/dashboard.service.ts';

let isRegistered = false;

export const registerDashboardListener = (io: SocketServer): void => {
  if (isRegistered) {
    return;
  }

  DashboardDomainEventNames.forEach((eventName) => {
    eventBus.subscribe<DashboardDomainEventPayload>(eventName, async (payload) => {
      // Broadcast simple event notification
      const eventPayload = {
        entity: payload.entity,
        action: payload.action,
        timestamp: payload.timestamp,
      };

      io.to(SYSTEM_ADMIN_DASHBOARD_ROOM).emit(DASHBOARD_REFRESH_EVENT, eventPayload);
      io.to(OPERATIONS_DIRECTOR_DASHBOARD_ROOM).emit(DASHBOARD_REFRESH_EVENT, eventPayload);

      // Also fetch and broadcast updated Operations Director metrics snapshot in real time
      try {
        const liveSummaryRes = await dashboardService.getOperationsDirectorDashboard();
        if (liveSummaryRes.success && liveSummaryRes.responseObject) {
          io.to(OPERATIONS_DIRECTOR_DASHBOARD_ROOM).emit('dashboard:operations-director:update', {
            ...eventPayload,
            data: liveSummaryRes.responseObject,
          });
        }
      } catch (err) {
        console.error('Error broadcasting Operations Director dashboard update:', err);
      }
    });
  });

  isRegistered = true;
};
