import { createFileRoute } from "@/lib/router-compat";
import { useMemo, useState } from "react";
import { useQuery } from "@/lib/useFetch";
import { db as supabase } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Wrench, Search, History } from "lucide-react";
import { PageHeader, StatTile, EmptyState } from "@/components/enterprise/page-shell";

export const Route = createFileRoute("/_authenticated/ops/corrections")({
  component: CorrectionsPage,
});

function CorrectionsPage() {
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<any | null>(null);

  const { data: closed, isFetching, refetch } = useQuery({
    queryKey: ["closed-assignments", term],
    queryFn: async () => {
      let q = supabase
        .from("harvest_assignments")
        .select("id, work_date, status, updated_at, crews(name), farms(name, code), varieties(name), plots(code)")
        .eq("status", "closed")
        .order("work_date", { ascending: false })
        .limit(100);
      if (term) q = q.ilike("id", `%${term}%`);
      const { data } = await q;
      return data ?? [];
    },
  });

  const { data: correctionCount } = useQuery({
    queryKey: ["correction-count"],
    queryFn: async () => {
      const { count } = await supabase.from("audit_log").select("*", { count: "exact", head: true }).eq("action", "correction");
      return count ?? 0;
    },
  });

  const { data: history } = useQuery({
    enabled: !!selected?.id,
    queryKey: ["correction-history", selected?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("audit_log")
        .select("*")
        .eq("record_id", selected.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const totals = useMemo(() => ({
    closed: closed?.length ?? 0,
    withCorrections: (closed ?? []).filter((c: any) => c.updated_at && new Date(c.updated_at) > new Date(new Date(c.work_date).getTime() + 86400000)).length,
  }), [closed]);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Operational Review"
        title="Closed Record Corrections"
        description="Amend closed harvest assignments with a full audit trail. Every correction requires a reason."
        onRefresh={() => refetch()}
        isFetching={isFetching}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Closed records" value={totals.closed} icon={Wrench} />
        <StatTile label="With corrections" value={totals.withCorrections} tone="warning" />
        <StatTile label="Total corrections" value={correctionCount ?? "…"} tone="default" icon={History} />
        <StatTile label="Awaiting review" value={Math.max(0, totals.closed - totals.withCorrections)} sub="Not yet corrected" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider">Closed harvest assignments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Filter by assignment ID…" className="pl-8" />
          </div>
          {(closed?.length ?? 0) === 0 ? (
            <EmptyState title="No closed records" description="Nothing matches the current filter." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Farm · Plot</TableHead>
                  <TableHead>Crew</TableHead>
                  <TableHead>Variety</TableHead>
                  <TableHead>Closed date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {closed!.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.id.slice(0, 8)}…</TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">{r.farms?.name ?? "—"}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{r.farms?.code}{r.plots?.code ? ` · ${r.plots.code}` : ""}</div>
                    </TableCell>
                    <TableCell className="text-sm">{r.crews?.name ?? "—"}</TableCell>
                    <TableCell className="text-sm">{r.varieties?.name ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.work_date}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">Closed</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(r)}>Review</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Correction workspace</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-4 space-y-4 text-sm">
              <div className="rounded-md border p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Assignment</div>
                <div className="font-mono text-xs">{selected.id}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Farm</span><div className="font-medium">{selected.farms?.name}</div></div>
                  <div><span className="text-muted-foreground">Crew</span><div className="font-medium">{selected.crews?.name ?? "—"}</div></div>
                  <div><span className="text-muted-foreground">Variety</span><div className="font-medium">{selected.varieties?.name}</div></div>
                  <div><span className="text-muted-foreground">Closed</span><div className="font-medium">{selected.work_date}</div></div>
                </div>
              </div>

              <div>
                <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Workflow</div>
                <ol className="space-y-1 text-xs">
                  {["Open record","Modify data","Mandatory reason","Validation","Save correction","Audit log created"].map((s, i) => (
                    <li key={s} className="flex items-center gap-2">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">{i+1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Correction history</div>
                {(history?.length ?? 0) === 0 ? (
                  <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">No corrections logged for this record.</div>
                ) : (
                  <div className="space-y-2">
                    {history!.map((h: any) => (
                      <div key={h.id} className="rounded-md border p-2 text-xs">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[10px]">{h.action}</Badge>
                          <span className="text-[10px] text-muted-foreground">{new Date(h.created_at).toLocaleString()}</span>
                        </div>
                        {h.reason && <div className="mt-1 italic">"{h.reason}"</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-md border border-warning/40 bg-warning/5 p-3 text-xs text-muted-foreground">
                Submitting a correction is irreversible and records the previous value, new value, timestamp and your user identity in the audit log.
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
