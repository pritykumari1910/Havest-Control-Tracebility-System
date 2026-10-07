import { createFileRoute } from "@/lib/router-compat";
import { useMemo, useState } from "react";
import { useQuery } from "@/lib/useFetch";
import { db as supabase } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, Building2 } from "lucide-react";
import { PageHeader, StatTile, EmptyState } from "@/components/enterprise/page-shell";

export const Route = createFileRoute("/_authenticated/reports/price-dashboard")({
  component: PriceDashboardPage,
});

const DEFAULT_PRICE = 1.85; // €/kg placeholder — until commercial agreements are entered

function PriceDashboardPage() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["price-dashboard", from, to],
    queryFn: async () => {
      const [notesRes, wRes] = await Promise.all([
        (supabase as any).from("dispatch_notes")
          .select("id, note_number, note_date, status, buyer:buyers(id, code, name)")
          .gte("note_date", from).lte("note_date", to)
          .order("note_date", { ascending: false }),
        (supabase as any).from("operational_parameters").select("value").eq("key", "estimated_pallet_weight_kg").maybeSingle(),
      ]);
      const notes = notesRes.data ?? [];
      const ids = notes.map((n: any) => n.id);
      const bins = ids.length ? ((await (supabase as any).from("pallet_bins").select("dispatch_note_id").in("dispatch_note_id", ids)).data ?? []) : [];
      const weight = Number(wRes.data?.value ?? 400);
      return { notes, bins, weight };
    },
  });

  const summary = useMemo(() => {
    if (!data) return null;
    const binsByNote = new Map<string, number>();
    for (const b of data.bins) binsByNote.set(b.dispatch_note_id!, (binsByNote.get(b.dispatch_note_id!) ?? 0) + 1);
    const byBuyer = new Map<string, { name: string; code: string; bins: number; kg: number; revenue: number; price: number }>();
    for (const n of data.notes as any[]) {
      if (!n.buyer) continue;
      const b = binsByNote.get(n.id) ?? 0;
      const kg = b * data.weight;
      const cur = byBuyer.get(n.buyer.id) ?? { name: n.buyer.name, code: n.buyer.code, bins: 0, kg: 0, revenue: 0, price: DEFAULT_PRICE };
      cur.bins += b; cur.kg += kg; cur.revenue += kg * DEFAULT_PRICE;
      byBuyer.set(n.buyer.id, cur);
    }
    const list = [...byBuyer.values()].sort((a, b) => b.revenue - a.revenue);
    const totalKg = list.reduce((s, r) => s + r.kg, 0);
    const revenue = list.reduce((s, r) => s + r.revenue, 0);
    return { list, totalKg, revenue, avgPrice: totalKg ? revenue / totalKg : DEFAULT_PRICE };
  }, [data]);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Economics"
        title="Price Dashboard"
        description="Average selling price and buyer trend analysis across dispatches."
        live
        isFetching={isFetching}
        onRefresh={() => refetch()}
        actions={
          <>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 w-36 text-xs" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 w-36 text-xs" />
          </>
        }
      />

      <div className="grid gap-3 md:grid-cols-4">
        <StatTile label="Buyers" value={summary?.list.length ?? 0} icon={Building2} />
        <StatTile label="Volume shipped" value={`${Math.round((summary?.totalKg ?? 0) / 1000).toLocaleString()} t`} icon={TrendingUp} />
        <StatTile label="Estimated revenue" value={`€ ${Math.round(summary?.revenue ?? 0).toLocaleString()}`} icon={DollarSign} tone="success" />
        <StatTile label="Avg price / kg" value={`€ ${(summary?.avgPrice ?? 0).toFixed(2)}`} icon={DollarSign} tone="warning" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Buyer</TableHead>
                <TableHead className="text-right">Bins</TableHead>
                <TableHead className="text-right">Kg</TableHead>
                <TableHead className="text-right">Price €/kg</TableHead>
                <TableHead className="text-right">Revenue €</TableHead>
                <TableHead className="text-right">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!summary || summary.list.length === 0 ? (
                <TableRow><TableCell colSpan={6}><EmptyState title="No dispatches in this range" /></TableCell></TableRow>
              ) : summary.list.map((r) => (
                <TableRow key={r.code}>
                  <TableCell>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-[11px] text-muted-foreground">{r.code}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.bins.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.kg.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{Math.round(r.revenue).toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {summary.revenue ? `${((r.revenue / summary.revenue) * 100).toFixed(1)}%` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-[11px] text-muted-foreground">
        Prices use the default reference of € {DEFAULT_PRICE.toFixed(2)}/kg until buyer-specific commercial agreements are entered.
      </p>
    </div>
  );
}
