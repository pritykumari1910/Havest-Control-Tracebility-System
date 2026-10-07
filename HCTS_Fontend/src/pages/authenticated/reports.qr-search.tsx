import { createFileRoute } from "@/lib/router-compat";
import { useState } from "react";
import { useQuery } from "@/lib/useFetch";
import { db as supabase } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, QrCode, ScanSearch } from "lucide-react";
import { PageHeader, EmptyState, StatTile } from "@/components/enterprise/page-shell";

export const Route = createFileRoute("/_authenticated/reports/qr-search")({
  component: QrSearchPage,
});

function QrSearchPage() {
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");

  const { data, isFetching, refetch } = useQuery({
    enabled: !!query,
    queryKey: ["qr-search", query],
    queryFn: async () => {
      const s = query.trim();
      if (!s) return { qrs: [], bins: [] };

      const { data: qrs } = await supabase
        .from("qr_codes")
        .select("id, code, status, series_id, pallet_bin_id, assignment_id, created_at")
        .ilike("code", `%${s}%`)
        .limit(50);

      const qrIds = (qrs ?? []).map((q: any) => q.id);
      let bins: any[] = [];
      if (qrIds.length) {
        const { data: b } = await supabase
          .from("pallet_bins")
          .select("id, qr_code_id, work_date, received_at, is_unassigned, dispatch_note_id, farms(name, code), varieties(name), crews(name), machines(name), workers:operator_worker_id(full_name), plots(code), assignment_id, dispatch_notes(note_number)")
          .in("qr_code_id", qrIds);
        bins = b ?? [];
      }
      return { qrs: qrs ?? [], bins };
    },
  });

  const binByQr = new Map((data?.bins ?? []).map((b: any) => [b.qr_code_id, b]));

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Traceability"
        title="QR Search"
        description="Locate a pallet bin from any QR code fragment and inspect its full traceability chain."
        onRefresh={query ? () => refetch() : undefined}
        isFetching={isFetching}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider">Search</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(term);
            }}
          >
            <div className="relative flex-1 min-w-64">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Scan or type QR code (partial allowed)…"
                className="pl-8"
              />
            </div>
            <Button type="submit" size="sm" className="gap-1.5">
              <ScanSearch className="h-4 w-4" /> Search
            </Button>
            {query && (
              <Button type="button" variant="ghost" size="sm" onClick={() => { setTerm(""); setQuery(""); }}>Clear</Button>
            )}
          </form>
        </CardContent>
      </Card>

      {query && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="QR matches" value={data?.qrs.length ?? (isFetching ? "…" : 0)} icon={QrCode} />
          <StatTile label="With pallet" value={data?.bins.length ?? (isFetching ? "…" : 0)} tone="success" />
          <StatTile label="Unassigned" value={(data?.bins ?? []).filter((b: any) => b.is_unassigned).length} tone="warning" />
          <StatTile label="Dispatched" value={(data?.bins ?? []).filter((b: any) => b.dispatch_note_id).length} tone="default" />
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider">Results</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!query ? (
            <EmptyState title="Enter a QR code to begin" description="Search matches on any part of the QR string and resolves the pallet bin, farm, plot, variety, crew and dispatch note." />
          ) : isFetching ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Searching…</div>
          ) : (data?.qrs.length ?? 0) === 0 ? (
            <EmptyState title="No QR codes match" description={`Nothing found for "${query}".`} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>QR</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Farm · Plot</TableHead>
                  <TableHead>Variety</TableHead>
                  <TableHead>Crew · Operator</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Dispatch</TableHead>
                  <TableHead>Work date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.qrs ?? []).map((q: any) => {
                  const b = binByQr.get(q.id);
                  return (
                    <TableRow key={q.id}>
                      <TableCell className="font-mono text-xs">{q.code}</TableCell>
                      <TableCell>
                        <Badge variant={q.status === "used" ? "default" : q.status === "available" ? "secondary" : "outline"} className="text-[10px]">{q.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {b?.farms ? (
                          <>
                            <div className="font-medium">{b.farms.name}</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{b.farms.code}{b.plots?.code ? ` · ${b.plots.code}` : ""}</div>
                          </>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-sm">{b?.varieties?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm">
                        {b?.crews?.name ?? "—"}
                        {b?.workers?.full_name && <div className="text-[10px] text-muted-foreground">{b.workers.full_name}</div>}
                      </TableCell>
                      <TableCell className="text-sm">{b?.machines?.name ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{b?.dispatch_notes?.note_number ?? (b?.is_unassigned ? <Badge variant="outline" className="text-[10px]">Unassigned</Badge> : "—")}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{b?.work_date ?? "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
