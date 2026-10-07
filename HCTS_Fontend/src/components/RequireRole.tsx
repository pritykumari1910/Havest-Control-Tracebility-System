import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import type { ReactNode } from "react";

export default function RequireRole({ roles, children }: { roles: string | string[]; children: ReactNode }) {
  const { hasAnyRole, loading, session } = useAuth();
  const wanted = Array.isArray(roles) ? roles : [roles];

  // While auth state is loading (rehydration or profile fetch), don't redirect — wait.
  if (loading) return null;

  // If there's no session, send to login/root.
  if (!session) {
    // eslint-disable-next-line no-console
    return <Navigate to="/" replace />;
  }

  // Debug: log roles for troubleshooting
  // eslint-disable-next-line no-console

  // If user doesn't have any of the wanted roles, redirect to root.
  if (!hasAnyRole(wanted as any)) {
    // eslint-disable-next-line no-console
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
