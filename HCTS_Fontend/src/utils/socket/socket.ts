import { io, type Socket } from "socket.io-client";
import { baseURL, getStoredToken } from "@/utils/axios/axiosInstance";

// The Socket.IO server is mounted on the same host as the REST API but at the
// host root (default `/socket.io` path) — the REST API lives under `/api`.
const socketURL = (baseURL || "").replace(/\/api\/?$/, "");

// Event emitted by the backend to the System Administrator dashboard room on any data change.
export const DASHBOARD_REFRESH_EVENT = "dashboard:refresh";

export type DashboardRefreshPayload = {
  entity: string;
  action: string;
  timestamp: string;
};

let socket: Socket | null = null;

/**
 * Returns a lazily-created, shared Socket.IO connection.
 *
 * `auth` is a FUNCTION, not a static object: Socket.IO invokes it on every
 * connect/reconnect attempt, so the current access token is read fresh each
 * time. This is what lets a socket that first tried to connect before login
 * (empty token → rejected) succeed automatically once the token is stored —
 * without needing a page/HMR reload.
 */
export const getSocket = (): Socket => {
  if (socket) return socket;

  socket = io(socketURL, {
    autoConnect: false,
    withCredentials: true,
    transports: ["websocket", "polling"],
    auth: (cb) => cb({ token: getStoredToken("accesstoken") ?? "" }),
  });

  socket.on("connect_error", (err) => {
    console.error("[socket] connect_error:", err.message);
  });

  return socket;
};

export const connectSocket = (): Socket => {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};
