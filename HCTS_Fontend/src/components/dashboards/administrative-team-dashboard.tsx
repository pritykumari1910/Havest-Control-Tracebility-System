import { useMemo } from "react";
import { useQuery } from "@/lib/useFetch";
import { Link } from "@/lib/router-compat";
import { db as supabase } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Scale, ClipboardCheck, Coins, CheckCircle2, Truck, Users, AlertTriangle, TrendingUp, Send,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Legend, PieChart as RePieChart, Pie, Cell,
} from "recharts";
import { PageHeader, StatTile, SectionHeader } from "@/components/enterprise/page-shell";

const REFRESH_MS = 30_000;
const CHART_COLORS = ["var(--primary)","var(--success)","var(--warning)","var(--destructive)","var(--accent)","var(--muted-foreground)"];

// realistic seeded values
const BUYER_ROWS = [
  { buyer: "Fresh Global SA", pending: 4, reconciled: 12, liquidated: 8 },
  { buyer: "Iberian Fruits", pending: 2, reconciled: 9, liquidated: 6 },
  { buyer: "EuroPack Ltd", pending: 6, reconciled: 15, liquidated: 11 },
  { buyer: "Mediterráneo Export", pending: 3, reconciled: 7, liquidated: 5 },
  { buyer: "Atlantic Produce", pending: 1, reconciled: 6, liquidated: 4 },
];

const WEIGHT_TREND = Array.from({ length: 14 }, (_, i) => {
  const day = new Date(); day.setDate(day.getDate() - (13 - i));
  const dispatch = 18000 + Math.round(Math.sin(i * 0.6) * 3000 + i * 200);
  const buyer = Math.round(dispatch * (0.965 + Math.random() * 0.02));
  return { day: day.toISOString().slice(5, 10), dispatch, buyer };
});

const CLASS_DIST = [
  { name: "Grade A", value: 62 },
  { name: "Grade B", value: 24 },
  { name: "Grade C", value: 9 },
  { name: "Rejected", value: 5 },
];

export function AdministrativeTeamDashboard({ userEmail }: { userEmail?: string | null }) {
  const today = new Date().toISOString().slice(0, 10);

  const { data: campaign } = useQuery({
    queryKey: ["at-campaign"],
    queryFn: async () => {
      const { data } = await supabase.from("campaigns").select("id, name").eq("status", "active").maybeSingle();
      return data as { id: string; name: string } | null;
    },
  });

  const { data: kpi, isFetching, refetch } = useQuery({
    queryKey: ["at-kpi", today, campaign?.id],
    refetchInterval: REFRESH_MS,
    queryFn: async () => {
      const [dispatchedAll, dispatchedToday, draft, buyers] = await Promise.all([
        supabase.from("dispatch_notes").select("*", { count: "exact", head: true }).eq("status", "dispatched"),
        supabase.from("dispatch_notes").select("*", { count: "exact", head: true }).eq("note_date", today),
        supabase.from("dispatch_notes").select("*", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("buyers").select("*", { count: "exact", head: true }),
      ]);
      return {
        dispatchedAll: dispatchedAll.count ?? 0,
        dispatchedToday: dispatchedToday.count ?? 0,
        draft: draft.count ?? 0,
        buyers: buyers.count ?? 0,
      };
    },
  });

  const buyerChart = useMemo(() => BUYER_ROWS.map(r => ({ ...r, total: r.pending + r.reconciled + r.liquidated })), []);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Commercial"
        title={`Commercial Operations${campaign?.name ? ` — ${campaign.name}` : ""}`}
        description={userEmail ? `Signed in as ${userEmail}` : "Administrative Team workspace"}
        live
        isFetching={isFetching}
        onRefresh={() => refetch()}
        actions={<Badge variant="outline" className="gap-1 text-[10px]">Administrative Team</Badge>}
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
        <StatTile label="Pending Buyer Deliveries" value={16} sub="Awaiting buyer confirmation" icon={Truck} tone="warning" />
        <StatTile label="Delivery Notes Pending" value={9} sub="Draft not yet submitted" icon={FileText} tone="warning" />
        <StatTile label="Weight Reconciliation" value={7} sub="Awaiting review" icon={Scale} tone="warning" />
        <StatTile label="Classification Pending" value={5} sub="Commercial grading" icon={ClipboardCheck} />
        <StatTile label="Liquidations Pending" value={4} sub="Awaiting approval" icon={Coins} tone="warning" />
        <StatTile label="Completed Settlements" value={22} sub="Campaign to date" icon={CheckCircle2} tone="success" />
        <StatTile label="Today's Dispatches" value={kpi?.dispatchedToday ?? "—"} sub={`${kpi?.dispatchedAll ?? 0} campaign total`} icon={Send} />
        <StatTile label="Buyers Served" value={kpi?.buyers ?? "—"} sub="Active commercial partners" icon={Users} />
        <StatTile label="Weight Difference Alerts" value={3} sub="Beyond tolerance ±2%" icon={AlertTriangle} tone="danger" />
        <StatTile label="Commercial Exceptions" value={2} sub="Requires attention" icon={AlertTriangle} tone="danger" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Dispatch vs Buyer Weight (14d)</CardTitle></CardHeader>
          <CardContent className="h-[260px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {/* <LineChart data={WEIGHT_TREND} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}t`} />
                <Tooltip formatter={(v: any) => `${Number(v).toLocaleString()} kg`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="dispatch" stroke="var(--primary)" strokeWidth={2} dot={false} name="Dispatch weight" />
                <Line type="monotone" dataKey="buyer" stroke="var(--success)" strokeWidth={2} dot={false} name="Buyer weight" />
              </LineChart> */}
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Classification Distribution</CardTitle></CardHeader>
          <CardContent className="h-[260px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {/* <RePieChart>
                <Pie data={CLASS_DIST} dataKey="value" nameKey="name" outerRadius={80} label={{ fontSize: 11 }}>
                  {CLASS_DIST.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RePieChart> */}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div>
        <SectionHeader title="Buyer activity" description="Delivery notes, reconciliations and liquidations by buyer" />
        <Card>
          <CardContent className="h-[280px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              {/* <BarChart data={buyerChart} layout="vertical" margin={{ top: 8, right: 16, left: 80, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="buyer" tick={{ fontSize: 11 }} width={140} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="pending" stackId="a" fill="var(--warning)" name="Pending" />
                <Bar dataKey="reconciled" stackId="a" fill="var(--primary)" name="Reconciled" />
                <Bar dataKey="liquidated" stackId="a" fill="var(--success)" name="Liquidated" />
              </BarChart> */}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary"/> Quick actions</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Link to="/commercial/$section" params={{ section: "buyer-delivery-notes" }} className="block rounded-md border p-3 hover:border-primary/40 hover:bg-muted/40">Manage Buyer Delivery Notes →</Link>
            <Link to="/commercial/$section" params={{ section: "weight-reconciliation" }} className="block rounded-md border p-3 hover:border-primary/40 hover:bg-muted/40">Weight Reconciliation Workspace →</Link>
            <Link to="/commercial/$section" params={{ section: "liquidation" }} className="block rounded-md border p-3 hover:border-primary/40 hover:bg-muted/40">Liquidation Management →</Link>
            <Link to="/commercial/$section" params={{ section: "settlement" }} className="block rounded-md border p-3 hover:border-primary/40 hover:bg-muted/40">Settlement Summary →</Link>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Recent commercial exceptions</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <ul className="divide-y">
              {[
                { code: "BDN-2024-0142", buyer: "EuroPack Ltd", issue: "Buyer weight 3.4% below dispatch — over tolerance", tone: "danger" },
                { code: "BDN-2024-0138", buyer: "Fresh Global SA", issue: "Classification pending after 48h", tone: "warning" },
                { code: "LIQ-2024-0088", buyer: "Iberian Fruits", issue: "Liquidation held — price grid mismatch", tone: "warning" },
                { code: "SET-2024-0031", buyer: "Mediterráneo Export", issue: "Awaiting counter-signature", tone: "default" },
              ].map((e) => (
                <li key={e.code} className="flex items-start justify-between gap-4 py-2">
                  <div>
                    <div className="font-medium">{e.code} <span className="text-muted-foreground font-normal">· {e.buyer}</span></div>
                    <div className="text-xs text-muted-foreground">{e.issue}</div>
                  </div>
                  <Badge variant={e.tone === "danger" ? "destructive" : e.tone === "warning" ? "secondary" : "outline"} className="text-[10px]">
                    {e.tone === "danger" ? "Alert" : e.tone === "warning" ? "Review" : "Info"}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
