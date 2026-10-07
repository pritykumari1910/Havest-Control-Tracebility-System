import { createFileRoute } from "@/lib/router-compat";
import { useMemo } from "react";
import { useQuery } from "@/lib/useFetch";
import { db as supabase } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Award, Users, TrendingUp } from "lucide-react";
import { PageHeader, StatTile, EmptyState } from "@/components/enterprise/page-shell";

export const Route = createFileRoute("/_authenticated/reports/incentive-dashboard")({
  component: IncentiveDashboardPage,
});

const RATE_PICKER_PER_BIN = 0.35;   // € per bin, placeholder rule
const RATE_SUPERVISOR_PER_BIN = 0.10;

function IncentiveDashboardPage() {
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["incentive-dashboard"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const [pickersRes, crewsRes, binsRes, workersRes] = await Promise.all([
        (supabase as any).from("crew_pickers").select("crew_id, worker_id"),
        (supabase as any).from("crews").select("id, supervisor_id"),
        (supabase as any).from("pallet_bins").select("crew_id").limit(50000),
        (supabase as any).from("workers").select("id, first_name, last_name, document_number"),
      ]);
      const workers = new Map<string, any>((workersRes.data ?? []).map((r: any) => [r.id, r]));
      const binsByCrew = new Map<string, number>();
      for (const b of binsRes.data ?? []) if (b.crew_id) binsByCrew.set(b.crew_id, (binsByCrew.get(b.crew_id) ?? 0) + 1);
      const pickersByCrew = new Map<string, string[]>();
      for (const p of pickersRes.data ?? []) {
        const arr = pickersByCrew.get(p.crew_id) ?? [];
        arr.push(p.worker_id); pickersByCrew.set(p.crew_id, arr);
      }
      const totals = new Map<string, { id: string; name: string; code: string; role: "picker" | "supervisor"; bins: number; incentive: number }>();
      for (const c of crewsRes.data ?? []) {
        const bins = binsByCrew.get(c.id) ?? 0;
        if (!bins) continue;
        const pickers = pickersByCrew.get(c.id) ?? [];
        if (pickers.length) {
          const share = bins / pickers.length;
          for (const wid of pickers) {
            const w = workers.get(wid); if (!w) continue;
            const cur = totals.get(`p_${wid}`) ?? {
              id: wid, name: `${w.first_name} ${w.last_name}`,
              code: w.document_number ?? "—", role: "picker" as const, bins: 0, incentive: 0,
            };
            cur.bins += share; cur.incentive += share * RATE_PICKER_PER_BIN;
            totals.set(`p_${wid}`, cur);
          }
        }
        if (c.supervisor_id) {
          const w = workers.get(c.supervisor_id);
          if (w) {
            const key = `s_${c.supervisor_id}`;
            const cur = totals.get(key) ?? {
              id: c.supervisor_id, name: `${w.first_name} ${w.last_name}`,
              code: w.document_number ?? "—", role: "supervisor" as const, bins: 0, incentive: 0,
            };
            cur.bins += bins; cur.incentive += bins * RATE_SUPERVISOR_PER_BIN;
            totals.set(key, cur);
          }
        }
      }
      return [...totals.values()].sort((a, b) => b.incentive - a.incentive);
    },
  });

  const totals = useMemo(() => {
    const r = data ?? [];
    return {
      workers: r.length,
      pickers: r.filter((x) => x.role === "picker").length,
      supervisors: r.filter((x) => x.role === "supervisor").length,
      payout: r.reduce((s, x) => s + x.incentive, 0),
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb="Economics" title="Incentive Dashboard" description="Estimated worker and supervisor incentives from field productivity." live isFetching={isFetching} onRefresh={() => refetch()} />

      <div className="grid gap-3 md:grid-cols-4">
        <StatTile label="Beneficiaries" value={totals.workers} icon={Users} />
        <StatTile label="Pickers" value={totals.pickers} icon={Users} />
        <StatTile label="Supervisors" value={totals.supervisors} icon={Award} tone="warning" />
        <StatTile label="Total incentives" value={`€ ${Math.round(totals.payout).toLocaleString()}`} icon={TrendingUp} tone="success" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-right">#</TableHead>
                <TableHead>Worker</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Bins credited</TableHead>
                <TableHead className="text-right">Incentive €</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).length === 0 ? (
                <TableRow><TableCell colSpan={6}><EmptyState title="No incentives yet" description="Incentives populate once crews and receptions are logged." /></TableCell></TableRow>
              ) : (data ?? []).map((r, i) => (
                <TableRow key={`${r.role}_${r.id}`}>
                  <TableCell className="text-right text-muted-foreground tabular-nums">{i + 1}</TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="font-mono text-xs">{r.code}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{r.role}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.bins.toFixed(1)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{r.incentive.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-[11px] text-muted-foreground">
        Rates use placeholder rules (pickers € {RATE_PICKER_PER_BIN.toFixed(2)}/bin, supervisors € {RATE_SUPERVISOR_PER_BIN.toFixed(2)}/bin) until commercial agreements are entered.
      </p>
    </div>
  );
}
