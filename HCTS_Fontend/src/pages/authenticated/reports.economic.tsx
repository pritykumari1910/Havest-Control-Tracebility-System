import { createFileRoute } from "@/lib/router-compat";
import { useMemo, useState } from "react";
import { useQuery } from "@/lib/useFetch";
import { db as supabase } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { LineChart, Download, Building2, Truck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reports/economic")({
  component: EconomicDashboard,
});

function EconomicDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);

  const { data, isLoading } = useQuery({
    queryKey: ["economic-dashboard", from, to],
    queryFn: async () => {
      const [notesRes, weightRes, campaignRes] = await Promise.all([
        supabase
          .from("dispatch_notes")
          .select("id, note_number, note_date, status, buyer:buyers(id, code, name), destination:destination_centres(id, code, name), campaign:campaigns(code)")
          .gte("note_date", from).lte("note_date", to)
          .order("note_date", { ascending: false }),
        supabase.from("operational_parameters").select("value").eq("key", "estimated_pallet_weight_kg").maybeSingle(),
        supabase.from("campaigns").select("code, name, status").eq("status", "active").maybeSingle(),
      ]);
      if (notesRes.error) throw notesRes.error;
      const notes = notesRes.data ?? [];
      const noteIds = notes.map((n: any) => n.id);
      const bins = noteIds.length
        ? (await supabase.from("pallet_bins").select("dispatch_note_id").in("dispatch_note_id", noteIds)).data ?? []
        : [];
      const weight = Number(weightRes.data?.value ?? 300);
      return { notes, bins, weight, campaign: campaignRes.data };
    },
  });

  const summary = useMemo(() => {
    if (!data) return null;
    const binsByNote = new Map<string, number>();
    for (const b of data.bins) binsByNote.set(b.dispatch_note_id!, (binsByNote.get(b.dispatch_note_id!) ?? 0) + 1);

    const byBuyer = new Map<string, { name: string; code: string; notes: number; bins: number; kg: number }>();
    const byDestination = new Map<string, { name: string; code: string; notes: number; bins: number; kg: number }>();

    for (const n of data.notes as any[]) {
      const b = binsByNote.get(n.id) ?? 0;
      const kg = b * data.weight;
      if (n.buyer) {
        const k = n.buyer.id;
        const cur = byBuyer.get(k) ?? { name: n.buyer.name, code: n.buyer.code, notes: 0, bins: 0, kg: 0 };
        cur.notes += 1; cur.bins += b; cur.kg += kg;
        byBuyer.set(k, cur);
      }
      if (n.destination) {
        const k = n.destination.id;
        const cur = byDestination.get(k) ?? { name: n.destination.name, code: n.destination.code, notes: 0, bins: 0, kg: 0 };
        cur.notes += 1; cur.bins += b; cur.kg += kg;
        byDestination.set(k, cur);
      }
    }

    const totalBins = data.bins.length;
    const totalKg = totalBins * data.weight;
    return {
      totalNotes: data.notes.length,
      totalBins, totalKg,
      byBuyer: Array.from(byBuyer.values()).sort((a, b) => b.kg - a.kg),
      byDestination: Array.from(byDestination.values()).sort((a, b) => b.kg - a.kg),
    };
  }, [data]);

  const exportCsv = () => {
    if (!summary) return;
    const lines = ["type,code,name,notes,bins,estimated_kg"];
    for (const b of summary.byBuyer) lines.push(`buyer,${b.code},"${b.name}",${b.notes},${b.bins},${b.kg}`);
    for (const d of summary.byDestination) lines.push(`destination,${d.code},"${d.name}",${d.notes},${d.bins},${d.kg}`);
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `economic_${from}_${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Economic Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Commercial visibility: buyer volume, destination mix, dispatch progress.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data?.campaign && (
            <Badge variant="secondary">Active: {data.campaign.code} · {data.campaign.name}</Badge>
          )}
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          <span className="text-sm text-muted-foreground">→</span>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1">
            <Download className="h-4 w-4" /> CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi label="Dispatch notes" value={summary?.totalNotes ?? 0} icon={Truck} />
        <Kpi label="Bins dispatched" value={summary?.totalBins ?? 0} icon={LineChart} />
        <Kpi
          label="Estimated volume"
          value={`${Math.round((summary?.totalKg ?? 0) / 1000).toLocaleString()} t`}
          icon={LineChart}
        />
        <Kpi label="Unique buyers" value={summary?.byBuyer.length ?? 0} icon={Building2} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By buyer</CardTitle>
            <CardDescription>Prices, liquidations and incentives configured per commercial agreement.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading…</p>
            ) : summary?.byBuyer.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Buyer</TableHead>
                    <TableHead className="text-right">Notes</TableHead>
                    <TableHead className="text-right">Bins</TableHead>
                    <TableHead className="text-right">Kg</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.byBuyer.map((b) => (
                    <TableRow key={b.code}>
                      <TableCell>
                        <div className="font-medium">{b.name}</div>
                        <div className="text-xs text-muted-foreground">{b.code}</div>
                      </TableCell>
                      <TableCell className="text-right">{b.notes}</TableCell>
                      <TableCell className="text-right">{b.bins}</TableCell>
                      <TableCell className="text-right">{b.kg.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="p-4 text-sm text-muted-foreground">No dispatches in this range.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">By destination</CardTitle>
            <CardDescription>Distribution across collection points and destination centres.</CardDescription>
          </CardHeader>
          <CardContent>
            {summary?.byDestination.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Destination</TableHead>
                    <TableHead className="text-right">Notes</TableHead>
                    <TableHead className="text-right">Bins</TableHead>
                    <TableHead className="text-right">Kg</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.byDestination.map((d) => (
                    <TableRow key={d.code}>
                      <TableCell>
                        <div className="font-medium">{d.name}</div>
                        <div className="text-xs text-muted-foreground">{d.code}</div>
                      </TableCell>
                      <TableCell className="text-right">{d.notes}</TableCell>
                      <TableCell className="text-right">{d.bins}</TableCell>
                      <TableCell className="text-right">{d.kg.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="p-4 text-sm text-muted-foreground">No destinations in this range.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Weight per bin uses the <code>estimated_pallet_weight_kg</code> operational parameter
        ({data?.weight ?? "—"} kg). Buyer prices, liquidation values and incentive calculations
        will populate once commercial agreements are entered.
      </p>
    </div>
  );
}

function Kpi({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-2xl font-semibold">{value}</div>
        </div>
        <Icon className="h-5 w-5 text-primary" />
      </CardContent>
    </Card>
  );
}
