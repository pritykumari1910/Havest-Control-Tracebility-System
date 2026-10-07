import { createFileRoute } from "@/lib/router-compat";
import { useMemo, useState } from "react";
import { useQuery } from "@/lib/useFetch";
import { db as supabase } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Coins, Truck, CheckCircle2 } from "lucide-react";
import { PageHeader, StatTile, EmptyState } from "@/components/enterprise/page-shell";

export const Route = createFileRoute("/_authenticated/reports/liquidation-summary")({
  component: LiquidationSummaryPage,
});

const PRICE = 1.85;

function LiquidationSummaryPage() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["liquidation-summary", from, to],
    queryFn: async () => {
      const [notesRes, wRes] = await Promise.all([
        (supabase as any).from("dispatch_notes")
          .select("id, note_number, note_date, status, buyer:buyers(id, code, name), destination:destination_centres(id, code, name), campaign:campaigns(code)")
          .gte("note_date", from).lte("note_date", to)
          .order("note_date", { ascending: false }),
        (supabase as any).from("operational_parameters").select("value").eq("key", "estimated_pallet_weight_kg").maybeSingle(),
      ]);
      const notes = notesRes.data ?? [];
      const ids = notes.map((n: any) => n.id);
      const bins = ids.length ? ((await (supabase as any).from("pallet_bins").select("dispatch_note_id").in("dispatch_note_id", ids)).data ?? []) : [];
      const weight = Number(wRes.data?.value ?? 400);
      const binsByNote = new Map<string, number>();
      for (const b of bins) binsByNote.set(b.dispatch_note_id!, (binsByNote.get(b.dispatch_note_id!) ?? 0) + 1);
      const rows = notes.map((n: any) => {
        const b = binsByNote.get(n.id) ?? 0;
        const kg = b * weight;
        return {
          id: n.id, note_number: n.note_number, date: n.note_date, status: n.status,
          buyer: n.buyer?.name ?? "—", destination: n.destination?.name ?? "—", campaign: n.campaign?.code ?? "—",
          bins: b, kg, value: kg * PRICE,
        };
      });
      return rows;
    },
  });

  const totals = useMemo(() => {
    const rows = data ?? [];
    return {
      notes: rows.length,
      closed: rows.filter((r: any) => r.status === "closed").length,
      kg: rows.reduce((s: number, r: any) => s + r.kg, 0),
      value: rows.reduce((s: number, r: any) => s + r.value, 0),
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Economics"
        title="Liquidation Summary"
        description="Consolidated liquidation value per dispatch note, buyer and destination."
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
        <StatTile label="Dispatch notes" value={totals.notes} icon={Truck} />
        <StatTile label="Closed / liquidated" value={totals.closed} icon={CheckCircle2} tone="success" />
        <StatTile label="Volume liquidated" value={`${Math.round(totals.kg / 1000).toLocaleString()} t`} icon={Coins} />
        <StatTile label="Estimated value" value={`€ ${Math.round(totals.value).toLocaleString()}`} icon={Coins} tone="warning" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Note</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Bins</TableHead>
                <TableHead className="text-right">Kg</TableHead>
                <TableHead className="text-right">Value €</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).length === 0 ? (
                <TableRow><TableCell colSpan={8}><EmptyState title="No dispatches in this range" /></TableCell></TableRow>
              ) : (data ?? []).map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.note_number}</TableCell>
                  <TableCell className="text-muted-foreground">{r.date}</TableCell>
                  <TableCell>{r.buyer}</TableCell>
                  <TableCell>{r.destination}</TableCell>
                  <TableCell><Badge variant={r.status === "closed" ? "default" : "secondary"} className="text-[10px] capitalize">{r.status}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums">{r.bins.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.kg.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{Math.round(r.value).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
