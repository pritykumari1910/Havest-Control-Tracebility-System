import { useMemo, useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText, Scale, ClipboardCheck, Coins, CheckCircle2, Truck, Search, Plus, Eye, Pencil,
  Printer, Download, Send, TrendingUp, AlertTriangle, ShieldCheck, ChevronRight,
} from "lucide-react";
import { PageHeader, StatTile, SectionHeader, EmptyState } from "@/components/enterprise/page-shell";


type SectionKey =
  | "buyer-delivery-notes"
  | "weight-reconciliation"
  | "classification"
  | "liquidation"
  | "settlement"
  | "dispatch-notes"
  | "shipment-tracking"
  | "buyer-deliveries"
  | "reports-buyer"
  | "reports-weight-difference"
  | "reports-classification"
  | "reports-liquidation"
  | "reports-settlement";

const META: Record<SectionKey, { breadcrumb: string; title: string; description: string }> = {
  "buyer-delivery-notes": { breadcrumb: "Commercial", title: "Buyer Delivery Notes", description: "Create, submit and track delivery notes issued to buyers." },
  "weight-reconciliation": { breadcrumb: "Commercial", title: "Weight Reconciliation", description: "Compare dispatch and buyer-reported weights and approve reconciliation." },
  "classification": { breadcrumb: "Commercial", title: "Commercial Classification", description: "Assign grades and record accepted / rejected weight per delivery." },
  "liquidation": { breadcrumb: "Commercial", title: "Liquidation Management", description: "Calculate net commercial value per delivery and approve payment." },
  "settlement": { breadcrumb: "Commercial", title: "Settlement Summary", description: "Consolidated settlement documents per buyer and campaign." },
  "dispatch-notes": { breadcrumb: "Dispatch", title: "Dispatch Notes", description: "Read-only view of operational dispatch notes linked to buyers." },
  "shipment-tracking": { breadcrumb: "Dispatch", title: "Shipment Tracking", description: "Track vehicles from dispatch through arrival at buyer facilities." },
  "buyer-deliveries": { breadcrumb: "Dispatch", title: "Buyer Deliveries", description: "Deliveries acknowledged by the buyer with reconciliation status." },
  "reports-buyer": { breadcrumb: "Reports", title: "Buyer Delivery Report", description: "Delivery notes issued per buyer across the campaign." },
  "reports-weight-difference": { breadcrumb: "Reports", title: "Weight Difference Report", description: "Deltas between dispatch and buyer weight, with tolerance breaches." },
  "reports-classification": { breadcrumb: "Reports", title: "Classification Report", description: "Grade distribution and rejection rates per buyer and variety." },
  "reports-liquidation": { breadcrumb: "Reports", title: "Liquidation Report", description: "Net commercial values and adjustments per buyer and period." },
  "reports-settlement": { breadcrumb: "Reports", title: "Settlement Report", description: "Consolidated settlements per campaign and buyer." },
};

// realistic mock data
const BUYERS = ["Fresh Global SA", "Iberian Fruits", "EuroPack Ltd", "Mediterráneo Export", "Atlantic Produce"];
const CENTRES = ["Almería CP-01", "Málaga CP-02", "Huelva CP-03", "Valencia CP-04"];
const VEHICLES = ["Volvo FH-4521", "Scania R450-7832", "MAN TGX-1290", "Iveco S-Way-6641", "Mercedes Actros-2210"];
const DRIVERS = ["J. Ortega", "M. Alonso", "P. Ruiz", "A. Domínguez", "C. Herrera"];
const VARIETIES = ["Prime Red", "Golden Delicious", "Fuji", "Gala", "Granny Smith"];

function mkBDN(i: number) {
  const dispatch = 18000 + ((i * 137) % 9000);
  const buyer = Math.round(dispatch * (0.94 + ((i * 7) % 12) / 100));
  const diff = ((buyer - dispatch) / dispatch) * 100;
  const statusPool = ["draft", "submitted", "buyer_confirmed", "reconciled", "liquidated"] as const;
  const status = statusPool[i % statusPool.length];
  return {
    id: `BDN-2024-${String(140 + i).padStart(4, "0")}`,
    buyer: BUYERS[i % BUYERS.length],
    dispatch: `DSP-2024-${String(920 + i).padStart(4, "0")}`,
    vehicle: VEHICLES[i % VEHICLES.length],
    driver: DRIVERS[i % DRIVERS.length],
    centre: CENTRES[i % CENTRES.length],
    dispatchKg: dispatch,
    buyerKg: buyer,
    diffPct: diff,
    status,
    variety: VARIETIES[i % VARIETIES.length],
    date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
  };
}

const DATA = Array.from({ length: 24 }, (_, i) => mkBDN(i));

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: "Draft", cls: "bg-muted text-muted-foreground" },
    submitted: { label: "Submitted", cls: "bg-primary/10 text-primary" },
    buyer_confirmed: { label: "Buyer Confirmed", cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    reconciled: { label: "Reconciled", cls: "bg-success/15 text-success" },
    liquidated: { label: "Liquidated", cls: "bg-success/25 text-success" },
    approved: { label: "Approved", cls: "bg-success/15 text-success" },
    pending: { label: "Pending", cls: "bg-warning/15 text-warning" },
    alert: { label: "Over tolerance", cls: "bg-destructive/15 text-destructive" },
  };
  const s = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${s.cls}`}>{s.label}</span>;
}

function CommercialSectionPage() {
  const { section } = Route.useParams();
  const key = section as SectionKey;
  const meta = META[key];
  if (!meta) {
    return (
      <div className="p-8">
        <EmptyState title="Unknown section" description={`No commercial section registered for "${section}".`} />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={meta.breadcrumb}
        title={meta.title}
        description={meta.description}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-[10px]">
              <ShieldCheck className="h-3 w-3" /> Administrative Team
            </Badge>
          </div>
        }
      />
      <SectionRouter key={key} sectionKey={key} />
    </div>
  );
}

function SectionRouter({ sectionKey }: { sectionKey: SectionKey }) {
  switch (sectionKey) {
    case "buyer-delivery-notes": return <BuyerDeliveryNotes />;
    case "weight-reconciliation": return <WeightReconciliation />;
    case "classification": return <CommercialClassification />;
    case "liquidation": return <LiquidationManagement />;
    case "settlement": return <SettlementSummary />;
    case "dispatch-notes": return <DispatchReadonly title="Dispatch Notes" />;
    case "shipment-tracking": return <ShipmentTracking />;
    case "buyer-deliveries": return <BuyerDeliveries />;
    case "reports-buyer": return <ReportPage kind="buyer" />;
    case "reports-weight-difference": return <ReportPage kind="weight" />;
    case "reports-classification": return <ReportPage kind="classification" />;
    case "reports-liquidation": return <ReportPage kind="liquidation" />;
    case "reports-settlement": return <ReportPage kind="settlement" />;
  }
}

// -------- Filters bar --------
function FiltersBar() {
  const [buyer, setBuyer] = useState("all");
  const [centre, setCentre] = useState("all");
  const [status, setStatus] = useState("all");
  return (
    <div className="sticky top-0 z-10 -mx-1 mb-3 rounded-lg border bg-background/80 p-3 backdrop-blur">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
        <div className="col-span-2 md:col-span-2 flex items-center gap-1 rounded-md border bg-background px-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search delivery / dispatch number…" className="h-8 border-0 shadow-none focus-visible:ring-0" />
        </div>
        <Select value={buyer} onValueChange={setBuyer}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Buyer" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All buyers</SelectItem>
            {BUYERS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={centre} onValueChange={setCentre}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Destination" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All destinations</SelectItem>
            {CENTRES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="reconciled">Reconciled</SelectItem>
            <SelectItem value="liquidated">Liquidated</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" className="h-8 text-xs" />
      </div>
    </div>
  );
}

// -------- Buyer Delivery Notes --------
function BuyerDeliveryNotes() {
  return (
    <div className="space-y-3">
      <FiltersBar />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Total Notes" value={DATA.length} icon={FileText} />
        <StatTile label="Pending Submission" value={DATA.filter(d => d.status === "draft").length} tone="warning" />
        <StatTile label="Reconciled" value={DATA.filter(d => d.status === "reconciled").length} tone="success" />
        <StatTile label="Total Weight" value={`${(DATA.reduce((a, b) => a + b.dispatchKg, 0) / 1000).toFixed(1)} t`} />
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm">Delivery Notes</CardTitle>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-8 text-xs"><Download className="mr-1 h-3.5 w-3.5"/>Export</Button>
            <Button size="sm" className="h-8 text-xs"><Plus className="mr-1 h-3.5 w-3.5"/>Create</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Note #</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Dispatch #</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead className="text-right">Est. Weight</TableHead>
                <TableHead className="text-right">Buyer Weight</TableHead>
                <TableHead className="text-right">Diff</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DATA.slice(0, 12).map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs">{d.id}</TableCell>
                  <TableCell>{d.buyer}</TableCell>
                  <TableCell className="font-mono text-xs">{d.dispatch}</TableCell>
                  <TableCell className="text-xs">{d.vehicle}</TableCell>
                  <TableCell className="text-xs">{d.driver}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.dispatchKg.toLocaleString()} kg</TableCell>
                  <TableCell className="text-right tabular-nums">{d.buyerKg.toLocaleString()} kg</TableCell>
                  <TableCell className={`text-right tabular-nums ${Math.abs(d.diffPct) > 2 ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                    {d.diffPct.toFixed(2)}%
                  </TableCell>
                  <TableCell><StatusBadge status={d.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7"><Send className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7"><Printer className="h-3.5 w-3.5" /></Button>
                    </div>
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

// -------- Weight Reconciliation --------
function WeightReconciliation() {
  const rows = DATA.filter(d => d.status !== "draft").slice(0, 8);
  return (
    <div className="space-y-4">
      <FiltersBar />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Awaiting Review" value={rows.filter(r => Math.abs(r.diffPct) <= 2 && r.status !== "reconciled").length} tone="warning" />
        <StatTile label="Over Tolerance" value={rows.filter(r => Math.abs(r.diffPct) > 2).length} tone="danger" />
        <StatTile label="Approved" value={rows.filter(r => r.status === "reconciled" || r.status === "liquidated").length} tone="success" />
        <StatTile label="Avg Difference" value={`${(rows.reduce((a, r) => a + Math.abs(r.diffPct), 0) / rows.length).toFixed(2)}%`} />
      </div>

      <SectionHeader title="Reconciliation workflow" description="Dispatch completed → Buyer weight entered → Difference calculated → Review → Approve" />
      <div className="grid grid-cols-5 gap-2">
        {["Dispatch Completed", "Buyer Weight Entered", "Difference Calculated", "Review", "Approve"].map((s, i) => (
          <div key={s} className="rounded-md border bg-muted/30 p-3 text-center">
            <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-medium text-primary">{i + 1}</div>
            <div className="mt-1 text-[11px] font-medium">{s}</div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Pending reconciliations</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {rows.map(r => {
            const over = Math.abs(r.diffPct) > 2;
            return (
              <div key={r.id} className={`rounded-lg border p-3 ${over ? "border-destructive/40 bg-destructive/5" : ""}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">{r.id} <span className="text-muted-foreground font-normal">· {r.buyer}</span></div>
                    <div className="text-[11px] text-muted-foreground">{r.centre} · {r.variety} · {r.date}</div>
                  </div>
                  <StatusBadge status={over ? "alert" : r.status} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
                  <MiniStat label="Dispatch" value={`${r.dispatchKg.toLocaleString()} kg`} />
                  <MiniStat label="Buyer" value={`${r.buyerKg.toLocaleString()} kg`} />
                  <MiniStat label="Diff" value={`${(r.buyerKg - r.dispatchKg).toLocaleString()} kg`} tone={over ? "danger" : "default"} />
                  <MiniStat label="Diff %" value={`${r.diffPct.toFixed(2)}%`} tone={over ? "danger" : "default"} />
                  <MiniStat label="Tolerance" value="±2.00%" />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <Input placeholder="Reconciliation comment…" className="h-8 max-w-md text-xs" />
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-8 text-xs">Request Review</Button>
                    <Button size="sm" className="h-8 text-xs">Approve Reconciliation</Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function MiniStat({ label, value, tone = "default" }: { label: string; value: ReactNode; tone?: "default" | "danger" }) {
  return (
    <div className="rounded-md border bg-background p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-sm font-semibold tabular-nums ${tone === "danger" ? "text-destructive" : ""}`}>{value}</div>
    </div>
  );
}

// -------- Classification --------
function CommercialClassification() {
  const rows = DATA.slice(0, 10).map((d, i) => {
    const acc = Math.round(d.buyerKg * (0.85 + ((i * 3) % 10) / 100));
    return { ...d, acceptedKg: acc, rejectedKg: d.buyerKg - acc, grade: (["A","A","B","B","C"] as const)[i % 5] };
  });
  return (
    <div className="space-y-3">
      <FiltersBar />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Deliveries" value={rows.length} icon={ClipboardCheck} />
        <StatTile label="Grade A" value={rows.filter(r => r.grade === "A").length} tone="success" />
        <StatTile label="Rejected Total" value={`${(rows.reduce((a, r) => a + r.rejectedKg, 0) / 1000).toFixed(1)} t`} tone="warning" />
        <StatTile label="Acceptance Rate" value={`${(rows.reduce((a, r) => a + r.acceptedKg, 0) / rows.reduce((a, r) => a + r.buyerKg, 0) * 100).toFixed(1)}%`} tone="success" />
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm">Classifications</CardTitle>
          <Button size="sm" className="h-8 text-xs"><Plus className="mr-1 h-3.5 w-3.5"/>Add Classification</Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Delivery</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Variety</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="text-right">Accepted</TableHead>
                <TableHead className="text-right">Rejected</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell>{r.buyer}</TableCell>
                  <TableCell className="text-xs">{r.variety}</TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-medium ${r.grade === "A" ? "bg-success/15 text-success" : r.grade === "B" ? "bg-primary/10 text-primary" : "bg-warning/15 text-warning"}`}>
                      Grade {r.grade}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-success">{r.acceptedKg.toLocaleString()} kg</TableCell>
                  <TableCell className="text-right tabular-nums text-destructive">{r.rejectedKg.toLocaleString()} kg</TableCell>
                  <TableCell className="text-xs text-muted-foreground">Size &amp; firmness within spec</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7"><Pencil className="h-3.5 w-3.5"/></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7"><Eye className="h-3.5 w-3.5"/></Button>
                    </div>
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

// -------- Liquidation --------
function LiquidationManagement() {
  const rows = DATA.slice(0, 12).map((d, i) => {
    const acc = Math.round(d.buyerKg * 0.9);
    const price = 1.15 + (i % 6) * 0.08;
    const gross = acc * price;
    const adj = -Math.round(gross * 0.02);
    const net = Math.round(gross + adj);
    const status = ["pending", "approved", "pending", "approved"][i % 4];
    return { ...d, acceptedKg: acc, price, gross, adj, net, status };
  });
  const total = rows.reduce((a, r) => a + r.net, 0);
  return (
    <div className="space-y-3">
      <FiltersBar />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Pending Liquidations" value={rows.filter(r => r.status === "pending").length} icon={Coins} tone="warning" />
        <StatTile label="Approved" value={rows.filter(r => r.status === "approved").length} tone="success" />
        <StatTile label="Total Net Value" value={`€ ${total.toLocaleString()}`} icon={TrendingUp} />
        <StatTile label="Avg Unit Price" value={`€ ${(rows.reduce((a, r) => a + r.price, 0) / rows.length).toFixed(2)} /kg`} />
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm">Liquidations</CardTitle>
          <Button size="sm" className="h-8 text-xs"><Plus className="mr-1 h-3.5 w-3.5"/>Create Liquidation</Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Buyer</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead className="text-right">Accepted</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Adjustments</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.buyer}</TableCell>
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.acceptedKg.toLocaleString()} kg</TableCell>
                  <TableCell className="text-right tabular-nums">€ {r.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right tabular-nums">€ {Math.round(r.gross).toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums text-destructive">€ {r.adj.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">€ {r.net.toLocaleString()}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7"><Pencil className="h-3.5 w-3.5"/></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7"><CheckCircle2 className="h-3.5 w-3.5"/></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7"><Printer className="h-3.5 w-3.5"/></Button>
                    </div>
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

// -------- Settlement Summary --------
function SettlementSummary() {
  const rows = BUYERS.map((b, i) => ({
    id: `SET-2024-${String(31 + i).padStart(4, "0")}`,
    buyer: b,
    campaign: "2024-25",
    deliveries: 8 + i * 3,
    totalKg: (12 + i * 5) * 1000,
    totalValue: (28000 + i * 9400),
    date: new Date(Date.now() - i * 3 * 86400000).toISOString().slice(0, 10),
    status: (["pending", "approved", "approved", "pending", "approved"] as const)[i],
  }));
  return (
    <div className="space-y-3">
      <FiltersBar />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Settlements" value={rows.length} icon={FileText} />
        <StatTile label="Approved" value={rows.filter(r => r.status === "approved").length} tone="success" />
        <StatTile label="Total Volume" value={`${(rows.reduce((a, r) => a + r.totalKg, 0) / 1000).toFixed(1)} t`} />
        <StatTile label="Total Value" value={`€ ${rows.reduce((a, r) => a + r.totalValue, 0).toLocaleString()}`} icon={TrendingUp} />
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Settlements</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Settlement #</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead className="text-right">Deliveries</TableHead>
                <TableHead className="text-right">Total Weight</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell>{r.buyer}</TableCell>
                  <TableCell>{r.campaign}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.deliveries}</TableCell>
                  <TableCell className="text-right tabular-nums">{(r.totalKg / 1000).toFixed(1)} t</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">€ {r.totalValue.toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{r.date}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7"><Eye className="h-3.5 w-3.5"/></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7"><Printer className="h-3.5 w-3.5"/></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7"><Download className="h-3.5 w-3.5"/></Button>
                    </div>
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

// -------- Dispatch read-only views --------
function DispatchReadonly({ title }: { title: string }) {
  return (
    <div className="space-y-3">
      <FiltersBar />
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Eye className="h-4 w-4 text-muted-foreground"/> {title} · read only</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dispatch #</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Dispatch Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actual Weight</TableHead>
                <TableHead>Linked Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DATA.slice(0, 12).map(d => (
                <TableRow key={d.dispatch}>
                  <TableCell className="font-mono text-xs">{d.dispatch}</TableCell>
                  <TableCell>{d.buyer}</TableCell>
                  <TableCell className="text-xs">{d.vehicle}</TableCell>
                  <TableCell className="text-xs">{d.centre}</TableCell>
                  <TableCell className="text-xs">{d.date} · 07:{String(30 + (Math.abs(d.dispatchKg) % 30)).padStart(2, "0")}</TableCell>
                  <TableCell><StatusBadge status={d.status === "draft" ? "submitted" : d.status} /></TableCell>
                  <TableCell className="text-right tabular-nums">{d.dispatchKg.toLocaleString()} kg</TableCell>
                  <TableCell className="font-mono text-xs">{d.id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ShipmentTracking() {
  const rows = DATA.slice(0, 8);
  return (
    <div className="space-y-3">
      <FiltersBar />
      {rows.map((r, i) => {
        const stages = ["Dispatched", "In Transit", "At Destination", "Delivered"];
        const active = (i % stages.length) + 1;
        return (
          <Card key={r.dispatch}>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">{r.dispatch} <span className="text-muted-foreground font-normal">· {r.buyer}</span></div>
                  <div className="text-[11px] text-muted-foreground">{r.vehicle} · {r.driver} · {r.centre}</div>
                </div>
                <div className="text-xs text-muted-foreground">{r.date}</div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {stages.map((s, si) => {
                  const done = si < active;
                  return (
                    <div key={s} className={`rounded-md border p-2 text-center text-[11px] ${done ? "border-success/40 bg-success/5 text-success" : "text-muted-foreground"}`}>
                      <div className="font-medium">{s}</div>
                      <div className="text-[10px]">{done ? "✓ completed" : "pending"}</div>
                    </div>
                  );
                })}
              </div>
              <Progress value={(active / stages.length) * 100} className="mt-3 h-1.5" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function BuyerDeliveries() {
  const rows = DATA.slice(0, 12).filter(d => d.status !== "draft");
  return (
    <div className="space-y-3">
      <FiltersBar />
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Buyer-acknowledged deliveries</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Delivery</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Dispatch</TableHead>
                <TableHead className="text-right">Buyer</TableHead>
                <TableHead className="text-right">Diff %</TableHead>
                <TableHead>Reconciliation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell>{r.buyer}</TableCell>
                  <TableCell className="text-xs">{r.date}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.dispatchKg.toLocaleString()} kg</TableCell>
                  <TableCell className="text-right tabular-nums">{r.buyerKg.toLocaleString()} kg</TableCell>
                  <TableCell className={`text-right tabular-nums ${Math.abs(r.diffPct) > 2 ? "text-destructive font-medium" : ""}`}>{r.diffPct.toFixed(2)}%</TableCell>
                  <TableCell><StatusBadge status={Math.abs(r.diffPct) > 2 ? "alert" : r.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// -------- Reports --------
function ReportPage({ kind }: { kind: "buyer" | "weight" | "classification" | "liquidation" | "settlement" }) {
  const specs = useMemo(() => {
    switch (kind) {
      case "buyer": return {
        cols: ["Buyer", "Deliveries", "Weight", "Value", "Reconciled %"],
        rows: BUYERS.map((b, i) => [b, 8 + i * 3, `${(12 + i * 5).toFixed(1)} t`, `€ ${(28000 + i * 9400).toLocaleString()}`, `${(88 + i * 2)}%`]),
      };
      case "weight": return {
        cols: ["Buyer", "Deliveries", "Avg Diff %", "Over Tolerance", "Total Delta"],
        rows: BUYERS.map((b, i) => [b, 10 + i * 2, `${(0.8 + i * 0.4).toFixed(2)}%`, i, `${((i - 2) * 240).toLocaleString()} kg`]),
      };
      case "classification": return {
        cols: ["Buyer", "Grade A %", "Grade B %", "Grade C %", "Rejected %"],
        rows: BUYERS.map((b, i) => [b, `${62 - i * 3}%`, `${22 + i * 2}%`, `${8 + i}%`, `${4 + i}%`]),
      };
      case "liquidation": return {
        cols: ["Buyer", "Deliveries", "Gross", "Adjustments", "Net"],
        rows: BUYERS.map((b, i) => {
          const gross = 32000 + i * 12000; const adj = -Math.round(gross * 0.03);
          return [b, 10 + i * 2, `€ ${gross.toLocaleString()}`, `€ ${adj.toLocaleString()}`, `€ ${(gross + adj).toLocaleString()}`];
        }),
      };
      case "settlement": return {
        cols: ["Settlement #", "Buyer", "Deliveries", "Total", "Status"],
        rows: BUYERS.map((b, i) => [`SET-2024-${String(31 + i).padStart(4, "0")}`, b, 8 + i * 3, `€ ${(28000 + i * 9400).toLocaleString()}`, i % 2 ? "Approved" : "Pending"]),
      };
    }
  }, [kind]);

  return (
    <div className="space-y-3">
      <FiltersBar />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionHeader title="Report output" description="Filter, sort and group the data. Charts & exports are available." />
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="h-8 text-xs"><Download className="mr-1 h-3.5 w-3.5"/>Export PDF</Button>
          <Button size="sm" className="h-8 text-xs"><Download className="mr-1 h-3.5 w-3.5"/>Export Excel</Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>{specs.cols.map(c => <TableHead key={c}>{c}</TableHead>)}</TableRow>
            </TableHeader>
            <TableBody>
              {specs.rows.map((row, i) => (
                <TableRow key={i}>
                  {row.map((c, j) => <TableCell key={j} className={j === 0 ? "font-medium" : "text-xs"}>{c as ReactNode}</TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
export default CommercialSectionPage;