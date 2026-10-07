
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Warehouse, Package, Boxes, Activity, Clock } from "lucide-react";
import { PageHeader, StatTile, EmptyState } from "@/components/enterprise/page-shell";



const REFRESH_MS = 30_000;

function timeAgo(iso?: string | null) {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function CollectionPointsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["collection-points"],
    refetchInterval: REFRESH_MS,
    queryFn: async () => {
      const [batchesRes, binsRes, machinesRes, weightRes] = await Promise.all([
        supabase.from("reception_batches").select("id, machine_id, operator_worker_id, opened_at, closed_at, work_date").order("opened_at", { ascending: false }).limit(200),
        supabase.from("pallet_bins").select("id, reception_batch_id, machine_id, is_unassigned, received_at, work_date").limit(20000),
        supabase.from("machines").select("id, code, name, machine_type, status"),
        supabase.from("operational_parameters").select("value").eq("key", "estimated_pallet_weight_kg").maybeSingle(),
      ]);
      const machines = machinesRes.data ?? [];
      const bins = binsRes.data ?? [];
      const weightKg = Number(weightRes.data?.value ?? 300);
      const machinesMap = new Map(machines.map((m: any) => [m.id, m]));

      const byMachine = machines.map((m: any) => {
        const machineBins = bins.filter((b: any) => b.machine_id === m.id);
        const todayBins = machineBins.filter((b: any) => b.work_date === today);
        const unassigned = machineBins.filter((b: any) => b.is_unassigned).length;
        const openBatch = (batchesRes.data ?? []).find((b: any) => b.machine_id === m.id && !b.closed_at);
        const lastReceived = machineBins.reduce<string | null>((acc, b: any) => (b.received_at && (!acc || b.received_at > acc)) ? b.received_at : acc, null);
        return {
          id: m.id,
          code: m.code,
          name: m.name,
          type: m.machine_type ?? "reception",
          status: m.status,
          openBatch,
          binsToday: todayBins.length,
          binsTotal: machineBins.length,
          unassigned,
          kgToday: todayBins.length * weightKg,
          lastReceived,
        };
      }).sort((a, b) => b.binsToday - a.binsToday);

      const openBatches = (batchesRes.data ?? []).filter((b: any) => !b.closed_at);
      return {
        machinesMap,
        byMachine,
        openBatches: openBatches.length,
        totalPoints: machines.length,
        activePoints: machines.filter((m: any) => m.status === "active").length,
        totalBinsToday: bins.filter((b: any) => b.work_date === today).length,
        totalUnassigned: bins.filter((b: any) => b.is_unassigned).length,
      };
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Operations"
        title="Collection Point Status"
        description="Reception capacity, bin backlog and activity by machine and operator."
        live
        isFetching={isFetching}
        onRefresh={() => refetch()}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Total points" value={data?.totalPoints ?? "—"} sub={`${data?.activePoints ?? 0} active`} icon={Warehouse} />
        <StatTile label="Open batches" value={data?.openBatches ?? "—"} icon={Activity} tone={data?.openBatches ? "success" : "default"} />
        <StatTile label="Bins today" value={data?.totalBinsToday?.toLocaleString() ?? "—"} icon={Boxes} />
        <StatTile label="Unassigned" value={data?.totalUnassigned?.toLocaleString() ?? "—"} icon={Package} tone={(data?.totalUnassigned ?? 0) > 0 ? "warning" : "default"} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider">Collection points</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Machine</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Bins today</TableHead>
                <TableHead className="text-right">Kg today</TableHead>
                <TableHead className="text-right">Backlog</TableHead>
                <TableHead>Last scan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!data?.byMachine?.length ? (
                <TableRow><TableCell colSpan={8}><EmptyState title="No collection points configured" /></TableCell></TableRow>
              ) : data.byMachine.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.code}</TableCell>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-xs uppercase tracking-wider text-muted-foreground">{m.type}</TableCell>
                  <TableCell>
                    {m.openBatch ? (
                      <Badge variant="default" className="gap-1 text-[10px]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" /> Open</Badge>
                    ) : m.status === "active" ? (
                      <Badge variant="secondary" className="text-[10px]">Idle</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">Offline</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{m.binsToday.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{m.kgToday.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {m.unassigned > 0 ? (
                      <Badge variant="destructive" className="tabular-nums">{m.unassigned}</Badge>
                    ) : <span className="tabular-nums text-muted-foreground">0</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <Clock className="mr-1 inline h-3 w-3" />{timeAgo(m.lastReceived)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
export default CollectionPointsPage;
