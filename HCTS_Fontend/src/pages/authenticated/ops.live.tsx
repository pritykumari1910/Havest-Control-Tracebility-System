import { createFileRoute } from "@/lib/router-compat";
import { useQuery } from "@/lib/useFetch";
import { db as supabase } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Users, ClipboardList, QrCode, Warehouse, Wheat, AlertTriangle, MapPin } from "lucide-react";
import { PageHeader, StatTile, SectionHeader, EmptyState } from "@/components/enterprise/page-shell";

export const Route = createFileRoute("/_authenticated/ops/live")({
  component: LiveOpsPage,
});

const REFRESH_MS = 20_000;

function timeAgo(iso?: string | null) {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function LiveOpsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["live-ops", today],
    refetchInterval: REFRESH_MS,
    queryFn: async () => {
      const [
        crewsRes, assignRes, binsRecentRes, binsTodayRes,
        batchesOpenRes, batchesTodayRes, incidentsRes, machinesActRes,
        farmsRes, varietiesRes, weightRes,
      ] = await Promise.all([
        supabase.from("crews").select("id, name, status").eq("status", "active"),
        supabase.from("harvest_assignments").select("id, farm_id, variety_id, crew_id, status, work_date, plot_id").eq("work_date", today),
        supabase.from("pallet_bins").select("id, qr_code_id, farm_id, variety_id, received_at, is_unassigned, crew_id, machine_id").order("received_at", { ascending: false, nullsFirst: false }).limit(15),
        supabase.from("pallet_bins").select("id, farm_id", { count: "exact" }).eq("work_date", today).limit(2000),
        supabase.from("reception_batches").select("id, machine_id, operator_worker_id, opened_at, closed_at").is("closed_at", null),
        supabase.from("reception_batches").select("id", { count: "exact", head: true }).eq("work_date", today),
        supabase.from("pallet_incidents").select("id, description, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("machines").select("id, code, name, status").eq("status", "active"),
        supabase.from("farms").select("id, name"),
        supabase.from("varieties").select("id, name"),
        supabase.from("operational_parameters").select("value").eq("key", "estimated_pallet_weight_kg").maybeSingle(),
      ]);
      const farmsMap = new Map((farmsRes.data ?? []).map((f: any) => [f.id, f.name]));
      const varsMap = new Map((varietiesRes.data ?? []).map((v: any) => [v.id, v.name]));
      const weightKg = Number(weightRes.data?.value ?? 300);
      const binsToday = binsTodayRes.data ?? [];

      const farmActivity = new Map<string, number>();
      for (const b of binsToday) if (b.farm_id) farmActivity.set(b.farm_id, (farmActivity.get(b.farm_id) ?? 0) + 1);
      const farmGrid = [...farmActivity.entries()]
        .map(([id, n]) => ({ id, farm: farmsMap.get(id) ?? "—", bins: n, kg: n * weightKg }))
        .sort((a, b) => b.bins - a.bins);

      // Harvest speed — bins in last hour
      const hourAgo = Date.now() - 3600_000;
      const binsLastHour = (binsRecentRes.data ?? []).filter((b: any) => b.received_at && new Date(b.received_at).getTime() >= hourAgo).length;

      return {
        activeCrews: (crewsRes.data ?? []).length,
        assignmentsToday: (assignRes.data ?? []).length,
        activeAssignments: (assignRes.data ?? []).filter((a: any) => a.status === "active" || a.status === "in_progress").length,
        binsTodayCount: binsTodayRes.count ?? binsToday.length,
        binsLastHour,
        speedPerHour: binsLastHour,
        openBatches: (batchesOpenRes.data ?? []).length,
        batchesToday: batchesTodayRes.count ?? 0,
        machinesActive: (machinesActRes.data ?? []).length,
        incidents: incidentsRes.data ?? [],
        recentBins: (binsRecentRes.data ?? []).map((b: any) => ({
          ...b,
          farm: farmsMap.get(b.farm_id) ?? "—",
          variety: varsMap.get(b.variety_id) ?? "—",
        })),
        farmGrid,
        weightKg,
      };
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Operations"
        title="Live Operations"
        description="Real-time view of crews, assignments, pallet scans and machine activity across the estate."
        live
        isFetching={isFetching}
        onRefresh={() => refetch()}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        <StatTile label="Active crews" value={data?.activeCrews ?? "—"} icon={Users} />
        <StatTile label="Assignments today" value={data?.assignmentsToday ?? "—"} sub={`${data?.activeAssignments ?? 0} in progress`} icon={ClipboardList} />
        <StatTile label="Bins today" value={data?.binsTodayCount?.toLocaleString() ?? "—"} sub={`${((data?.binsTodayCount ?? 0) * (data?.weightKg ?? 0)).toLocaleString()} kg`} icon={Wheat} tone="success" />
        <StatTile label="Harvest speed" value={<>{data?.speedPerHour ?? 0}<span className="ml-1 text-sm text-muted-foreground">/hr</span></>} sub="Bins in last hour" icon={Activity} />
        <StatTile label="Reception batches" value={data?.openBatches ?? "—"} sub={`${data?.batchesToday ?? 0} opened today`} icon={Warehouse} />
        <StatTile label="Machines active" value={data?.machinesActive ?? "—"} icon={QrCode} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider">Latest pallet scans</CardTitle>
              <Badge variant="outline" className="text-[10px]">Last 15</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>QR / Bin</TableHead>
                  <TableHead>Farm</TableHead>
                  <TableHead>Variety</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data?.recentBins?.length ? (
                  <TableRow><TableCell colSpan={5}><EmptyState title="No recent scans" description="Bin scans will appear here in real time." /></TableCell></TableRow>
                ) : data.recentBins.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">{b.qr_code_id?.slice(0, 12) ?? b.id.slice(0, 8)}</TableCell>
                    <TableCell>{b.farm}</TableCell>
                    <TableCell>{b.variety}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{timeAgo(b.received_at)}</TableCell>
                    <TableCell className="text-right">
                      {b.is_unassigned
                        ? <Badge variant="destructive" className="text-[10px]">Unassigned</Badge>
                        : <Badge variant="secondary" className="text-[10px]">Assigned</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4 text-warning" /> Incidents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            {!data?.incidents?.length ? (
              <EmptyState title="No incidents" description="Field incidents raised against pallet bins will appear here." />
            ) : data.incidents.map((i: any) => (
              <div key={i.id} className="rounded-md border border-border/60 p-3">
                <div className="text-sm text-foreground">{i.description ?? "Incident"}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">{timeAgo(i.created_at)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <SectionHeader title="Farm activity — today" description="Bins received today, ranked." />
        {!data?.farmGrid?.length ? (
          <Card><CardContent><EmptyState title="No farm activity yet today" /></CardContent></Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {data.farmGrid.slice(0, 15).map((f) => (
              <Card key={f.id} className="border transition hover:border-primary/40">
                <CardContent className="flex flex-col gap-1.5 p-4">
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <MapPin className="h-3 w-3" /> Farm
                  </div>
                  <div className="truncate text-sm font-semibold">{f.farm}</div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <div className="font-display text-xl font-semibold tabular-nums">{f.bins}</div>
                    <div className="text-[11px] text-muted-foreground">{f.kg.toLocaleString()} kg</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
