import { createFileRoute } from "@/lib/router-compat";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@/lib/useFetch";
import { db as supabase } from "@/lib/db";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Filter } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reports/forecasts/approvals")({
  component: ForecastApprovals,
});

// Domain terms map onto DB forecast_status enum:
//   pending  = 'draft'     (submitted, awaiting director sign-off)
//   approved = 'validated' (official operational target)
//   rejected = 'revised'   (sent back for correction)
type StatusFilter = "pending" | "approved" | "rejected" | "closed" | "all";
const FILTER_TO_DB: Record<Exclude<StatusFilter, "all">, "draft" | "validated" | "revised" | "closed"> = {
  pending: "draft",
  approved: "validated",
  rejected: "revised",
  closed: "closed",
};

function ForecastApprovals() {
  const { roles, user } = useAuth();
  const canApprove = roles.includes("operations_director") || roles.includes("system_administrator");
  const qc = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [reason, setReason] = useState("");

  const { data: rows, isLoading } = useQuery({
    queryKey: ["forecast-approvals", status],
    queryFn: async () => {
      let q = supabase.from("forecasts")
        .select("*, farm:farms(name), plot:plots(name), valve:valves(name), variety:varieties(name), campaign:campaigns(code, name)")
        .order("updated_at", { ascending: false });
      if (status !== "all") q = q.eq("status", FILTER_TO_DB[status]);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const mutate = useMutation({
    mutationFn: async ({ id, newStatus, note, prev }: { id: string; newStatus: "validated" | "revised"; note?: string; prev: any }) => {
      const { error } = await supabase.from("forecasts")
        .update({ status: newStatus, comments: note ?? prev.comments })
        .eq("id", id);
      if (error) throw error;
      await supabase.rpc("write_audit", {
        _module: "forecasts",
        _record_type: "forecast",
        _record_id: id,
        _action: newStatus === "validated" ? "approve" : "reject",
        _previous: { status: prev.status, comments: prev.comments } as any,
        _new: { status: newStatus, comments: note ?? prev.comments } as any,
        _reason: note ?? undefined,
      });
    },
    onSuccess: (_, vars) => {
      toast.success(vars.newStatus === "validated" ? "Forecast approved" : "Forecast rejected");
      qc.invalidateQueries({ queryKey: ["forecast-approvals"] });
      qc.invalidateQueries({ queryKey: ["ops-director-dashboard"] });
      setRejectTarget(null);
      setReason("");
    },
    onError: (e: any) => toast.error(e?.message ?? "Action failed"),
  });

  const statusLabel = (s: string) => {
    switch (s) {
      case "validated": return { label: "Approved", tone: "secondary" as const };
      case "revised": return { label: "Rejected", tone: "destructive" as const };
      case "draft": return { label: "Pending", tone: "default" as const };
      case "closed": return { label: "Closed", tone: "outline" as const };
      default: return { label: s, tone: "outline" as const };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Forecast Approvals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review harvest forecasts submitted by operational staff. Approvals become official production targets.
          </p>
        </div>
        {!canApprove && (
          <Badge variant="outline">View-only — approval requires Operations Director</Badge>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base">Forecasts</CardTitle>
            <CardDescription>{rows?.length ?? 0} records</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {(["pending", "approved", "rejected", "closed", "all"] as StatusFilter[]).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={status === s ? "default" : "outline"}
                onClick={() => setStatus(s)}
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading…</p>
          ) : rows && rows.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Farm</TableHead>
                  <TableHead>Plot / Valve</TableHead>
                  <TableHead>Variety</TableHead>
                  <TableHead className="text-right">Surface (ha)</TableHead>
                  <TableHead className="text-right">Estimated kg</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.campaign?.code ?? "—"}</TableCell>
                    <TableCell>{r.farm?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.plot?.name ?? "—"}{r.valve?.name ? ` · ${r.valve.name}` : ""}
                    </TableCell>
                    <TableCell>{r.variety?.name ?? "—"}</TableCell>
                    <TableCell className="text-right">{r.surface_ha?.toLocaleString() ?? "—"}</TableCell>
                    <TableCell className="text-right">{r.estimated_kg?.toLocaleString() ?? "—"}</TableCell>
                    <TableCell>
                      {(() => { const s = statusLabel(r.status); return <Badge variant={s.tone}>{s.label}</Badge>; })()}
                    </TableCell>
                    <TableCell className="text-right">
                      {canApprove && r.status === "draft" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => mutate.mutate({ id: r.id, newStatus: "validated", prev: r })}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1 text-destructive"
                            onClick={() => setRejectTarget(r)}
                          >
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="p-6 text-sm text-muted-foreground">No forecasts in this status.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject forecast</DialogTitle>
            <DialogDescription>
              Provide a reason. This is recorded in the audit log against user {user?.email}.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!reason.trim() || mutate.isPending}
              onClick={() => rejectTarget && mutate.mutate({
                id: rejectTarget.id, newStatus: "revised", note: reason.trim(), prev: rejectTarget,
              })}
            >
              Reject forecast
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
