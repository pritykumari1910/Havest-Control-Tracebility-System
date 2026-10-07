export const ROLE_LABELS: Record<string, string> = {
  system_administrator: "System Administrator",
  operations_director: "Operations Director",
  field_engineer: "Field Engineer",
  farm_manager: "Farm Manager",
  manijero: "Manijero / Crew Supervisor",
  collection_team: "Collection Team",
  loading_team: "Loading Team",
  administrative_team: "Administrative Team",
  reporting_user: "Reporting User",
  read_only: "Read-Only User",
};

// Portal each role belongs to (mirrors the backend role seeder's roleType).
// Only web-portal roles may operate the web portal; app-portal roles exist for
// the mobile app and are hidden from web-only flows like role selection.
export const ROLE_PORTAL: Record<string, "web" | "app"> = {
  system_administrator: "web",
  operations_director: "web",
  field_engineer: "web",
  administrative_team: "web",
  reporting_user: "web",
  read_only: "web",
  farm_manager: "app",
  manijero: "app",
  collection_team: "app",
  loading_team: "app",
};

export const isWebRole = (roleKey: string) => ROLE_PORTAL[roleKey] === "web";

/**
 * Normalize a user's `roles` (or legacy `role`) into a list of role keys that
 * match the keys used in ROLE_LABELS (snake_case). Accepts arrays of strings or
 * role objects ({ name | role | roleType }).
 */
// Reverse lookup of a role's display label (e.g. "Read-Only User") back to its
// canonical key ("read_only"). Punctuation/spacing is ignored so backend names
// like "Read-Only User" or "Manijero / Crew Supervisor" map correctly.
const canonical = (value: string) => value.toString().toLowerCase().replace(/[^a-z0-9]+/g, "");
const LABEL_TO_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(ROLE_LABELS).map(([key, label]) => [canonical(label), key]),
);

export function normalizeUserRoles(user: any): string[] {
  if (!user) return [];

  const toKey = (value: string) => {
    const raw = value.toString().trim();
    // Prefer matching a known role label (handles hyphens, slashes, etc.).
    const byLabel = LABEL_TO_KEY[canonical(raw)];
    if (byLabel) return byLabel;
    return raw.toLowerCase().replace(/\s+/g, "_");
  };

  const rawRoles = user?.roles;
  const result: string[] = [];

  if (Array.isArray(rawRoles)) {
    for (const roleItem of rawRoles) {
      if (!roleItem) continue;
      if (typeof roleItem === "string") {
        result.push(toKey(roleItem));
        continue;
      }
      const label = roleItem.name || roleItem.role || roleItem?.roleType;
      if (typeof label === "string") result.push(toKey(label));
    }
  } else if (typeof user?.role === "string") {
    result.push(toKey(user.role));
  }

  // de-duplicate while preserving order
  return Array.from(new Set(result.filter(Boolean)));
}

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  system_administrator: "Manages all system configuration, user accounts, masters, and full audit access.",
  operations_director: "Oversees complete harvest operation with all KPIs, reports and economic data.",
  field_engineer: "Corrects closed records with audit trail, resolves unassigned bins, reviews variety changes.",
  farm_manager: "Creates daily crews, harvest assignments, closes the daily report (parte diario).",
  manijero: "Same daily field operations as Farm Manager; confirms mid-day variety changes.",
  collection_team: "Opens reception batches, scans pallet bin QRs, logs incidents.",
  loading_team: "Creates dispatch notes and load transfer orders, generates Albarán de Entrega.",
  administrative_team: "Manages buyer-side documentation (activated in Phase 2).",
  reporting_user: "View-only operational dashboards. No economic data.",
  read_only: "Restricted view-only access as configured by the administrator.",
};
