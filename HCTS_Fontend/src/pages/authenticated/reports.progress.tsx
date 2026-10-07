import { createFileRoute } from "@/lib/router-compat";
import { useQuery } from "@/lib/useFetch";
import { db as supabase } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/reports/progress")({
  component: ProgressPage,
});

function ProgressPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["progress-report"],
    queryFn: async () => {
      const [binsRes, forecastRes, unassignedRes, dispatchRes] = await Promise.all([
        (supabase as any).from("pallet_bins").select("id, campaign_id, variety_id, farm_id, work_date").limit(5000),
        (supabase as any).from("forecasts").select("campaign_id, farm_id, variety_id, estimated_kg"),
        (supabase as any).from("pallet_bins").select("id", { count: "exact", head: true }).eq("is_unassigned", true),
        (supabase as any).from("dispatch_notes").select("id, status"),
      ]);
      const bins = binsRes.data ?? [];
      const forecasts = forecastRes.data ?? [];
      const [farmsRes, varsRes, campRes] = await Promise.all([
        (supabase as any).from("farms").select("id, name"),
        (supabase as any).from("varieties").select("id, name"),
        (supabase as any).from("campaigns").select("id, code, status"),
      ]);
      const farms = new Map<string, string>((farmsRes.data ?? []).map((r: any) => [r.id, r.name]));
      const vars_ = new Map<string, string>((varsRes.data ?? []).map((r: any) => [r.id, r.name]));
      const camps = new Map<string, any>((campRes.data ?? []).map((r: any) => [r.id, r]));

      const paramRes = await (supabase as any).from("operational_parameters").select("key, value").eq("key", "estimated_pallet_weight_kg").maybeSingle();
      const kgPerBin = Number(paramRes.data?.value ?? 400);

      // Group bins by campaign/farm/variety
      type Key = string;
      const agg = new Map<Key, { campaign: string; farm: string; variety: string; bins: number; kg: number; forecast_kg: number }>();
      const key = (c: string, f: string, v: string) => `${c}|${f}|${v}`;

      for (const b of bins) {
        const k = key(b.campaign_id, b.farm_id, b.variety_id);
        const existing = agg.get(k) ?? {
          campaign: camps.get(b.campaign_id)?.code ?? "—",
          farm: farms.get(b.farm_id) ?? "—",
          variety: vars_.get(b.variety_id) ?? "—",
          bins: 0, kg: 0, forecast_kg: 0,
        };
        existing.bins += 1;
        existing.kg += kgPerBin;
        agg.set(k, existing);
      }
      for (const f of forecasts) {
        const k = key(f.campaign_id, f.farm_id, f.variety_id);
        const existing = agg.get(k);
        if (existing) existing.forecast_kg += Number(f.estimated_kg ?? 0);
        else agg.set(k, {
          campaign: camps.get(f.campaign_id)?.code ?? "—",
          farm: farms.get(f.farm_id) ?? "—",
          variety: vars_.get(f.variety_id) ?? "—",
          bins: 0, kg: 0, forecast_kg: Number(f.estimated_kg ?? 0),
        });
      }

      const rows = [...agg.values()].sort((a, b) => b.kg - a.kg);
      const totals = {
        bins: bins.length,
        kg: bins.length * kgPerBin,
        forecast_kg: forecasts.reduce((s: number, f: any) => s + Number(f.estimated_kg ?? 0), 0),
        unassigned: unassignedRes.count ?? 0,
        dispatchOpen: (dispatchRes.data ?? []).filter((d: any) => d.status === "open").length,
        dispatchClosed: (dispatchRes.data ?? []).filter((d: any) => d.status === "closed").length,
      };
      return { rows, totals, kgPerBin };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Harvest Progress</h1>
        <p className="mt-1 text-sm text-muted-foreground">Actual received bins vs forecasted yield, grouped by farm and variety.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Bins received" value={data?.totals.bins.toLocaleString() ?? "—"} loading={isLoading} />
        <StatCard label="Estimated kg" value={data ? data.totals.kg.toLocaleString() : "—"} sub={data ? `@ ${data.kgPerBin} kg/bin` : ""} loading={isLoading} />
        <StatCard label="Forecast kg" value={data ? data.totals.forecast_kg.toLocaleString() : "—"} loading={isLoading} />
        <StatCard label="Unassigned bins" value={data?.totals.unassigned.toLocaleString() ?? "—"} loading={isLoading} />
      </div>

      <Card>
        <CardHeader><CardTitle>By farm & variety</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Farm</TableHead>
                <TableHead>Variety</TableHead>
                <TableHead className="text-right">Bins</TableHead>
                <TableHead className="text-right">Actual kg</TableHead>
                <TableHead className="text-right">Forecast kg</TableHead>
                <TableHead className="text-right">Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="p-8 text-center text-muted-foreground">Loading…</TableCell></TableRow>
              ) : (data?.rows ?? []).length === 0 ? (
                <TableRow><TableCell colSpan={7} className="p-8 text-center text-muted-foreground">No harvest data yet</TableCell></TableRow>
              ) : (data?.rows ?? []).map((r, i) => {
                const pct = r.forecast_kg > 0 ? Math.min(999, Math.round((r.kg / r.forecast_kg) * 100)) : null;
                return (
                  <TableRow key={i}>
                    <TableCell>{r.campaign}</TableCell>
                    <TableCell>{r.farm}</TableCell>
                    <TableCell>{r.variety}</TableCell>
                    <TableCell className="text-right">{r.bins.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{r.kg.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{r.forecast_kg.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{pct == null ? "—" : `${pct}%`}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, sub, loading }: { label: string; value: string; sub?: string; loading?: boolean }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold tracking-tight">{loading ? "…" : value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}
