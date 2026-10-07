import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux";
import type { Database } from "@/integrations/supabase/types";
import { normalizeUserRoles } from "@/lib/roles";

export type AppRole = Database["public"]["Enums"] extends { app_role: infer R }
  ? R
  : "system_administrator" | "operations_director" | "field_engineer" | "farm_manager"
    | "manijero" | "collection_team" | "loading_team" | "administrative_team"
    | "reporting_user" | "read_only";

export function useAuth() {
  const auth = useSelector((state: RootState) => state.auth);
  const user = auth.userInfo;
  const activeRole = (auth.activeRole ?? null) as AppRole | null;

  // derive session synchronously from the store to avoid a render race
  const session = user ? { user } : null;

  // Respect redux-persist rehydration state to avoid redirecting before persistence restores
  const rehydrated = useSelector((state: any) => state?._persist?.rehydrated ?? true);
  const loading = auth.isLoading || !rehydrated;

  // `allRoles` = every role granted to the user. Computed synchronously so it is
  // correct on the very first render — deriving it in an effect leaves it empty
  // for one render, which makes RequireRole redirect to login before roles load.
  const allRoles = useMemo<AppRole[]>(
    () => (user ? (normalizeUserRoles(user) as AppRole[]) : []),
    [user],
  );

  // Effective session roles: once a user with several roles has picked one, the
  // whole app (sidebar, RequireRole, dashboards) sees only that role.
  const roles = useMemo<AppRole[]>(() => {
    if (activeRole && allRoles.includes(activeRole)) return [activeRole];
    return allRoles;
  }, [activeRole, allRoles]);

  // The user must pick a role when they hold more than one and haven't chosen.
  const needsRoleSelection = allRoles.length > 1 && !activeRole;

  const hasRole = (r: AppRole) => roles.includes(r);
  const hasAnyRole = (rs: AppRole[]) => {
    if (!rs || rs.length === 0) return false;
    return rs.some((role) => roles.includes(role));
  };

  return {
    session,
    user,
    roles,
    allRoles,
    activeRole,
    needsRoleSelection,
    hasRole,
    hasAnyRole,
    loading,
  };
}
