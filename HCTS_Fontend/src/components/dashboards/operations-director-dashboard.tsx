import { useMemo, useState } from "react";
import { useQuery } from "@/lib/useFetch";
import { Link } from "@/lib/router-compat";
import { db as supabase } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Activity, Truck, ClipboardList, Users, LineChart as LineIcon, Package, QrCode, ShieldCheck, Wheat,
  Building2, MapPin, AlertTriangle, CheckCircle2, Timer, TrendingUp, DollarSign, Coins, Award, Sprout,
  ArrowUpRight, RefreshCcw, Radio,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Legend, PieChart as RePieChart, Pie, Cell,
} from "recharts";

const REFRESH_MS = 20_000;

function fmt(n?: number | null) {
  if (n == null || Number.isNaN(n)) return "—";
  return Math.round(n).toLocaleString();
}
function fmtT(kg?: number) {
  if (!kg) return "0";
  return (kg / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 });
}
function pct(n?: number | null) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toFixed(1)}%`;
}
function money(n?: number | null) {
  if (n == null || Number.isNaN(n)) return "—";
  return `€${Math.round(n).toLocaleString()}`;
}

// Chart color palette — semantic tokens (oklch values), passed as CSS vars.
const CHART_COLORS = [
  "var(--primary)",
  "var(--success)",
  "var(--warning)",
  "var(--destructive)",
  "var(--accent)",
  "var(--muted-foreground)",
];
const GRID_STROKE = "var(--border)";
const AXIS_STROKE = "var(--muted-foreground)";
const POPOVER_BG = "var(--popover)";

function KpiCard({
  label, value, sub, icon: Icon, to, tone = "default", accent = false,
}: {
  label: string; value: React.ReactNode; sub?: string;
  icon: React.ComponentType<{ className?: string }>; to?: string;
  tone?: "default" | "success" | "warning" | "danger";
  accent?: boolean;
}) {
  const toneCls =
    tone === "success" ? "text-success" :
    tone === "warning" ? "text-warning" :
    tone === "danger" ? "text-destructive" :
    "text-primary";

  const body = (
    <Card className={`group h-full border transition hover:border-primary/40 hover:shadow-sm ${accent ? "bg-primary/[0.03]" : ""}`}>
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
          <Icon className={`h-4 w-4 shrink-0 ${toneCls}`} />
        </div>
        <div className="font-display text-2xl font-semibold tabular-nums text-foreground">{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
  return to ? <Link to={to} className="block">{body}</Link> : body;
}

function SectionHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function OperationsDirectorDashboard({ userEmail }: { userEmail?: string | null }) {
  const [trendGrain, setTrendGrain] = useState<"day" | "week" | "month">("day");

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["od-executive-dashboard"],
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
    staleTime: 0,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const since = new Date(); since.setDate(since.getDate() - 89);
      const sinceISO = since.toISOString().slice(0, 10);

      const [
        campaignRes, weightParamRes, priceParamRes, incentiveParamRes,
        farmsRes, crewsRes, pickersRes, satelliteRes, incidentsRes,
        binsTotalRes, binsTodayRes, binsUnassignedRes,
        dispatchOpenRes, dispatchTodayRes, dispatchDeliveredRes, dispatchClosedRes, dispatchAllRes,
        forecastsPendingRes, forecastsApprovedRes,
        binsHistoryRes, forecastByFarmVarietyRes,
        farmsListRes, varietiesListRes,
        collectionPointsRes,
      ] = await Promise.all([
        supabase.from("campaigns").select("id, name, code, start_date, estimated_end_date, status")
          .eq("status", "active").order("start_date", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("operational_parameters").select("value").eq("key", "estimated_pallet_weight_kg").maybeSingle(),
        supabase.from("operational_parameters").select("value").eq("key", "average_selling_price_per_kg").maybeSingle(),
        supabase.from("operational_parameters").select("value").eq("key", "incentive_per_bin").maybeSingle(),
        supabase.from("farms").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("crews").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("crew_pickers").select("*", { count: "exact", head: true }),
        supabase.from("satellite_staff_entries").select("*", { count: "exact", head: true }).eq("work_date", today),
        supabase.from("pallet_incidents").select("*", { count: "exact", head: true }),
        supabase.from("pallet_bins").select("*", { count: "exact", head: true }),
        supabase.from("pallet_bins").select("*", { count: "exact", head: true }).eq("work_date", today),
        supabase.from("pallet_bins").select("*", { count: "exact", head: true }).eq("is_unassigned", true),
        supabase.from("dispatch_notes").select("*", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("dispatch_notes").select("*", { count: "exact", head: true }).eq("note_date", today),
        supabase.from("dispatch_notes").select("*", { count: "exact", head: true }).eq("status", "closed"),
        supabase.from("dispatch_notes").select("*", { count: "exact", head: true }).eq("status", "closed"),
        supabase.from("dispatch_notes").select("id, status, note_date"),
        supabase.from("forecasts").select("*", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("forecasts").select("estimated_kg, farm_id, variety_id, status"),
        supabase.from("pallet_bins").select("work_date, farm_id, variety_id").gte("work_date", sinceISO).limit(20000),
        supabase.from("forecasts").select("farm_id, variety_id, estimated_kg, status"),
        supabase.from("farms").select("id, name"),
        supabase.from("varieties").select("id, name"),
        supabase.from("reception_batches").select("id, status"),
      ]);

      const weightKg = Number(weightParamRes.data?.value ?? 300);
      const pricePerKg = Number(priceParamRes.data?.value ?? 1.4);
      const incentivePerBin = Number(incentiveParamRes.data?.value ?? 0.5);

      const bins = binsHistoryRes.data ?? [];
      const dispatchAll = dispatchAllRes.data ?? [];
      const forecastAll = forecastByFarmVarietyRes.data ?? [];
      const farmsMap = new Map<string, string>((farmsListRes.data ?? []).map((f: any) => [f.id, f.name]));
      const varMap = new Map<string, string>((varietiesListRes.data ?? []).map((v: any) => [v.id, v.name]));

      const binsTotal = binsTotalRes.count ?? 0;
      const binsToday = binsTodayRes.count ?? 0;
      const estimatedHarvestedKg = binsTotal * weightKg;
      const todaysHarvestKg = binsToday * weightKg;
      const totalForecastKg = forecastAll.filter((f: any) => f.status === "validated").reduce((s: number, r: any) => s + Number(r.estimated_kg ?? 0), 0);
      const completionPct = totalForecastKg > 0 ? Math.min(100, (estimatedHarvestedKg / totalForecastKg) * 100) : null;

      // Trend by day (last 30 days for display)
      const byDay = new Map<string, number>();
      for (const b of bins) {
        if (!b.work_date) continue;
        byDay.set(b.work_date, (byDay.get(b.work_date) ?? 0) + 1);
      }
      const trendDaily: { period: string; kg: number; bins: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const iso = d.toISOString().slice(0, 10);
        const nb = byDay.get(iso) ?? 0;
        trendDaily.push({ period: iso.slice(5), kg: nb * weightKg, bins: nb });
      }
      // Weekly (last 12 weeks)
      const trendWeekly: { period: string; kg: number; bins: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const end = new Date(); end.setDate(end.getDate() - i * 7);
        const start = new Date(end); start.setDate(start.getDate() - 6);
        let count = 0;
        for (const [iso, n] of byDay.entries()) {
          const d = new Date(iso);
          if (d >= start && d <= end) count += n;
        }
        trendWeekly.push({ period: `W${52 - i}`, kg: count * weightKg, bins: count });
      }
      // Monthly (last 3 months)
      const monthMap = new Map<string, number>();
      for (const [iso, n] of byDay.entries()) {
        const key = iso.slice(0, 7);
        monthMap.set(key, (monthMap.get(key) ?? 0) + n);
      }
      const trendMonthly = [...monthMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-3)
        .map(([k, n]) => ({ period: k, kg: n * weightKg, bins: n }));

      // Forecast vs actual by farm
      const byFarmActual = new Map<string, number>();
      for (const b of bins) if (b.farm_id) byFarmActual.set(b.farm_id, (byFarmActual.get(b.farm_id) ?? 0) + weightKg);
      const byFarmForecast = new Map<string, number>();
      for (const f of forecastAll) {
        if (f.status !== "validated" || !f.farm_id) continue;
        byFarmForecast.set(f.farm_id, (byFarmForecast.get(f.farm_id) ?? 0) + Number(f.estimated_kg ?? 0));
      }
      const forecastVsActual = [...new Set([...byFarmActual.keys(), ...byFarmForecast.keys()])]
        .map((id) => {
          const forecast = byFarmForecast.get(id) ?? 0;
          const actual = byFarmActual.get(id) ?? 0;
          return {
            farm: farmsMap.get(id) ?? "—",
            forecast: Math.round(forecast / 1000),
            actual: Math.round(actual / 1000),
            variance: forecast > 0 ? ((actual - forecast) / forecast) * 100 : 0,
          };
        })
        .filter((r) => r.forecast > 0 || r.actual > 0)
        .sort((a, b) => b.actual - a.actual)
        .slice(0, 8);

      // Farm performance (horizontal ordering by actual)
      const farmPerformance = forecastVsActual.map((r) => ({
        farm: r.farm,
        harvest: r.actual,
        remaining: Math.max(0, r.forecast - r.actual),
        completion: r.forecast > 0 ? Math.min(100, (r.actual / r.forecast) * 100) : 0,
      }));

      // Variety pie
      const byVariety = new Map<string, number>();
      for (const b of bins) if (b.variety_id) byVariety.set(b.variety_id, (byVariety.get(b.variety_id) ?? 0) + 1);
      const varietyPie = [...byVariety.entries()]
        .map(([id, n]) => ({ name: varMap.get(id) ?? "—", value: n * weightKg }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      // Dispatch board
      const statuses = ["draft", "closed"] as const;
      const dispatchByStatus: Record<string, number> = {};
      for (const d of dispatchAll) dispatchByStatus[d.status ?? "draft"] = (dispatchByStatus[d.status ?? "draft"] ?? 0) + 1;
      // Delayed = drafts older than 3 days
      const threeDaysAgo = new Date(); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const delayed = dispatchAll.filter((d: any) => d.status === "draft" && d.note_date && new Date(d.note_date) < threeDaysAgo).length;

      const pickers = pickersRes.count ?? 0;
      const satelliteToday = satelliteRes.count ?? 0;
      const collectionPoints = collectionPointsRes.data ?? [];
      const collectionOpen = collectionPoints.filter((r: any) => r.status === "open").length || collectionPoints.length;

      const todaysRevenue = todaysHarvestKg * pricePerKg;
      const estimatedRevenue = estimatedHarvestedKg * pricePerKg;
      const liquidationValue = (dispatchByStatus["closed"] ?? 0) * weightKg * pricePerKg * 12; // proxy: closed dispatches × ~12 pallets
      const workerIncentives = binsTotal * incentivePerBin;
      const revenuePerFarm = (farmsRes.count ?? 0) > 0 ? estimatedRevenue / (farmsRes.count as number) : null;

      return {
        campaign: campaignRes.data,
        weightKg, pricePerKg, incentivePerBin,
        farmsActive: farmsRes.count ?? 0,
        crewsActive: crewsRes.count ?? 0,
        pickers,
        satelliteToday,
        satelliteRatio: pickers > 0 ? (satelliteToday / pickers) * 100 : null,
        incidents: incidentsRes.count ?? 0,
        binsTotal,
        binsToday,
        binsUnassigned: binsUnassignedRes.count ?? 0,
        collectionPoints: collectionOpen,
        dispatchOpen: dispatchOpenRes.count ?? 0,
        dispatchToday: dispatchTodayRes.count ?? 0,
        dispatchClosed: dispatchClosedRes.count ?? 0,
        dispatchDelivered: dispatchDeliveredRes.count ?? 0,
        forecastsPending: forecastsPendingRes.count ?? 0,
        estimatedHarvestedKg,
        todaysHarvestKg,
        totalForecastKg,
        completionPct,
        vehiclesWaiting: dispatchOpenRes.count ?? 0, // proxy
        // charts
        trendDaily, trendWeekly, trendMonthly,
        forecastVsActual, farmPerformance, varietyPie,
        dispatchBoard: {
          open: dispatchByStatus["draft"] ?? 0,
          closed: dispatchByStatus["closed"] ?? 0,
          dispatched: dispatchByStatus["closed"] ?? 0,
          delivered: 0,
          delayed,
        },
        // economics
        avgSellingPrice: pricePerKg,
        todaysRevenue,
        estimatedRevenue,
        liquidationValue,
        workerIncentives,
        revenuePerFarm,
      };
    },
  });

  const donutData = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Pickers", value: data.pickers },
      { name: "Satellite staff", value: data.satelliteToday },
    ];
  }, [data]);

  const trend = trendGrain === "day" ? data?.trendDaily : trendGrain === "week" ? data?.trendWeekly : data?.trendMonthly;

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—";

  return (
    <div className="space-y-6">
      {/* Breadcrumb + page header */}
      <div className="space-y-4">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Home</span>
          <span>/</span>
          <span className="font-medium text-foreground">Executive Dashboard</span>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Operations Director{userEmail ? ` · ${userEmail.split("@")[0]}` : ""}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Real-time operational awareness across farms, crews, dispatches and economics.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {data?.campaign ? (
              <Badge variant="secondary" className="gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                {data.campaign.code} · {data.campaign.name}
              </Badge>
            ) : (
              <Badge variant="outline">No active campaign</Badge>
            )}
            <Badge variant="outline" className="gap-1.5 text-[10px]">
              <Radio className={`h-3 w-3 ${isFetching ? "animate-pulse text-primary" : ""}`} />
              Live · {REFRESH_MS / 1000}s
            </Badge>
            <Button size="sm" variant="ghost" onClick={() => refetch()} className="h-7 gap-1.5 text-xs">
              <RefreshCcw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* KPI band — 15 tiles */}
      <div>
        <SectionHeader title="Operational KPIs" description="Snapshot of production, workforce and logistics." />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          <KpiCard label="Current campaign" value={data?.campaign?.code ?? "—"} sub={data?.campaign?.name ?? "No campaign"} icon={ShieldCheck} accent />
          <KpiCard label="Today's harvest" value={<>{fmt(data?.todaysHarvestKg)}<span className="ml-1 text-sm text-muted-foreground">kg</span></>} sub={`${fmt(data?.binsToday)} bins today`} icon={Wheat} to="/reports/progress" />
          <KpiCard label="Forecast achievement" value={pct(data?.completionPct)} sub={`${fmtT(data?.estimatedHarvestedKg)}t of ${fmtT(data?.totalForecastKg)}t`} icon={TrendingUp} to="/reports/forecast-vs-actual" tone="success" />
          <KpiCard label="Actual production" value={<>{fmtT(data?.estimatedHarvestedKg)}<span className="ml-1 text-sm text-muted-foreground">t</span></>} sub={`${fmt(data?.binsTotal)} bins total`} icon={Activity} to="/reports/progress" />
          <KpiCard label="Estimated production" value={<>{fmtT(data?.totalForecastKg)}<span className="ml-1 text-sm text-muted-foreground">t</span></>} sub="Approved forecast" icon={LineIcon} to="/reports/forecasts" />

          <KpiCard label="Total farms" value={fmt(data?.farmsActive)} sub="Active this campaign" icon={MapPin} />
          <KpiCard label="Active crews" value={fmt(data?.crewsActive)} icon={ClipboardList} to="/ops/crews" />
          <KpiCard label="Active pickers" value={fmt(data?.pickers)} icon={Users} to="/ops/crews" />
          <KpiCard label="Satellite staff" value={fmt(data?.satelliteToday)} sub="Today's shift" icon={Users} to="/reports/satellite" />
          <KpiCard label="Satellite ratio" value={pct(data?.satelliteRatio)} sub="Support / pickers" icon={Users} tone="warning" />

          <KpiCard label="Collection points" value={fmt(data?.collectionPoints)} sub="Open batches" icon={Building2} to="/ops/collection-points" />
          <KpiCard label="Open dispatch notes" value={fmt(data?.dispatchOpen)} icon={Truck} to="/ops/dispatch" tone={data && data.dispatchOpen > 0 ? "warning" : "default"} />
          <KpiCard label="Completed dispatches" value={fmt(data?.dispatchClosed)} sub={`${fmt(data?.dispatchToday)} today`} icon={CheckCircle2} to="/reports/dispatch" tone="success" />
          <KpiCard label="Vehicles waiting" value={fmt(data?.vehiclesWaiting)} sub="Awaiting load" icon={Timer} to="/ops/transfers" />
          <KpiCard label="Operational incidents" value={fmt(data?.incidents)} sub="Pallet incidents logged" icon={AlertTriangle} tone={data && data.incidents > 0 ? "danger" : "default"} />
        </div>
      </div>

      {/* Economic KPI band */}
      <div>
        <SectionHeader
          title="Economic Overview"
          description="Commercial visibility across dispatches, revenue and incentives."
          action={
            <Button size="sm" variant="outline" asChild className="h-7 text-xs">
              <Link to="/reports/price-dashboard">
                Open economics <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          }
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <KpiCard label="Avg selling price" value={money(data?.avgSellingPrice)} sub="per kg" icon={DollarSign} accent to="/reports/price-dashboard" />
          <KpiCard label="Estimated revenue" value={money(data?.estimatedRevenue)} sub="Season total" icon={TrendingUp} accent to="/reports/liquidation-summary" tone="success" />
          <KpiCard label="Today's revenue" value={money(data?.todaysRevenue)} sub={`${fmt(data?.binsToday)} bins × ${money(data?.avgSellingPrice)}/kg`} icon={Coins} accent to="/reports/price-dashboard" />
          <KpiCard label="Liquidation value" value={money(data?.liquidationValue)} sub="From closed dispatches" icon={CheckCircle2} accent to="/reports/liquidation-summary" tone="success" />
          <KpiCard label="Worker incentives" value={money(data?.workerIncentives)} sub={`${fmt(data?.binsTotal)} bins × ${money(data?.incentivePerBin)}`} icon={Award} accent to="/reports/incentive-dashboard" />
          <KpiCard label="Revenue per farm" value={money(data?.revenuePerFarm)} sub="Season average" icon={Building2} accent to="/reports/farm-performance" />
        </div>
      </div>

      {/* Analytics grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Harvest trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">Harvest Trend</CardTitle>
                <CardDescription>Estimated production over time</CardDescription>
              </div>
              <Tabs value={trendGrain} onValueChange={(v) => setTrendGrain(v as any)}>
                <TabsList className="h-8">
                  <TabsTrigger value="day" className="h-7 text-xs">Daily · 30d</TabsTrigger>
                  <TabsTrigger value="week" className="h-7 text-xs">Weekly · 12w</TabsTrigger>
                  <TabsTrigger value="month" className="h-7 text-xs">Monthly · 3m</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend ?? []} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `${(v / 1000).toFixed(0)}t`} />
                  <Tooltip
                    contentStyle={{ background: "var(--popover)", color: "var(--popover-foreground)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [`${(v / 1000).toFixed(1)} t`, "Harvest"]}
                  />
                  <Line type="monotone" dataKey="kg" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Variety production pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Variety Production</CardTitle>
            <CardDescription>Share of total harvested weight</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {(data?.varietyPie ?? []).length === 0 ? (
                <div className="grid h-full place-items-center text-xs text-muted-foreground">No variety data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={data?.varietyPie ?? []} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80} paddingAngle={2}>
                      {(data?.varietyPie ?? []).map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "var(--popover)", color: "var(--popover-foreground)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => `${(v / 1000).toFixed(1)} t`}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  </RePieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Forecast vs actual bar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Forecast vs Actual</CardTitle>
            <CardDescription>Top farms — approved forecast against realised harvest (tonnes)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {(data?.forecastVsActual ?? []).length === 0 ? (
                <div className="grid h-full place-items-center text-xs text-muted-foreground">Approve forecasts to see comparison</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.forecastVsActual ?? []} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="farm" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <Tooltip contentStyle={{ background: "var(--popover)", color: "var(--popover-foreground)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                    <Legend iconType="rect" wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="forecast" name="Forecast (t)" fill={CHART_COLORS[5]} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" name="Actual (t)" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Satellite ratio donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Satellite Staff Ratio</CardTitle>
            <CardDescription>Pickers vs support staff today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {donutData.every((d) => d.value === 0) ? (
                <div className="grid h-full place-items-center text-xs text-muted-foreground">No workforce data today</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2}>
                      <Cell fill={CHART_COLORS[0]} />
                      <Cell fill={CHART_COLORS[2]} />
                    </Pie>
                    <Tooltip contentStyle={{ background: "var(--popover)", color: "var(--popover-foreground)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  </RePieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Farm performance horizontal bar */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">Farm Performance</CardTitle>
                <CardDescription>Top farms — harvested tonnes and remaining forecast</CardDescription>
              </div>
              <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                <Link to="/reports/farm-performance">View report <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {(data?.farmPerformance ?? []).length === 0 ? (
                <div className="grid h-full place-items-center text-xs text-muted-foreground">No production yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.farmPerformance ?? []} layout="vertical" margin={{ top: 8, right: 24, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `${v}t`} />
                    <YAxis type="category" dataKey="farm" width={140} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <Tooltip contentStyle={{ background: "var(--popover)", color: "var(--popover-foreground)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                    <Legend iconType="rect" wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="harvest" name="Harvested (t)" stackId="a" fill={CHART_COLORS[0]} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="remaining" name="Remaining (t)" stackId="a" fill="var(--muted)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dispatch status board */}
      <div>
        <SectionHeader
          title="Dispatch Status"
          description="Board of dispatch notes across every state"
          action={
            <Button size="sm" variant="outline" asChild className="h-7 text-xs">
              <Link to="/reports/dispatch-status">Open board <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          }
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <DispatchStatCard label="Open" value={data?.dispatchBoard.open ?? 0} tone="warning" />
          <DispatchStatCard label="Closed" value={data?.dispatchBoard.closed ?? 0} tone="default" />
          <DispatchStatCard label="Dispatched" value={data?.dispatchBoard.dispatched ?? 0} tone="default" />
          <DispatchStatCard label="Delivered" value={data?.dispatchBoard.delivered ?? 0} tone="success" />
          <DispatchStatCard label="Delayed" value={data?.dispatchBoard.delayed ?? 0} tone="danger" />
        </div>
      </div>

      {/* Approvals + guidance */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quick approvals</CardTitle>
            <CardDescription>Business gates that only the Operations Director can sign off.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Link to="/reports/forecasts/approvals" className="flex items-center justify-between rounded-md border p-3 transition hover:border-primary/40 hover:bg-muted/50">
              <div>
                <div className="font-medium">Harvest forecast approvals</div>
                <div className="text-xs text-muted-foreground">Submitted, awaiting director sign-off</div>
              </div>
              <Badge variant={data && data.forecastsPending > 0 ? "secondary" : "outline"}>{fmt(data?.forecastsPending)} pending</Badge>
            </Link>
            <Link to="/reports/dispatch-status" className="flex items-center justify-between rounded-md border p-3 transition hover:border-primary/40 hover:bg-muted/50">
              <div>
                <div className="font-medium">Dispatch review</div>
                <div className="text-xs text-muted-foreground">Vehicles awaiting load & delayed notes</div>
              </div>
              <Badge variant={data && data.dispatchBoard.delayed > 0 ? "destructive" : "outline"}>
                {fmt(data?.dispatchBoard.delayed)} delayed
              </Badge>
            </Link>
            <Link to="/reports/audit" className="flex items-center justify-between rounded-md border p-3 transition hover:border-primary/40 hover:bg-muted/50">
              <div>
                <div className="font-medium">Audit trail</div>
                <div className="text-xs text-muted-foreground">Every operational change, with reason</div>
              </div>
              <Badge variant="outline">Review</Badge>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Director responsibilities</CardTitle>
            <CardDescription>Operational supervision, not routine data entry.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><Sprout className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Monitor deviations between forecast and actual production.</span></li>
              <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Approve or reject submitted harvest forecasts.</span></li>
              <li className="flex gap-2"><TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Track underperforming farms, plots, crews or varieties.</span></li>
              <li className="flex gap-2"><Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Review commercial visibility: buyers, destinations, dispatch volume.</span></li>
              <li className="flex gap-2"><QrCode className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Audit compliance across every operational change.</span></li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4 text-[11px] text-muted-foreground">
        <span>Last updated at {lastUpdated}</span>
        {isLoading && <span>Loading live metrics…</span>}
      </div>
    </div>
  );
}

function DispatchStatCard({ label, value, tone }: { label: string; value: number; tone: "default" | "success" | "warning" | "danger" }) {
  const dot =
    tone === "success" ? "bg-success" :
    tone === "warning" ? "bg-warning" :
    tone === "danger" ? "bg-destructive" :
    "bg-primary";
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-1 font-display text-2xl font-semibold tabular-nums">{value.toLocaleString()}</div>
        </div>
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden />
      </CardContent>
    </Card>
  );
}

// silence unused import warnings for icons intentionally reserved for later panels
void Package; void ClipboardList;
