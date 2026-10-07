import { use, useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux";
import { getDashboardDataAction } from "@/redux/actions/dashboardActions";
import { dashboardEventReceived } from "@/redux/slices/dashboardSlice";
import { getStoredToken } from "@/utils/axios/axiosInstance";
import {
  connectSocket,
  disconnectSocket,
  DASHBOARD_REFRESH_EVENT,
  type DashboardRefreshPayload,
} from "@/utils/socket/socket";

/**
 * Loads dashboard data for the given role and keeps it live over the socket.
 *
 * The socket is a shared app-wide singleton, so this hook must NOT disconnect it
 * on unmount — several components (header, dashboard) use it at once, and killing
 * the connection for one aborts it for the others (and any in-flight handshake).
 * On unmount we only remove our own listeners; the connection is closed only when
 * the access token is gone (logout). It connects only once a token exists — the
 * backend rejects a token-less handshake ("closed before established").
 */
export function useDashboardRealtime(userRole?: string) {
  const dispatch = useDispatch<AppDispatch>();
  const dashboard = useSelector((state: RootState) => state.dashboard);
  // Re-evaluate connection whenever auth state flips (login / logout / refresh).
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const hasToken = !!getStoredToken("accesstoken");
  const canConnect = hasToken || isAuthenticated;

  const [live, setLive] = useState(false);
  // Coalesce bursts of refresh events into a single re-fetch.
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refetch = useCallback(() => {
    dispatch(getDashboardDataAction(userRole ? { userRoleId:userRole } : undefined));
  }, [dispatch, userRole]);

  // Keep the socket handler pointed at the latest refetch without re-subscribing.
  const refetchRef = useRef(refetch);
  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  // Initial load, and re-fetch whenever the selected role switches.
  useEffect(() => {
    if (canConnect) refetch();
  }, [refetch, canConnect]);

  // Real-time refresh subscription — active only while logged in.
  useEffect(() => {
    if (!canConnect) {
      setLive(false);
      disconnectSocket();
      return;
    }

    const socket = connectSocket();

  
    const onConnect = () =>{ 
      setLive(true);}
    const onDisconnect = () => setLive(false);
    const onRefresh = (payload: DashboardRefreshPayload) => {


      console.log(userRole, "Dashboard refresh event received:", payload);
      dispatch(getDashboardDataAction(userRole ? { userRoleId:userRole } : undefined));
      dispatch(dashboardEventReceived(payload));



      if (refetchTimer.current) clearTimeout(refetchTimer.current);
      refetchTimer.current = setTimeout(() => refetchRef.current(), 400);
    };

    socket.on("connect", onConnect,);
    socket.on("disconnect", onDisconnect);
    socket.on(DASHBOARD_REFRESH_EVENT, onRefresh);
    setLive(socket.connected);
      console.log("socket",socket)
    return () => {
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
      // Only remove THIS component's listeners — keep the shared connection
      // alive for other consumers of the hook.
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off(DASHBOARD_REFRESH_EVENT, onRefresh);
    };
  }, [dispatch, canConnect]);

  return { ...dashboard, live, refetch };
}
