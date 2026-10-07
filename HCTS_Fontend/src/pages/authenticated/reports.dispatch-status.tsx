import { createFileRoute } from "@/lib/router-compat";
import { useMemo, useState } from "react";
import { useQuery } from "@/lib/useFetch";
import { db as supabase } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Truck, Send, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { PageHeader, StatTile, EmptyState } from "@/components/enterprise/page-shell";

export const Route = createFileRoute("/_authenticated/reports/dispatch-status")({
  component: DispatchStatusPage,
});

const REFRESH_MS = 30_000;

function DispatchStatusPage() {
  const [q, setQ] = useState("");
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["dispatch-status"],
    refetchInterval: REFRESH_MS,
    queryFn: async () => {
      const [notesRes, buyersRes, binsRes, weightRes] = await Promise.all([
        supabase.from("dispatch_notes").select("id, note_number, status, note_date, buyer_id, transport_id, destination, created_at").order("note_date", { ascending: false }).limit(500),
        supabase.from("buyers").select("id, name, code"),
        supabase.from("pallet_bins").select("dispatch_note_id").not("dispatch_note_id", "is", null).limit(20000),
        supabase.from("operational_parameters").select("value").eq("key", "estimated_pallet_weight_kg").maybeSingle(),
      ]);
      const buyers = new Map((buyersRes.data ?? []).map((b: any) => [b.id, b]));
      const binsByNote = new Map<string, number>();
      for (const b of (binsRes.data ?? [])) {
        if (!b.dispatch_note_id) continue;
        binsByNote.set(b.dispatch_note_id, (binsByNote.get(b.dispatch_note_id) ?? 0) + 1);
      }
      const weightKg = Number(weightRes.data?.value ?? 300);
      const threeDays = Date.now() - 3 * 86400_000;

      const rows = (notesRes.data ?? []).map((n: any) => {
        const bins = binsByNote.get(n.id) ?? 0;
        const delayed = n.status === "draft" && n.note_date && new Date(n.note_date).getTime() < threeDays;
        return {
          ...n,
          buyer: buyers.get(n.buyer_id)?.name ?? "—",
          buyerCode: buyers.get(n.buyer_id)?.code ?? "",
          bins,
          kg: bins * weightKg,
          delayed,
        };
      });

      return {
        rows,
        weightKg,
        counts: {
          open: rows.filter((r) => r.status === "draft").length,
          closed: rows.filter((r) => r.status === "closed").length,
          delayed: rows.filter((r) => r.delayed).length,
          total: rows.length,
        },
      };
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const s = q.trim().toLowerCase();
    if (!s) return data.rows;
    return data.rows.filter((r) =>
      (r.note_number ?? "").toLowerCase().includes(s) ||
      (r.buyer ?? "").toLowerCase().includes(s) ||
      (r.destination ?? "").toLowerCase().includes(s),
    );
  }, [data, q]);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Operations"
        title="Dispatch Status"
        description="Board of dispatch notes across every status — open, closed and delayed."
        live
        isFetching={isFetching}
        onRefresh={() => refetch()}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Open" value={data?.counts.open ?? "—"} icon={Send} tone="warning" />
        <StatTile label="Closed" value={data?.counts.closed ?? "—"} icon={CheckCircle2} tone="success" />
        <StatTile label="Delayed >3d" value={data?.counts.delayed ?? "—"} icon={AlertCircle} tone={(data?.counts.delayed ?? 0) > 0 ? "danger" : "default"} />
        <StatTile label="Total notes" value={data?.counts.total ?? "—"} icon={Truck} />
      </div>

      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider">Dispatch notes</CardTitle>
          <Input placeholder="Search note, buyer or destination…" value={q} onChange={(e) => setQ(e.target.value)} className="h-8 max-w-xs text-xs" />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Note</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead className="text-right">Bins</TableHead>
                <TableHead className="text-right">Est. kg</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7}><EmptyState title={q ? "No matches" : "No dispatch notes yet"} /></TableCell></TableRow>
              ) : filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.note_number ?? r.id.slice(0, 8)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.note_date ?? "—"}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{r.buyer}</div>
                    {r.buyerCode && <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{r.buyerCode}</div>}
                  </TableCell>
                  <TableCell className="text-sm">{r.destination ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.bins}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.kg.toLocaleString()}</TableCell>
                  <TableCell>
                    {r.delayed ? (
                      <Badge variant="destructive" className="gap-1 text-[10px]"><Clock className="h-3 w-3" /> Delayed</Badge>
                    ) : r.status === "closed" ? (
                      <Badge variant="secondary" className="text-[10px]">Closed</Badge>
                    ) : (
                      <Badge variant="default" className="text-[10px]">Open</Badge>
                    )}
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
