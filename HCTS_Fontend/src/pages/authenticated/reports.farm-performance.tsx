import { createFileRoute } from "@/lib/router-compat";
import { useMemo } from "react";
import { useQuery } from "@/lib/useFetch";
import { db as supabase } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Building2, TrendingUp, Target } from "lucide-react";
import { PageHeader, StatTile, EmptyState } from "@/components/enterprise/page-shell";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/reports/farm-performance")({
  component: FarmPerformancePage,
});

function FarmPerformancePage() {
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["farm-performance"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const [binsRes, forecastRes, farmsRes, wRes] = await Promise.all([
        (supabase as any).from("pallet_bins").select("farm_id").limit(50000),
        (supabase as any).from("forecasts").select("farm_id, estimated_kg"),
        (supabase as any).from("farms").select("id, name, code, status"),
        (supabase as any).from("operational_parameters").select("value").eq("key", "estimated_pallet_weight_kg").maybeSingle(),
      ]);
      const farms = new Map<string, any>((farmsRes.data ?? []).map((r: any) => [r.id, r]));
      const kg = Number(wRes.data?.value ?? 400);
      const rows = new Map<string, { id: string; name: string; code: string; bins: number; kg: number; forecast: number }>();
      for (const f of (farmsRes.data ?? [])) rows.set(f.id, { id: f.id, name: f.name, code: f.code, bins: 0, kg: 0, forecast: 0 });
      for (const b of binsRes.data ?? []) {
        const r = rows.get(b.farm_id); if (!r) continue;
        r.bins += 1; r.kg += kg;
      }
      for (const fc of forecastRes.data ?? []) {
        const r = rows.get(fc.farm_id); if (!r) continue;
        r.forecast += Number(fc.estimated_kg ?? 0);
      }
      return { rows: [...rows.values()].sort((a, b) => b.kg - a.kg), kg, farms };
    },
  });

  const totals = useMemo(() => {
    const r = data?.rows ?? [];
    return {
      farms: r.length,
      active: r.filter((x) => x.bins > 0).length,
      kg: r.reduce((s, x) => s + x.kg, 0),
      forecast: r.reduce((s, x) => s + x.forecast, 0),
    };
  }, [data]);

  const chart = (data?.rows ?? []).slice(0, 10).map((r) => ({ name: r.name, kg: r.kg, forecast: r.forecast }));

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb="Reports" title="Farm Performance" description="Ranked farm-level productivity vs approved forecasts." live isFetching={isFetching} onRefresh={() => refetch()} />

      <div className="grid gap-3 md:grid-cols-4">
        <StatTile label="Farms tracked" value={totals.farms} icon={Building2} />
        <StatTile label="Producing today" value={totals.active} icon={TrendingUp} tone="success" />
        <StatTile label="Total harvested" value={`${Math.round(totals.kg / 1000).toLocaleString()} t`} icon={TrendingUp} />
        <StatTile label="Forecast target" value={`${Math.round(totals.forecast / 1000).toLocaleString()} t`} icon={Target} tone="warning" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="mb-3 text-sm font-semibold">Top 10 farms · Actual vs Forecast (kg)</div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={chart} layout="vertical" margin={{ left: 30, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={130} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Bar dataKey="forecast" fill="hsl(var(--muted-foreground) / 0.35)" name="Forecast" />
                <Bar dataKey="kg" fill="hsl(var(--primary))" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Farm</TableHead>
                <TableHead className="text-right">Bins</TableHead>
                <TableHead className="text-right">Actual kg</TableHead>
                <TableHead className="text-right">Forecast kg</TableHead>
                <TableHead className="w-56">Completion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.rows ?? []).length === 0 ? (
                <TableRow><TableCell colSpan={5}><EmptyState title="No farms yet" /></TableCell></TableRow>
              ) : (data?.rows ?? []).map((r) => {
                const pct = r.forecast > 0 ? Math.min(150, Math.round((r.kg / r.forecast) * 100)) : null;
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-[11px] text-muted-foreground">{r.code}</div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.bins.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.kg.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{r.forecast.toLocaleString()}</TableCell>
                    <TableCell>
                      {pct == null ? <span className="text-xs text-muted-foreground">No forecast</span> : (
                        <div className="flex items-center gap-2">
                          <Progress value={Math.min(100, pct)} className="h-1.5" />
                          <span className="w-10 text-right text-xs tabular-nums">{pct}%</span>
                        </div>
                      )}
                    </TableCell>
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
