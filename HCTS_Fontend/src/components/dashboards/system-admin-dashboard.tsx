import { useMemo } from "react";
import { Link } from "react-router-dom";
import { resolveDashboardUserRole } from "@/redux/actions/dashboardActions";
import { useDashboardRealtime } from "@/hooks/useDashboardRealtime";
import { Card, CardContent, CardDescription,  CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Users,
  Wheat,
  QrCode,
  Shield,
  ClipboardList,
  Package,
  Truck,
} from "lucide-react";
import { ROLE_DESCRIPTIONS, ROLE_LABELS,  } from "@/lib/roles";

const fmt = (n?: number | null) => (n == null || Number.isNaN(n) ? "—" : Math.round(n).toLocaleString());

export function SystemAdminDashboard({ user, roles }: { user: any; roles: any; }) {
  // Send the backend role label for the user's currently selected role.
  const userRole = useMemo(() => resolveDashboardUserRole(roles), [roles]);
  const { summary, isLoading, isError, errorMessage, lastEvent} =
    useDashboardRealtime(userRole);

  const tiles = [
    { label: "Farms", value: summary?.activeFarmsCount, icon: MapPin, to: "/admin/geography" },
    { label: "Workers", value: summary?.workersCount, icon: Users, to: "/admin/workers" },
    { label: "Varieties", value: summary?.varietiesCount, icon: Wheat, to: "/admin/varieties" },
    { label: "QR Series", value: summary?.qrSeriesCount, icon: QrCode, to: "/qr/series" },
    { label: "Campaigns", value: summary?.campaignsCount, icon: Shield, to: "/admin/campaigns" },
    { label: "Crews", value: summary?.crewsCount, icon: ClipboardList, to: "/ops/crews" },
    { label: "Pallet Bins", value: summary?.palletBinsCount, icon: Package, to: "/ops/reception" },
    { label: "Dispatch Notes", value: summary?.dispatchNotesCount, icon: Truck, to: "/ops/dispatch" },
  ];

  return (
    <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight capitalize">Welcome{user?.firstName ? `, ${user.firstName}` : ""}</h1>
                <p className="mt-1 text-muted-foreground">Harvest Control & Traceability System</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {roles.length === 0 ? (
                  <Badge variant="outline">No role assigned yet</Badge>
                ) : roles.map((r:any) => (
                  <Badge key={r} variant="secondary">{ROLE_LABELS[r]}</Badge>
                ))}
              </div>
            </div>

      {isError && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {errorMessage || "Failed to load dashboard data."}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {tiles.map(({ label, value, icon: Icon, to }) => (
          <Link key={label} to={to}>
            <Card className="transition hover:border-primary/40 hover:shadow-card">
              <CardContent className="flex items-start justify-between p-5">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
                  <div className="mt-2 font-display text-3xl font-semibold text-foreground">
                    {isLoading && value == null ? "…" : fmt(value)}
                  </div>
                </div>
                <Icon className="h-5 w-5 text-primary" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {lastEvent && (
        <p className="text-xs text-muted-foreground">
          Last update: <span className="font-medium">{lastEvent.entity}</span> {lastEvent.action} ·{" "}
          {new Date(lastEvent.timestamp).toLocaleTimeString()}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          < CardHeader  >
            <CardTitle>Your responsibilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {roles.length === 0 ? (
              <p className="text-sm text-muted-foreground">{ROLE_DESCRIPTIONS.read_only}</p>
            ) : roles.map((r:any) => (
              <div key={r}>
                <div className="font-medium">{ROLE_LABELS[r]}</div>
                <p className="text-sm text-muted-foreground">{ROLE_DESCRIPTIONS[r]}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Getting started</CardTitle>
            <CardDescription>Recommended setup order for a new deployment</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              {[
                "Create the active campaign (Admin › Campaigns)",
                "Add farms, plots, valves and parks (Admin › Farms & Geography)",
                "Register varieties and assign them to plots (Admin › Varieties)",
                "Register employment companies and workers (Admin › Workers)",
                "Generate the first QR series (QR Management › Series)",
                "Start creating daily crews and harvest assignments (Operations)",
              ].map((t, i) => (
                <li key={t} className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-medium text-primary">{i + 1}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
