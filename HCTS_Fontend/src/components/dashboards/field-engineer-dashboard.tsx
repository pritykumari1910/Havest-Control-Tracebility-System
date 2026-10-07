import { useMemo } from "react";
import { useQuery } from "@/lib/useFetch";
import { Link } from "@/lib/router-compat";
import { db as supabase } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity, Truck, ClipboardList, Users, Package, QrCode, Wheat,
  Building2, AlertTriangle, Wrench, Replace, Radio, Boxes, ScanSearch,
  ArrowUpRight, RefreshCcw, LineChart as LineIcon,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Legend, PieChart as RePieChart, Pie, Cell,
} from "recharts";
import { PageHeader, StatTile, SectionHeader, EmptyState } from "@/components/enterprise/page-shell";

const REFRESH_MS = 30_000;
const CHART_COLORS = ["var(--primary)","var(--success)","var(--warning)","var(--destructive)","var(--accent)","var(--muted-foreground)"];

function fmt(n?: number | null) {
  if (n == null || Number.isNaN(n)) return "—";
  return Math.round(n).toLocaleString();
}
function fmtT(kg?: number) { if (!kg) return "0"; return (kg / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 }); }

export function FieldEngineerDashboard({ userEmail }: { userEmail?: string | null }) {
  const today = new Date().toISOString().slice(0, 10);

  const { data: campaign } = useQuery({
    queryKey: ["fe-campaign"],
    queryFn: async () => {
      const { data } = await supabase.from("campaigns").select("id, name, status").eq("status", "active").maybeSingle();
      return data as { id: string; name: string; status: string } | null;
    },
  });

  const { data: kpi, isFetching, refetch } = useQuery({
    queryKey: ["fe-kpi", today, campaign?.id],
    refetchInterval: REFRESH_MS,
    queryFn: async () => {
      const eq = (q: any) => (campaign?.id ? q.eq("campaign_id", campaign.id) : q);
      const [farms, crews, pickers, openA, closedA, cps, receivedBins, unassigned, dispatches, incidents, varietyChanges, corrections, satelliteStaff] = await Promise.all([
        supabase.from("farms").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("crews").select("*", { count: "exact", head: true }).eq("work_date", today),
        supabase.from("crew_pickers").select("*", { count: "exact", head: true }),
        eq(supabase.from("harvest_assignments").select("*", { count: "exact", head: true }).eq("status", "active")),
        eq(supabase.from("harvest_assignments").select("*", { count: "exact", head: true }).eq("status", "closed")),
        supabase.from("destination_centres").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("pallet_bins").select("*", { count: "exact", head: true }).eq("work_date", today),
        supabase.from("pallet_bins").select("*", { count: "exact", head: true }).eq("is_unassigned", true),
        supabase.from("dispatch_notes").select("*", { count: "exact", head: true }),
        supabase.from("pallet_incidents").select("*", { count: "exact", head: true }).gte("registered_at", `${today}T00:00:00Z`),
        supabase.from("audit_log").select("*", { count: "exact", head: true }).eq("record_type", "variety_change"),
        supabase.from("audit_log").select("*", { count: "exact", head: true }).eq("action", "correction"),
        supabase.from("satellite_staff_entries").select("*", { count: "exact", head: true }).eq("work_date", today),
      ]);

      const binsToday = receivedBins.count ?? 0;
      const kg = binsToday * 300; // reference 300 kg / bin


      return {
        farms: farms.count ?? 0,
        crews: crews.count ?? 0,
        pickers: pickers.count ?? 0,
        satellite: satelliteStaff.count ?? 0,
        openA: openA.count ?? 0,
        closedA: closedA.count ?? 0,
        cps: cps.count ?? 0,
        received: receivedBins.count ?? 0,
        unassigned: unassigned.count ?? 0,
        dispatches: dispatches.count ?? 0,
        incidents: incidents.count ?? 0,
        varietyChanges: varietyChanges.count ?? 0,
        corrections: corrections.count ?? 0,
        kg,
      };
    },
  });

  // Harvest trend last 14 days (bin count)
  const { data: trend } = useQuery({
    queryKey: ["fe-trend"],
    refetchInterval: REFRESH_MS,
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - 13);
      const iso = since.toISOString().slice(0, 10);
      const { data } = await supabase.from("pallet_bins").select("work_date").gte("work_date", iso);
      const map = new Map<string, number>();
      (data ?? []).forEach((r: any) => {
        if (!r.work_date) return;
        map.set(r.work_date, (map.get(r.work_date) ?? 0) + 1);
      });
      const days: { date: string; kg: number }[] = [];
      for (let i = 0; i < 14; i++) {
        const d = new Date(); d.setDate(d.getDate() - (13 - i));
        const key = d.toISOString().slice(0, 10);
        days.push({ date: key.slice(5), kg: (map.get(key) ?? 0) * 300 });
      }
      return days;
    },
  });

  // Farm performance today (top 6)
  const { data: farmPerf } = useQuery({
    queryKey: ["fe-farm-perf", today],
    refetchInterval: REFRESH_MS,
    queryFn: async () => {
      const { data } = await supabase
        .from("pallet_bins")
        .select("farms(name)")
        .eq("work_date", today);
      const agg = new Map<string, number>();
      (data ?? []).forEach((r: any) => {
        const name = r.farms?.name ?? "—";
        agg.set(name, (agg.get(name) ?? 0) + 1);
      });
      return Array.from(agg, ([name, bins]) => ({ name, kg: bins * 300 }))
        .sort((a, b) => b.kg - a.kg).slice(0, 6);
    },
  });

  // Variety distribution today
  const { data: varietyDist } = useQuery({
    queryKey: ["fe-variety-dist", today],
    refetchInterval: REFRESH_MS,
    queryFn: async () => {
      const { data } = await supabase
        .from("pallet_bins")
        .select("varieties(name)")
        .eq("work_date", today);
      const agg = new Map<string, number>();
      (data ?? []).forEach((r: any) => {
        const name = r.varieties?.name ?? "—";
        agg.set(name, (agg.get(name) ?? 0) + 1);
      });
      return Array.from(agg, ([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value).slice(0, 6);
    },
  });

  // Recent incidents (5)
  const { data: recentIncidents } = useQuery({
    queryKey: ["fe-incidents"],
    refetchInterval: REFRESH_MS,
    queryFn: async () => {
      const { data } = await supabase
        .from("pallet_incidents")
        .select("id, category, comment, registered_at, pallet_bins(qr_code_id, farms(name))")
        .order("registered_at", { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  const totalToday = kpi?.kg ?? 0;
  const trendMax = useMemo(() => Math.max(1, ...((trend ?? []).map((d) => d.kg))), [trend]);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Field Engineering"
        title="Field Engineer Workspace"
        description={userEmail ? `Signed in as ${userEmail} · maintain operational accuracy and data integrity.` : "Maintain operational accuracy and data integrity across the harvest."}
        live
        isFetching={isFetching}
        onRefresh={() => refetch()}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 text-[10px]">
              <span className="text-muted-foreground">Campaign</span>
              <span className="font-medium text-foreground">{campaign?.name ?? "—"}</span>
            </Badge>
            <Badge variant="outline" className="text-[10px]">{new Date().toLocaleDateString()}</Badge>
          </div>
        }
      />

      {/* Priority actions */}
      <div className="grid gap-3 md:grid-cols-3">
        <ActionCard
          to="/ops/corrections"
          icon={Wrench}
          tone="warning"
          title="Closed record corrections"
          count={kpi?.corrections ?? 0}
          hint="Review and amend closed assignments"
        />
        <ActionCard
          to="/ops/unassigned"
          icon={Package}
          tone="danger"
          title="Unassigned bins"
          count={kpi?.unassigned ?? 0}
          hint="Match orphan pallets to assignments"
        />
        <ActionCard
          to="/ops/variety-changes"
          icon={Replace}
          tone="default"
          title="Variety change reviews"
          count={kpi?.varietyChanges ?? 0}
          hint="Approve mid-day variety changes"
        />
      </div>

      {/* KPI grid */}
      <div>
        <SectionHeader title="Operational KPIs" description="Live snapshot of today's harvest" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
          <StatTile label="Today's harvest" value={`${fmtT(totalToday)} t`} sub={`${fmt(totalToday)} kg`} icon={Wheat} tone="success" />
          <StatTile label="Active farms" value={fmt(kpi?.farms)} icon={Building2} />
          <StatTile label="Active crews" value={fmt(kpi?.crews)} icon={Users} />
          <StatTile label="Active pickers" value={fmt(kpi?.pickers)} icon={Users} />
          <StatTile label="Satellite workers" value={fmt(kpi?.satellite)} icon={Users} />
          <StatTile label="Open assignments" value={fmt(kpi?.openA)} icon={ClipboardList} tone="warning" />
          <StatTile label="Closed assignments" value={fmt(kpi?.closedA)} icon={ClipboardList} tone="success" />
          <StatTile label="Collection points" value={fmt(kpi?.cps)} icon={Boxes} />
          <StatTile label="Received bins" value={fmt(kpi?.received)} icon={Activity} />
          <StatTile label="Unassigned bins" value={fmt(kpi?.unassigned)} icon={Package} tone={kpi?.unassigned ? "danger" : "default"} />
          <StatTile label="Dispatch notes" value={fmt(kpi?.dispatches)} icon={Truck} />
          <StatTile label="Incidents (today)" value={fmt(kpi?.incidents)} icon={AlertTriangle} tone={kpi?.incidents ? "warning" : "default"} />
          <StatTile label="Post-closure corrections" value={fmt(kpi?.corrections)} icon={Wrench} tone="warning" />
          <StatTile label="Variety change requests" value={fmt(kpi?.varietyChanges)} icon={Replace} />
          <StatTile label="QR traceability" value="Ready" sub="Search any bin" icon={QrCode} />
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-semibold uppercase tracking-wider">
              <span className="flex items-center gap-2"><LineIcon className="h-4 w-4 text-primary" /> Daily harvest — 14 days</span>
              <Badge variant="outline" className="text-[10px]">Peak {fmt(trendMax)} kg</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend ?? []}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `${Math.round(v/1000)}t`} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", fontSize: 12 }} />
                <Line type="monotone" dataKey="kg" stroke="var(--primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider">Variety distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {(varietyDist?.length ?? 0) === 0 ? (
              <EmptyState title="No production yet today" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={varietyDist ?? []} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {(varietyDist ?? []).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </RePieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider">Farm performance — today</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {(farmPerf?.length ?? 0) === 0 ? (
              <EmptyState title="No farm activity yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={farmPerf ?? []} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `${Math.round(v/1000)}t`} />
                  <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={11} width={110} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", fontSize: 12 }} />
                  <Bar dataKey="kg" fill="var(--primary)" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4 text-warning" /> Recent incidents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(recentIncidents?.length ?? 0) === 0 ? (
              <EmptyState title="No incidents recorded" />
            ) : recentIncidents!.map((i: any) => (
              <div key={i.id} className="rounded-md border border-border/70 p-2 text-xs">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px]">{i.category ?? "incident"}</Badge>
                  <span className="text-[10px] text-muted-foreground">{new Date(i.registered_at).toLocaleTimeString()}</span>
                </div>
                <div className="mt-1 line-clamp-2 text-foreground">{i.comment ?? "—"}</div>
                <div className="mt-1 text-[10px] text-muted-foreground">{i.pallet_bins?.farms?.name ?? "—"}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider">Quick access</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-3 lg:grid-cols-6">
          <QuickLink to="/ops/live" icon={Radio} label="Live Operations" />
          <QuickLink to="/reports/progress" icon={ClipboardList} label="Harvest Progress" />
          <QuickLink to="/ops/collection-points" icon={Boxes} label="Collection Points" />
          <QuickLink to="/reports/dispatch-status" icon={Truck} label="Dispatch Status" />
          <QuickLink to="/reports/traceability" icon={QrCode} label="Traceability" />
          <QuickLink to="/reports/qr-search" icon={ScanSearch} label="QR Search" />
        </CardContent>
      </Card>
    </div>
  );
}

function ActionCard({
  to, icon: Icon, tone, title, count, hint,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "default" | "success" | "warning" | "danger";
  title: string; count: number; hint: string;
}) {
  const toneCls =
    tone === "warning" ? "border-warning/40 bg-warning/5" :
    tone === "danger" ? "border-destructive/40 bg-destructive/5" :
    tone === "success" ? "border-success/40 bg-success/5" :
    "border-border";
  const iconCls =
    tone === "warning" ? "text-warning" :
    tone === "danger" ? "text-destructive" :
    tone === "success" ? "text-success" :
    "text-primary";
  return (
    <Link to={to}>
      <Card className={`transition hover:shadow-sm ${toneCls}`}>
        <CardContent className="flex items-center gap-3 p-4">
          <div className={`grid h-11 w-11 place-items-center rounded-md bg-background ${iconCls}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
            <div className="font-display text-2xl font-semibold tabular-nums">{count}</div>
            <div className="text-[11px] text-muted-foreground">{hint}</div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link to={to}>
      <Button variant="outline" size="sm" className="w-full justify-start gap-2">
        <Icon className="h-4 w-4 text-primary" /> {label}
      </Button>
    </Link>
  );
}
