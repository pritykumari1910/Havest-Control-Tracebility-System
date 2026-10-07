import { createFileRoute } from "@/lib/router-compat";
import { useMemo } from "react";
import { useQuery } from "@/lib/useFetch";
import { db as supabase } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sprout, TrendingUp } from "lucide-react";
import { PageHeader, StatTile, EmptyState } from "@/components/enterprise/page-shell";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export const Route = createFileRoute("/_authenticated/reports/variety-performance")({
  component: VarietyPerformancePage,
});

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2, 210 60% 55%))", "hsl(var(--chart-3, 40 80% 55%))", "hsl(var(--chart-4, 340 70% 60%))", "hsl(var(--chart-5, 160 60% 45%))", "hsl(var(--muted-foreground))"];

function VarietyPerformancePage() {
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["variety-performance"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const [binsRes, forecastRes, varsRes, wRes] = await Promise.all([
        (supabase as any).from("pallet_bins").select("variety_id").limit(50000),
        (supabase as any).from("forecasts").select("variety_id, estimated_kg"),
        (supabase as any).from("varieties").select("id, name"),
        (supabase as any).from("operational_parameters").select("value").eq("key", "estimated_pallet_weight_kg").maybeSingle(),
      ]);
      const kg = Number(wRes.data?.value ?? 400);
      const rows = new Map<string, { id: string; name: string; bins: number; kg: number; forecast: number }>();
      for (const v of varsRes.data ?? []) rows.set(v.id, { id: v.id, name: v.name, bins: 0, kg: 0, forecast: 0 });
      for (const b of binsRes.data ?? []) {
        const r = rows.get(b.variety_id); if (!r) continue;
        r.bins += 1; r.kg += kg;
      }
      for (const fc of forecastRes.data ?? []) {
        const r = rows.get(fc.variety_id); if (!r) continue;
        r.forecast += Number(fc.estimated_kg ?? 0);
      }
      return [...rows.values()].sort((a, b) => b.kg - a.kg);
    },
  });

  const totals = useMemo(() => {
    const rows = data ?? [];
    return {
      count: rows.length,
      producing: rows.filter((r) => r.bins > 0).length,
      kg: rows.reduce((s, r) => s + r.kg, 0),
    };
  }, [data]);

  const chart = (data ?? []).filter((r) => r.kg > 0).slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb="Reports" title="Variety Performance" description="Production share and yield per variety across the campaign." live isFetching={isFetching} onRefresh={() => refetch()} />

      <div className="grid gap-3 md:grid-cols-3">
        <StatTile label="Varieties" value={totals.count} icon={Sprout} />
        <StatTile label="Actively producing" value={totals.producing} icon={TrendingUp} tone="success" />
        <StatTile label="Total harvested" value={`${Math.round(totals.kg / 1000).toLocaleString()} t`} icon={TrendingUp} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 text-sm font-semibold">Production share</div>
            <div className="h-72">
              {chart.length === 0 ? <EmptyState title="No production yet" /> : (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={chart} dataKey="kg" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                      {chart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variety</TableHead>
                  <TableHead className="text-right">Bins</TableHead>
                  <TableHead className="text-right">Actual kg</TableHead>
                  <TableHead className="text-right">Forecast kg</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).length === 0 ? (
                  <TableRow><TableCell colSpan={5}><EmptyState title="No varieties yet" /></TableCell></TableRow>
                ) : (data ?? []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.bins.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.kg.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{r.forecast.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">{totals.kg ? `${((r.kg / totals.kg) * 100).toFixed(1)}%` : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
