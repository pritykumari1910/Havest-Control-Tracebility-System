import { createFileRoute } from "@/lib/router-compat";
import { useMemo, useState } from "react";
import { useQuery } from "@/lib/useFetch";
import { db as supabase } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, FileText, Activity, Truck, ClipboardList, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader, StatTile, EmptyState } from "@/components/enterprise/page-shell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/reports/operational-changes")({
  component: OperationalChangesPage,
});

const OPS_MODULES = ["harvest_assignments", "pallet_bins", "reception", "dispatch", "transfers", "crews", "pallet_incidents"];

function OperationalChangesPage() {
  const [search, setSearch] = useState("");
  const [module, setModule] = useState<string>("all");
  const [viewing, setViewing] = useState<any | null>(null);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["operational-changes"],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .in("module", OPS_MODULES)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (data ?? []).filter((r: any) => {
      if (module !== "all" && r.module !== module) return false;
      if (!s) return true;
      return `${r.module} ${r.record_type} ${r.action}`.toLowerCase().includes(s);
    });
  }, [data, search, module]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of data ?? []) c[r.module] = (c[r.module] ?? 0) + 1;
    return c;
  }, [data]);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Audit & Compliance"
        title="Operational Changes"
        description="Focused audit trail of edits to live operational state — assignments, reception, dispatch, transfers and incidents."
        live
        isFetching={isFetching}
        onRefresh={() => refetch()}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatTile label="Assignments" value={counts.harvest_assignments ?? 0} icon={ClipboardList} />
        <StatTile label="Pallet bins" value={counts.pallet_bins ?? 0} icon={Package} />
        <StatTile label="Reception" value={counts.reception ?? 0} icon={Activity} />
        <StatTile label="Dispatch" value={counts.dispatch ?? 0} icon={Truck} />
        <StatTile label="Incidents" value={counts.pallet_incidents ?? 0} icon={FileText} tone={(counts.pallet_incidents ?? 0) > 0 ? "warning" : "default"} />
      </div>

      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider">Change feed</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={module} onValueChange={setModule}>
              <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modules</SelectItem>
                {OPS_MODULES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-8 h-8 max-w-xs text-xs" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Record</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={6}><EmptyState title={isFetching ? "Loading…" : "No operational changes"} /></TableCell></TableRow>
              ) : rows.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{r.module}</Badge></TableCell>
                  <TableCell className="text-sm">{r.record_type}<div className="font-mono text-[10px] text-muted-foreground">{r.record_id?.slice(0, 8) ?? "—"}</div></TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px]">{r.action}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{r.user_id?.slice(0, 8) ?? "—"}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => setViewing(r)}>View diff</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Operational change · {viewing?.action}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 rounded-md border p-3 text-xs">
                <div><span className="text-muted-foreground">When:</span> {new Date(viewing.created_at).toLocaleString()}</div>
                <div><span className="text-muted-foreground">Module:</span> {viewing.module}</div>
                <div><span className="text-muted-foreground">Record:</span> {viewing.record_type} · {viewing.record_id?.slice(0, 8) ?? "—"}</div>
                <div><span className="text-muted-foreground">User:</span> {viewing.user_id?.slice(0, 8) ?? "—"}</div>
                {viewing.reason && <div className="col-span-2"><span className="text-muted-foreground">Reason:</span> {viewing.reason}</div>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Previous</div>
                  <pre className="max-h-72 overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(viewing.previous_value, null, 2)}</pre>
                </div>
                <div>
                  <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">New</div>
                  <pre className="max-h-72 overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(viewing.new_value, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
