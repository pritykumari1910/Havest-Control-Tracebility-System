import { createFileRoute } from "@/lib/router-compat";
import { useState } from "react";
import { useQuery } from "@/lib/useFetch";
import { db as supabase } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Replace, ArrowRight } from "lucide-react";
import { PageHeader, StatTile, EmptyState } from "@/components/enterprise/page-shell";

export const Route = createFileRoute("/_authenticated/ops/variety-changes")({
  component: VarietyChangesPage,
});

function VarietyChangesPage() {
  const [selected, setSelected] = useState<any | null>(null);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["variety-change-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("audit_log")
        .select("*")
        .eq("record_type", "variety_change")
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  const total = data?.length ?? 0;
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = (data ?? []).filter((r: any) => (r.created_at ?? "").startsWith(today)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Operational Review"
        title="Variety Change Review"
        description="Audit exceptional mid-day variety changes. Approve legitimate changes and escalate anomalies."
        onRefresh={() => refetch()}
        isFetching={isFetching}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Total change events" value={total} icon={Replace} />
        <StatTile label="Today" value={todayCount} tone="warning" />
        <StatTile label="Pending review" value={total} tone="default" />
        <StatTile label="Approved" value={0} tone="success" />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider">Variety change events</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {total === 0 ? (
            <EmptyState title="No variety change events" description="Mid-day variety switches recorded by supervisors will appear here for engineer review." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Original variety</TableHead>
                  <TableHead />
                  <TableHead>New variety</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data!.map((r: any) => {
                  const prev = (r.previous_value ?? {}) as any;
                  const nxt = (r.new_value ?? {}) as any;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-xs">{r.record_id?.slice(0, 8)}…</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{prev.variety_name ?? prev.variety_id ?? "—"}</Badge></TableCell>
                      <TableCell><ArrowRight className="h-3.5 w-3.5 text-muted-foreground" /></TableCell>
                      <TableCell><Badge className="text-[10px]">{nxt.variety_name ?? nxt.variety_id ?? "—"}</Badge></TableCell>
                      <TableCell className="max-w-[220px] truncate text-xs">{r.reason ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelected(r)}>Timeline</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader><SheetTitle>Variety change timeline</SheetTitle></SheetHeader>
          {selected && (
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-md border p-3 text-xs">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Assignment</div>
                <div className="font-mono">{selected.record_id}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md border border-warning/40 bg-warning/5 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Original</div>
                  <pre className="mt-1 whitespace-pre-wrap break-words text-xs">{JSON.stringify(selected.previous_value, null, 2)}</pre>
                </div>
                <div className="rounded-md border border-success/40 bg-success/5 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">New</div>
                  <pre className="mt-1 whitespace-pre-wrap break-words text-xs">{JSON.stringify(selected.new_value, null, 2)}</pre>
                </div>
              </div>
              {selected.reason && (
                <div className="rounded-md border p-3 text-xs italic">"{selected.reason}"</div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm">Escalate</Button>
                <Button size="sm">Approve review</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
