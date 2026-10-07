import { createAsyncThunk } from "@reduxjs/toolkit";
import { getDashboardData } from "@/apis/dashboard";
import { ROLE_LABELS } from "@/lib/roles";

// Matches the backend DashboardSummary shape returned by GET /dashboard.
export interface DashboardSummary {
  activeFarmsCount: number;
  workersCount: number;
  varietiesCount: number;
  campaignsCount: number;
  crewsCount: number;
  palletBinsCount: number;
  dispatchNotesCount: number;
  qrSeriesCount: number;
}

// The backend requires the exact role label as the `userRole` query param.
export const SYSTEM_ADMINISTRATOR_ROLE = "System Administrator";

// Highest-to-lowest priority used to pick a single dashboard role when the user
// holds several. Mirrors the role precedence in the dashboard page router.
const DASHBOARD_ROLE_PRIORITY = [
  "system_administrator",
  "operations_director",
  "field_engineer",
  "administrative_team",
  "reporting_user",
  "read_only",
];

/**
 * Resolve the backend `userRole` label from the user's selected role(s).
 * `roles` are canonical keys (e.g. "system_administrator"); the backend expects
 * the display label (e.g. "System Administrator"). Falls back to System
 * Administrator so the request always carries a valid role.
 */
export const resolveDashboardUserRole = (roles?: string[] | null): string => {
  const list = Array.isArray(roles) ? roles : [];
  const key = DASHBOARD_ROLE_PRIORITY.find((r) => list.includes(r)) ?? list[0];
  return (key && ROLE_LABELS[key]) || SYSTEM_ADMINISTRATOR_ROLE;
};

export const getDashboardDataAction = createAsyncThunk<
  DashboardSummary,
  { userRoleId?: string } | undefined
>("dashboard/getData", async (params, { rejectWithValue }) => {
  try {
    const userRoleId = params?.userRoleId ?? SYSTEM_ADMINISTRATOR_ROLE;
    const data = await getDashboardData({ userRoleId });
    const summary = data?.responseObject ?? data?.data ?? data;
    return summary as DashboardSummary;
  } catch (error: any) {
    return rejectWithValue(error?.message || "Failed to load dashboard data");
  }
});
