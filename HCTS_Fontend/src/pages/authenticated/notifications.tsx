
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BellRing, ClipboardCheck, Truck, AlertTriangle, Package, ArrowRight, Link } from "lucide-react";
import { PageHeader, StatTile, EmptyState } from "@/components/enterprise/page-shell";



const REFRESH_MS = 30_000;

function NotificationsPage() {
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["notifications-center"],
    refetchInterval: REFRESH_MS,
    queryFn: async () => {
      const threeDays = new Date(Date.now() - 3 * 86400_000).toISOString().slice(0, 10);
      const [forecasts, dispatches, incidents, unassigned] = await Promise.all([
        supabase.from("forecasts").select("id, status, plot_id, campaign_id, created_at, plots(code), varieties(name)").eq("status", "draft").order("created_at", { ascending: false }).limit(20),
        supabase.from("dispatch_notes").select("id, note_number, status, note_date, buyers(name)").eq("status", "draft").lt("note_date", threeDays).order("note_date", { ascending: true }).limit(20),
        supabase.from("pallet_incidents").select("id, category, comment, registered_at, pallet_bin_id").order("registered_at", { ascending: false }).limit(20),
        supabase.from("pallet_bins").select("id", { count: "exact", head: true }).eq("is_unassigned", true),
      ]);
      return {
        forecasts: forecasts.data ?? [],
        dispatches: dispatches.data ?? [],
        incidents: incidents.data ?? [],
        unassignedCount: unassigned.count ?? 0,
      };
    },
  });

  const total =
    (data?.forecasts.length ?? 0) +
    (data?.dispatches.length ?? 0) +
    (data?.incidents.length ?? 0) +
    ((data?.unassignedCount ?? 0) > 0 ? 1 : 0);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Personal"
        title="Notifications"
        description="Real-time alerts for forecast approvals, delayed dispatches, pallet incidents, unassigned bins and operational issues."
        live
        isFetching={isFetching}
        onRefresh={() => refetch()}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Total alerts" value={total} icon={BellRing} tone={total > 0 ? "warning" : "success"} />
        <StatTile label="Forecasts pending" value={data?.forecasts.length ?? 0} icon={ClipboardCheck} tone={(data?.forecasts.length ?? 0) > 0 ? "warning" : "default"} />
        <StatTile label="Delayed dispatch" value={data?.dispatches.length ?? 0} icon={Truck} tone={(data?.dispatches.length ?? 0) > 0 ? "danger" : "default"} />
        <StatTile label="Recent incidents" value={data?.incidents.length ?? 0} icon={AlertTriangle} tone={(data?.incidents.length ?? 0) > 0 ? "danger" : "default"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between gap-4 space-y-0">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider">Forecast approvals</CardTitle>
            <Link to="/reports/forecasts/approvals" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">Open <ArrowRight className="h-3 w-3" /></Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {data?.forecasts.length === 0 ? (
              <EmptyState title="No forecasts awaiting review" />
            ) : (data?.forecasts ?? []).map((f: any) => (
              <div key={f.id} className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2 text-sm">
                <div>
                  <div className="font-medium">{f.plots?.code ?? "—"} · {f.varieties?.name ?? "—"}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{new Date(f.created_at).toLocaleString()}</div>
                </div>
                <Badge variant="outline" className="text-[10px]">Draft</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between gap-4 space-y-0">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider">Delayed dispatches</CardTitle>
            <Link to="/reports/dispatch-status" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">Open <ArrowRight className="h-3 w-3" /></Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {data?.dispatches.length === 0 ? (
              <EmptyState title="Every dispatch is on schedule" />
            ) : (data?.dispatches ?? []).map((d: any) => (
              <div key={d.id} className="flex items-center justify-between rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm">
                <div>
                  <div className="font-mono text-xs">{d.note_number ?? d.id.slice(0, 8)}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{d.buyers?.name ?? "—"} · {d.note_date}</div>
                </div>
                <Badge variant="destructive" className="text-[10px]">Delayed</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between gap-4 space-y-0">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider">Pallet incidents</CardTitle>
            <Link to="/ops/live" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">Live ops <ArrowRight className="h-3 w-3" /></Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {data?.incidents.length === 0 ? (
              <EmptyState title="No incidents reported" />
            ) : (data?.incidents ?? []).map((i: any) => (
              <div key={i.id} className="flex items-start justify-between gap-3 rounded-md border border-border/70 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="font-medium capitalize">{i.category}</div>
                  {i.comment && <div className="truncate text-xs text-muted-foreground">{i.comment}</div>}
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{new Date(i.registered_at).toLocaleString()}</div>
                </div>
                <Badge variant="outline" className="text-[10px]">Incident</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between gap-4 space-y-0">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider">Inventory alerts</CardTitle>
            <Link to="/ops/unassigned" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">Resolve <ArrowRight className="h-3 w-3" /></Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.unassignedCount ?? 0) === 0 ? (
              <EmptyState title="No unassigned bins" />
            ) : (
              <div className="flex items-center justify-between rounded-md border border-warning/40 bg-warning/5 px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-warning" />
                  <div>
                    <div className="font-medium">{data?.unassignedCount} unassigned pallet bins</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Awaiting assignment to a dispatch note</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px]">Action</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default NotificationsPage;