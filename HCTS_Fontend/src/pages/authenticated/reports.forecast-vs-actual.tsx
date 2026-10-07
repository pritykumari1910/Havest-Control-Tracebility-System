import { createFileRoute } from "@/lib/router-compat";
import { useMemo, useState } from "react";
import { useQuery } from "@/lib/useFetch";
import { db as supabase } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { GitCompareArrows, TrendingUp, TrendingDown, Wheat } from "lucide-react";
import { PageHeader, StatTile, SectionHeader, EmptyState } from "@/components/enterprise/page-shell";

export const Route = createFileRoute("/_authenticated/reports/forecast-vs-actual")({
  component: ForecastVsActualPage,
});

function ForecastVsActualPage() {
  const [groupBy, setGroupBy] = useState<"farm" | "variety">("farm");
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["forecast-vs-actual"],
    queryFn: async () => {
      const [binsRes, forecastRes, farmsRes, varsRes, weightRes] = await Promise.all([
        supabase.from("pallet_bins").select("farm_id, variety_id").limit(20000),
        supabase.from("forecasts").select("farm_id, variety_id, estimated_kg, status"),
        supabase.from("farms").select("id, name"),
        supabase.from("varieties").select("id, name"),
        supabase.from("operational_parameters").select("value").eq("key", "estimated_pallet_weight_kg").maybeSingle(),
      ]);
      const weightKg = Number(weightRes.data?.value ?? 300);
      const farms = new Map((farmsRes.data ?? []).map((f: any) => [f.id, f.name]));
      const vars_ = new Map((varsRes.data ?? []).map((v: any) => [v.id, v.name]));
      return {
        bins: binsRes.data ?? [],
        forecasts: (forecastRes.data ?? []).filter((f: any) => f.status === "validated"),
        farms, vars_, weightKg,
      };
    },
  });

  const table = useMemo(() => {
    if (!data) return [];
    const keyOf = (b: any) => (groupBy === "farm" ? b.farm_id : b.variety_id);
    const label = (id: string) => (groupBy === "farm" ? data.farms.get(id) : data.vars_.get(id)) ?? "—";
    const actual = new Map<string, number>();
    for (const b of data.bins) {
      const k = keyOf(b);
      if (!k) continue;
      actual.set(k, (actual.get(k) ?? 0) + data.weightKg);
    }
    const forecast = new Map<string, number>();
    for (const f of data.forecasts) {
      const k = groupBy === "farm" ? f.farm_id : f.variety_id;
      if (!k) continue;
      forecast.set(k, (forecast.get(k) ?? 0) + Number(f.estimated_kg ?? 0));
    }
    return [...new Set([...actual.keys(), ...forecast.keys()])].map((id) => {
      const a = actual.get(id) ?? 0;
      const f = forecast.get(id) ?? 0;
      const variance = f > 0 ? ((a - f) / f) * 100 : null;
      return {
        id,
        label: label(id),
        forecast: f,
        actual: a,
        variance,
        completion: f > 0 ? Math.min(100, (a / f) * 100) : null,
      };
    }).sort((x, y) => y.actual - x.actual);
  }, [data, groupBy]);

  const totals = useMemo(() => {
    const f = table.reduce((s, r) => s + r.forecast, 0);
    const a = table.reduce((s, r) => s + r.actual, 0);
    return { f, a, gap: a - f, pct: f > 0 ? (a / f) * 100 : 0 };
  }, [table]);

  const chartData = table.slice(0, 10).map((r) => ({
    label: r.label,
    forecast: Math.round(r.forecast / 1000),
    actual: Math.round(r.actual / 1000),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Reports"
        title="Forecast vs Actual"
        description="Compare validated forecasts against harvested production."
        isFetching={isFetching}
        onRefresh={() => refetch()}
        actions={
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="farm">By Farm</SelectItem>
              <SelectItem value="variety">By Variety</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Total forecast" value={<>{(totals.f / 1000).toFixed(1)}<span className="ml-1 text-sm text-muted-foreground">t</span></>} icon={Wheat} />
        <StatTile label="Total actual" value={<>{(totals.a / 1000).toFixed(1)}<span className="ml-1 text-sm text-muted-foreground">t</span></>} icon={GitCompareArrows} tone="success" />
        <StatTile label="Gap" value={<>{totals.gap >= 0 ? "+" : ""}{(totals.gap / 1000).toFixed(1)}<span className="ml-1 text-sm text-muted-foreground">t</span></>} icon={totals.gap >= 0 ? TrendingUp : TrendingDown} tone={totals.gap >= 0 ? "success" : "danger"} />
        <StatTile label="Achievement" value={`${totals.pct.toFixed(1)}%`} icon={TrendingUp} tone={totals.pct >= 90 ? "success" : "warning"} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider">Top {groupBy === "farm" ? "farms" : "varieties"} — tonnage</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-72">
            {chartData.length === 0 ? <EmptyState title="No data" /> : (
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} stroke="var(--muted-foreground)" unit="t" />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="forecast" name="Forecast" fill="var(--muted-foreground)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" name="Actual" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <div>
        <SectionHeader title="Detail" description={`Grouped by ${groupBy}. Sorted by actual production.`} />
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{groupBy === "farm" ? "Farm" : "Variety"}</TableHead>
                  <TableHead className="text-right">Forecast (kg)</TableHead>
                  <TableHead className="text-right">Actual (kg)</TableHead>
                  <TableHead className="text-right">Gap</TableHead>
                  <TableHead className="text-right">Achievement</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.length === 0 ? (
                  <TableRow><TableCell colSpan={6}><EmptyState title="No data" /></TableCell></TableRow>
                ) : table.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.label}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.forecast.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.actual.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={r.actual - r.forecast >= 0 ? "text-success" : "text-destructive"}>
                        {r.actual - r.forecast >= 0 ? "+" : ""}{(r.actual - r.forecast).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.completion == null ? "—" : (
                        <Badge variant={r.completion >= 90 ? "default" : r.completion >= 60 ? "secondary" : "outline"} className="tabular-nums">
                          {r.completion.toFixed(1)}%
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.variance == null ? "—" : (
                        <span className={r.variance >= 0 ? "text-success" : "text-destructive"}>
                          {r.variance >= 0 ? "+" : ""}{r.variance.toFixed(1)}%
                        </span>
                      )}
                    </TableCell>
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
