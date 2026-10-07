import { createFileRoute } from "@/lib/router-compat";
import { useMemo, useState } from "react";
import { useQuery } from "@/lib/useFetch";
import { db as supabase } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCheck, Users, TrendingUp } from "lucide-react";
import { PageHeader, StatTile, EmptyState } from "@/components/enterprise/page-shell";

export const Route = createFileRoute("/_authenticated/reports/worker-productivity")({
  component: WorkerProductivityPage,
});

function WorkerProductivityPage() {
  const [search, setSearch] = useState("");

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["worker-productivity"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const [pickersRes, crewsRes, binsRes, workersRes, wRes] = await Promise.all([
        (supabase as any).from("crew_pickers").select("crew_id, worker_id"),
        (supabase as any).from("crews").select("id, code, work_date"),
        (supabase as any).from("pallet_bins").select("crew_id").limit(50000),
        (supabase as any).from("workers").select("id, first_name, last_name, document_number"),
        (supabase as any).from("operational_parameters").select("value").eq("key", "estimated_pallet_weight_kg").maybeSingle(),
      ]);
      const kg = Number(wRes.data?.value ?? 400);
      const binsByCrew = new Map<string, number>();
      for (const b of binsRes.data ?? []) if (b.crew_id) binsByCrew.set(b.crew_id, (binsByCrew.get(b.crew_id) ?? 0) + 1);
      const pickersByCrew = new Map<string, string[]>();
      for (const p of pickersRes.data ?? []) {
        const arr = pickersByCrew.get(p.crew_id) ?? [];
        arr.push(p.worker_id); pickersByCrew.set(p.crew_id, arr);
      }
      const workers = new Map<string, any>((workersRes.data ?? []).map((r: any) => [r.id, r]));
      // Distribute crew bins evenly across pickers as estimated attribution
      const totals = new Map<string, { id: string; name: string; code: string; crews: number; est_bins: number; est_kg: number }>();
      for (const c of crewsRes.data ?? []) {
        const bins = binsByCrew.get(c.id) ?? 0;
        const pickers = pickersByCrew.get(c.id) ?? [];
        if (!pickers.length) continue;
        const share = bins / pickers.length;
        for (const wid of pickers) {
          const w = workers.get(wid);
          if (!w) continue;
          const cur = totals.get(wid) ?? {
            id: wid,
            name: `${w.first_name} ${w.last_name}`,
            code: w.document_number ?? "—",
            crews: 0, est_bins: 0, est_kg: 0,
          };
          cur.crews += 1; cur.est_bins += share; cur.est_kg += share * kg;
          totals.set(wid, cur);
        }
      }
      return [...totals.values()].sort((a, b) => b.est_kg - a.est_kg);
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q));
  }, [data, search]);

  const totals = useMemo(() => ({
    workers: filtered.length,
    kg: filtered.reduce((s, r) => s + r.est_kg, 0),
    avg: filtered.length ? filtered.reduce((s, r) => s + r.est_bins, 0) / filtered.length : 0,
  }), [filtered]);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Reports"
        title="Worker Productivity"
        description="Estimated per-picker output derived from crew assignments and reception scans."
        live
        isFetching={isFetching}
        onRefresh={() => refetch()}
        actions={<Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name / code…" className="h-8 w-56 text-xs" />}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <StatTile label="Pickers with output" value={totals.workers} icon={Users} />
        <StatTile label="Estimated harvest" value={`${Math.round(totals.kg / 1000).toLocaleString()} t`} icon={TrendingUp} tone="success" />
        <StatTile label="Avg bins / picker" value={totals.avg.toFixed(1)} icon={UserCheck} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-right">#</TableHead>
                <TableHead>Worker</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="text-right">Crews</TableHead>
                <TableHead className="text-right">Est. bins</TableHead>
                <TableHead className="text-right">Est. kg</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6}><EmptyState title="No worker productivity yet" description="Pickers appear after crew assignments and receptions are logged." /></TableCell></TableRow>
              ) : filtered.map((r, i) => (
                <TableRow key={r.id}>
                  <TableCell className="text-right text-muted-foreground tabular-nums">{i + 1}</TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="font-mono text-xs">{r.code}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.crews}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.est_bins.toFixed(1)}</TableCell>
                  <TableCell className="text-right tabular-nums">{Math.round(r.est_kg).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
