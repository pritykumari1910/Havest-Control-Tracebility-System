import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@/lib/useFetch";
import { db as supabase } from "@/lib/db";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/lib/roles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Wheat, QrCode, ClipboardList, Truck, Activity, Shield } from "lucide-react";
import { OperationsDirectorDashboard } from "@/components/dashboards/operations-director-dashboard";
import { FieldEngineerDashboard } from "@/components/dashboards/field-engineer-dashboard";
import { ReportingUserDashboard } from "@/components/dashboards/reporting-user-dashboard";
import { AdministrativeTeamDashboard } from "@/components/dashboards/administrative-team-dashboard";
import { ReadOnlyDashboard } from "@/components/dashboards/read-only-dashboard";
import { SystemAdminDashboard } from "@/components/dashboards/system-admin-dashboard";
import { Link } from "react-router-dom";


function Dashboard() {
  const { user, roles, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  }

  const isAdmin = roles.includes("system_administrator");
  if (isAdmin) {
    return <SystemAdminDashboard user={user} roles={roles} />;
  }
  if (roles.includes("operations_director") && !isAdmin) {
    return <OperationsDirectorDashboard userEmail={user?.email} />;
  }
  if (roles.includes("field_engineer") && !isAdmin) {
    return <FieldEngineerDashboard userEmail={user?.email} />;
  }
  if (roles.includes("administrative_team") && !isAdmin && !roles.includes("operations_director") && !roles.includes("field_engineer")) {
    return <AdministrativeTeamDashboard userEmail={user?.email} />;
  }
  if (roles.includes("reporting_user") && !isAdmin && !roles.includes("operations_director") && !roles.includes("field_engineer") && !roles.includes("administrative_team")) {
    return <ReportingUserDashboard userEmail={user?.email} />;
  }
  const otherRole = roles.some((r) => ["system_administrator","operations_director","field_engineer","administrative_team","reporting_user","farm_manager","manijero","collection_team","loading_team"].includes(r));
  if (!otherRole && (roles.includes("read_only") || roles.length === 0)) {
    return <ReadOnlyDashboard userEmail={user?.email} />;
  }

  return <DefaultDashboard user={user} roles={roles} />;
}

function DefaultDashboard({ user, roles }: { user: any; roles: string[] }) {


  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [farms, workers, varieties, series, campaigns, crews, pallets] = await Promise.all([
        supabase.from("farms").select("*", { count: "exact", head: true }),
        supabase.from("workers").select("*", { count: "exact", head: true }),
        supabase.from("varieties").select("*", { count: "exact", head: true }),
        supabase.from("qr_series").select("*", { count: "exact", head: true }),
        supabase.from("campaigns").select("*", { count: "exact", head: true }),
        supabase.from("crews").select("*", { count: "exact", head: true }),
        supabase.from("pallet_bins").select("*", { count: "exact", head: true }),
      ]);
      return {
        farms: farms.count ?? 0, workers: workers.count ?? 0,
        varieties: varieties.count ?? 0, series: series.count ?? 0,
        campaigns: campaigns.count ?? 0, crews: crews.count ?? 0, pallets: pallets.count ?? 0,
      };
    },
  });

  const tiles = [
    { label: "Active Farms", value: stats?.farms ?? "—", icon: MapPin, to: "/admin/geography" },
    { label: "Workers", value: stats?.workers ?? "—", icon: Users, to: "/admin/workers" },
    { label: "Varieties", value: stats?.varieties ?? "—", icon: Wheat, to: "/admin/varieties" },
    { label: "QR Series", value: stats?.series ?? "—", icon: QrCode, to: "/qr/series" },
    { label: "Campaigns", value: stats?.campaigns ?? "—", icon: Shield, to: "/admin/campaigns" },
    { label: "Crews", value: stats?.crews ?? "—", icon: ClipboardList, to: "/ops/crews" },
    { label: "Pallet Bins", value: stats?.pallets ?? "—", icon: Activity, to: "/ops/reception" },
    { label: "Dispatch Notes", value: "—", icon: Truck, to: "/ops/dispatch" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight capitalize">Welcome{user?.firstName ? `, ${user.firstName}` : ""}</h1>
          <p className="mt-1 text-muted-foreground">Harvest Control & Traceability System</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {roles.length === 0 ? (
            <Badge variant="outline">No role assigned yet</Badge>
          ) : roles.map((r) => (
            <Badge key={r} variant="secondary">{ROLE_LABELS[r]}</Badge>
          ))}
        </div>
      </div>

      {roles.length === 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-base">Awaiting role assignment</CardTitle>
            <CardDescription>
              A System Administrator needs to assign you an operational role before you can access modules. In the meantime, you have Read-Only access.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {tiles.map(({ label, value, icon: Icon, to }) => (
          <Link key={label} to={to}>
            <Card className="transition hover:border-primary/40 hover:shadow-card">
              <CardContent className="flex items-start justify-between p-5">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
                  <div className="mt-2 font-display text-3xl font-semibold text-foreground">{value}</div>
                </div>
                <Icon className="h-5 w-5 text-primary" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your responsibilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {roles.length === 0 ? (
              <p className="text-sm text-muted-foreground">{ROLE_DESCRIPTIONS.read_only}</p>
            ) : roles.map((r) => (
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

export default Dashboard;
