import { useMemo } from "react";
import { useQuery } from "@/lib/useFetch";
import { Link } from "@/lib/router-compat";
import { db as supabase } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Activity, Truck, ClipboardList, Users, Package, QrCode, Wheat,
  Building2, AlertTriangle, Radio, Boxes, ScanSearch, LineChart as LineIcon,
  TrendingUp, Send, CheckCircle2, Eye,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Legend, PieChart as RePieChart, Pie, Cell,
} from "recharts";
import { PageHeader, StatTile, SectionHeader, EmptyState } from "@/components/enterprise/page-shell";

const REFRESH_MS = 30_000;
const CHART_COLORS = ["var(--primary)","var(--success)","var(--warning)","var(--destructive)","var(--accent)","var(--muted-foreground)"];

const fmt = (n?: number | null) => n == null || Number.isNaN(n) ? "—" : Math.round(n).toLocaleString();
const fmtT = (kg?: number) => !kg ? "0" : (kg / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 });

export function ReportingUserDashboard({ userEmail }: { userEmail?: string | null }) {
  const today = new Date().toISOString().slice(0, 10);

  const { data: campaign } = useQuery({
    queryKey: ["ru-campaign"],
    queryFn: async () => {
      const { data } = await supabase.from("campaigns").select("id, name, status").eq("status", "active").maybeSingle();
      return data as { id: string; name: string; status: string } | null;
    },
  });

  const { data: kpi, isFetching, refetch } = useQuery({
    queryKey: ["ru-kpi", today, campaign?.id],
    refetchInterval: REFRESH_MS,
    queryFn: async () => {
      const eq = (q: any) => (campaign?.id ? q.eq("campaign_id", campaign.id) : q);
      const [farms, crews, pickers, satellite, cps, binsToday, binsAll, openDispatch, doneDispatch, incidents] = await Promise.all([
        supabase.from("farms").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("crews").select("*", { count: "exact", head: true }).eq("work_date", today),
        supabase.from("crew_pickers").select("*", { count: "exact", head: true }),
        supabase.from("satellite_staff_entries").select("*", { count: "exact", head: true }).eq("work_date", today),
        supabase.from("destination_centres").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("pallet_bins").select("*", { count: "exact", head: true }).eq("work_date", today),
        eq(supabase.from("pallet_bins").select("*", { count: "exact", head: true })),
        supabase.from("dispatch_notes").select("*", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("dispatch_notes").select("*", { count: "exact", head: true }).eq("status", "dispatched"),
        supabase.from("pallet_incidents").select("*", { count: "exact", head: true }).gte("registered_at", `${today}T00:00:00Z`),
      ]);

      // Forecast progress
      const { data: fc } = await supabase.from("forecasts").select("estimated_kg").eq("status", "validated");
      const forecastKg = (fc ?? []).reduce((a: number, b: any) => a + Number(b.estimated_kg || 0), 0);
      const actualKg = (binsAll.count ?? 0) * 300; // reference 300 kg / bin

      return {
        farms: farms.count ?? 0,
        crews: crews.count ?? 0,
        pickers: pickers.count ?? 0,
        satellite: satellite.count ?? 0,
        cps: cps.count ?? 0,
        binsToday: binsToday.count ?? 0,
        openDispatch: openDispatch.count ?? 0,
        doneDispatch: doneDispatch.count ?? 0,
        incidents: incidents.count ?? 0,
        kgToday: (binsToday.count ?? 0) * 300,
        forecastKg,
        actualKg,
      };
    },
  });

  // Harvest trend 14 days
  const { data: trend } = useQuery({
    queryKey: ["ru-trend"],
    refetchInterval: REFRESH_MS,
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - 13);
      const { data } = await supabase.from("pallet_bins").select("work_date").gte("work_date", since.toISOString().slice(0, 10));
      const map = new Map<string, number>();
      (data ?? []).forEach((r: any) => { if (r.work_date) map.set(r.work_date, (map.get(r.work_date) ?? 0) + 1); });
      const days: { date: string; kg: number }[] = [];
      for (let i = 0; i < 14; i++) {
        const d = new Date(); d.setDate(d.getDate() - (13 - i));
        const key = d.toISOString().slice(0, 10);
        days.push({ date: key.slice(5), kg: (map.get(key) ?? 0) * 300 });
      }
      return days;
    },
  });

  // Weekly harvest (last 8 weeks)
  const { data: weekly } = useQuery({
    queryKey: ["ru-weekly"],
    refetchInterval: REFRESH_MS,
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - 55);
      const { data } = await supabase.from("pallet_bins").select("work_date").gte("work_date", since.toISOString().slice(0, 10));
      const buckets = new Map<string, number>();
      (data ?? []).forEach((r: any) => {
        if (!r.work_date) return;
        const d = new Date(r.work_date);
        const monday = new Date(d); monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
        const key = monday.toISOString().slice(5, 10);
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
      });
      return Array.from(buckets, ([week, bins]) => ({ week, kg: bins * 300 }));
    },
  });

  const { data: farmPerf } = useQuery({
    queryKey: ["ru-farm-perf", today],
    refetchInterval: REFRESH_MS,
    queryFn: async () => {
      const { data } = await supabase.from("pallet_bins").select("farms(name)").eq("work_date", today);
      const agg = new Map<string, number>();
      (data ?? []).forEach((r: any) => {
        const n = r.farms?.name ?? "—"; agg.set(n, (agg.get(n) ?? 0) + 1);
      });
      return Array.from(agg, ([name, bins]) => ({ name, kg: bins * 300 }))
        .sort((a, b) => b.kg - a.kg).slice(0, 6);
    },
  });

  const { data: varietyDist } = useQuery({
    queryKey: ["ru-variety-dist", today],
    refetchInterval: REFRESH_MS,
    queryFn: async () => {
      const { data } = await supabase.from("pallet_bins").select("varieties(name)").eq("work_date", today);
      const agg = new Map<string, number>();
      (data ?? []).forEach((r: any) => {
        const n = r.varieties?.name ?? "—"; agg.set(n, (agg.get(n) ?? 0) + 1);
      });
      return Array.from(agg, ([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value).slice(0, 6);
    },
  });

  // Collection point activity (bins per machine today)
  const { data: cpActivity } = useQuery({
    queryKey: ["ru-cp-activity", today],
    refetchInterval: REFRESH_MS,
    queryFn: async () => {
      const { data } = await supabase
        .from("pallet_bins")
        .select("machines(name)")
        .eq("work_date", today);
      const agg = new Map<string, number>();
      (data ?? []).forEach((r: any) => {
        const n = r.machines?.name ?? "—"; agg.set(n, (agg.get(n) ?? 0) + 1);
      });
      return Array.from(agg, ([name, bins]) => ({ name, bins })).sort((a, b) => b.bins - a.bins).slice(0, 6);
    },
  });

  const forecastProgress = useMemo(() => {
    if (!kpi?.forecastKg) return 0;
    return Math.min(100, (kpi.actualKg / kpi.forecastKg) * 100);
  }, [kpi]);

  const trendMax = useMemo(() => Math.max(1, ...((trend ?? []).map((d) => d.kg))), [trend]);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Reporting"
        title="Executive Monitoring"
        description={userEmail ? `Read-only operational overview · ${userEmail}` : "Read-only operational overview of the active campaign."}
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
            <Badge variant="secondary" className="gap-1 text-[10px]"><Eye className="h-3 w-3" /> Read only</Badge>
          </div>
        }
      />

      {/* Top KPI cards */}
      <div>
        <SectionHeader title="Executive KPIs" description="Live snapshot of campaign and today's activity" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
          <StatTile label="Campaign" value={campaign?.name ?? "—"} sub={campaign?.status ?? ""} icon={CheckCircle2} tone="success" />
          <StatTile label="Today's harvest" value={`${fmtT(kpi?.kgToday)} t`} sub={`${fmt(kpi?.kgToday)} kg`} icon={Wheat} tone="success" />
          <StatTile label="Forecast progress" value={`${forecastProgress.toFixed(1)}%`} sub={`${fmtT(kpi?.actualKg)} / ${fmtT(kpi?.forecastKg)} t`} icon={TrendingUp} />
          <StatTile label="Active farms" value={fmt(kpi?.farms)} icon={Building2} />
          <StatTile label="Active crews" value={fmt(kpi?.crews)} icon={Users} />
          <StatTile label="Active pickers" value={fmt(kpi?.pickers)} icon={Users} />
          <StatTile label="Satellite staff" value={fmt(kpi?.satellite)} icon={Users} />
          <StatTile label="Collection points" value={fmt(kpi?.cps)} icon={Boxes} />
          <StatTile label="Pallet bins today" value={fmt(kpi?.binsToday)} icon={Package} />
          <StatTile label="Open dispatch notes" value={fmt(kpi?.openDispatch)} icon={Send} tone="warning" />
          <StatTile label="Completed dispatches" value={fmt(kpi?.doneDispatch)} icon={Truck} tone="success" />
          <StatTile label="Operational incidents" value={fmt(kpi?.incidents)} icon={AlertTriangle} tone={kpi?.incidents ? "warning" : "default"} />
        </div>
      </div>

      {/* Forecast progress bar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider">Forecast vs Actual — campaign</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-display text-2xl font-semibold tabular-nums">{forecastProgress.toFixed(1)}%</span>
          </div>
          <Progress value={forecastProgress} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Actual: <b className="text-foreground">{fmtT(kpi?.actualKg)} t</b></span>
            <span>Forecast: <b className="text-foreground">{fmtT(kpi?.forecastKg)} t</b></span>
          </div>
        </CardContent>
      </Card>

      {/* Charts row 1 */}
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

      {/* Charts row 2 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider">Weekly harvest — last 8 weeks</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {(weekly?.length ?? 0) === 0 ? (
              <EmptyState title="No weekly activity yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly ?? []}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `${Math.round(v/1000)}t`} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", fontSize: 12 }} />
                  <Bar dataKey="kg" fill="var(--primary)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider">Collection point activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(cpActivity?.length ?? 0) === 0 ? (
              <EmptyState title="No collection today" />
            ) : cpActivity!.map((c) => {
              const pct = Math.min(100, (c.bins / Math.max(1, cpActivity![0].bins)) * 100);
              return (
                <div key={c.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{c.name}</span>
                    <span className="tabular-nums text-muted-foreground">{c.bins} bins</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Farm performance */}
      <Card>
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

      {/* Quick monitoring links */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider">Quick monitoring</CardTitle>
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

function QuickLink({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link to={to}>
      <Button variant="outline" size="sm" className="w-full justify-start gap-2">
        <Icon className="h-4 w-4 text-primary" /> {label}
      </Button>
    </Link>
  );
}
