import { createFileRoute } from "@/lib/router-compat";
import { useMemo } from "react";
import { useQuery } from "@/lib/useFetch";
import { db as supabase } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList, Users, TrendingUp } from "lucide-react";
import { PageHeader, StatTile, EmptyState } from "@/components/enterprise/page-shell";

export const Route = createFileRoute("/_authenticated/reports/crew-performance")({
  component: CrewPerformancePage,
});

function CrewPerformancePage() {
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["crew-performance"],
    refetchInterval: 30_000,
    queryFn: async () => {
      const [crewsRes, binsRes, pickersRes, workersRes, wRes] = await Promise.all([
        (supabase as any).from("crews").select("id, code, work_date, status, supervisor_id, campaign:campaigns(code)"),
        (supabase as any).from("pallet_bins").select("crew_id").limit(50000),
        (supabase as any).from("crew_pickers").select("crew_id, worker_id"),
        (supabase as any).from("workers").select("id, first_name, last_name"),
        (supabase as any).from("operational_parameters").select("value").eq("key", "estimated_pallet_weight_kg").maybeSingle(),
      ]);
      const kg = Number(wRes.data?.value ?? 400);
      const workers = new Map<string, any>((workersRes.data ?? []).map((r: any) => [r.id, r]));
      const binsByCrew = new Map<string, number>();
      for (const b of binsRes.data ?? []) if (b.crew_id) binsByCrew.set(b.crew_id, (binsByCrew.get(b.crew_id) ?? 0) + 1);
      const pickersByCrew = new Map<string, number>();
      for (const p of pickersRes.data ?? []) pickersByCrew.set(p.crew_id, (pickersByCrew.get(p.crew_id) ?? 0) + 1);

      const rows = (crewsRes.data ?? []).map((c: any) => {
        const bins = binsByCrew.get(c.id) ?? 0;
        const pickers = pickersByCrew.get(c.id) ?? 0;
        const sv = c.supervisor_id ? workers.get(c.supervisor_id) : null;
        return {
          id: c.id, code: c.code, date: c.work_date, status: c.status,
          campaign: c.campaign?.code ?? "—",
          supervisor: sv ? `${sv.first_name} ${sv.last_name}` : "—",
          pickers, bins, kg: bins * kg,
          binsPerPicker: pickers > 0 ? bins / pickers : 0,
        };
      }).sort((a: any, b: any) => b.kg - a.kg);
      return rows;
    },
  });

  const totals = useMemo(() => {
    const r = data ?? [];
    return {
      crews: r.length,
      active: r.filter((x: any) => x.status === "active").length,
      pickers: r.reduce((s: number, x: any) => s + x.pickers, 0),
      kg: r.reduce((s: number, x: any) => s + x.kg, 0),
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb="Reports" title="Crew Performance" description="Supervisor-level output, headcount and productivity per crew." live isFetching={isFetching} onRefresh={() => refetch()} />

      <div className="grid gap-3 md:grid-cols-4">
        <StatTile label="Crews" value={totals.crews} icon={ClipboardList} />
        <StatTile label="Active crews" value={totals.active} icon={Users} tone="success" />
        <StatTile label="Pickers assigned" value={totals.pickers} icon={Users} />
        <StatTile label="Total harvested" value={`${Math.round(totals.kg / 1000).toLocaleString()} t`} icon={TrendingUp} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Crew</TableHead>
                <TableHead>Supervisor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Pickers</TableHead>
                <TableHead className="text-right">Bins</TableHead>
                <TableHead className="text-right">Kg</TableHead>
                <TableHead className="text-right">Bins/picker</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).length === 0 ? (
                <TableRow><TableCell colSpan={8}><EmptyState title="No crews yet" /></TableCell></TableRow>
              ) : (data ?? []).map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono font-medium">{r.code}</TableCell>
                  <TableCell>{r.supervisor}</TableCell>
                  <TableCell className="text-muted-foreground">{r.date}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.pickers}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.bins.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.kg.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.binsPerPicker ? r.binsPerPicker.toFixed(2) : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "active" ? "default" : "secondary"} className="text-[10px] capitalize">{r.status}</Badge>
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
