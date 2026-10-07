import type http from 'http';
import type https from 'https';
import { Server as SocketServer } from 'socket.io';
import config from '../../config/config.ts';
import { registerDashboardListener } from '../../events/listeners/dashboard.listener.ts';
import { authenticateSocket, type SocketUser } from './socketAuth.ts';
import { SYSTEM_ADMIN_DASHBOARD_ROOM, OPERATIONS_DIRECTOR_DASHBOARD_ROOM } from './dashboardSocket.ts';

const isSystemAdministrator = (user: SocketUser): boolean => {
  return user.roles.some((role) => role.name === 'System Administrator');
};

const isOperationsDirector = (user: SocketUser): boolean => {
  return user.roles.some((role) => role.name === 'Operations Director' || role.name.toLowerCase().includes('director'));
};

export const initializeSocketServer = (server: http.Server | https.Server): SocketServer => {
  const io = new SocketServer(server, {
    cors: {
      origin: config.cors.origins,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      socket.data.user = await authenticateSocket(socket);
      next();
    } catch (error: any) {
      next(new Error(error?.message || 'Invalid credentials'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;

    if (user && isSystemAdministrator(user)) {
      socket.join(SYSTEM_ADMIN_DASHBOARD_ROOM);
      console.log(`Socket connected: ${socket.id} joined ${SYSTEM_ADMIN_DASHBOARD_ROOM}`);
    }

    if (user && isOperationsDirector(user)) {
      socket.join(OPERATIONS_DIRECTOR_DASHBOARD_ROOM);
      console.log(`Socket connected: ${socket.id} joined ${OPERATIONS_DIRECTOR_DASHBOARD_ROOM}`);
    }

    socket.on('join:dashboard', (dashboardType: string) => {
      const room = dashboardType === 'OperationsDirector' ? OPERATIONS_DIRECTOR_DASHBOARD_ROOM : SYSTEM_ADMIN_DASHBOARD_ROOM;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    });

    console.log(`Socket connected: ${socket.id}`);
  });

  registerDashboardListener(io);
  console.log('Socket.IO initialized');

  return io;
};
