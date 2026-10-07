import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import type { ReactNode } from "react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  // Debug logging to help trace redirect issues
  // eslint-disable-next-line no-console

  // While auth state is loading, avoid redirecting — wait for session to resolve
  if (loading) return null;

  if (!session) {
    // eslint-disable-next-line no-console
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
