import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { dispatchNotesReport, exportDispatchNotesReport } from "@/apis/reports";
import { getAllBuyers, getAllDestinationCenters, getAllTransporters } from "@/apis/buyer&transport";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Download, FileText, Boxes, Weight, Search } from "lucide-react";
import buildPageItems from "@/utils/paginationCount";
import { useAuth } from "@/hooks/use-auth";

const PAGE_SIZE = 10;

// The status values accepted by GET /reports/dispatch-notes (DispatchNoteStatus).
const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "closed", label: "Closed" },
  { value: "associated_to_load_order", label: "Associated to load order" },
  { value: "dispatched", label: "Dispatched" },
  { value: "pending_buyer_note", label: "Pending buyer note" },
  { value: "reconciled", label: "Reconciled" },
] as const;

const STATUS_TONE: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
  draft: "outline",
  closed: "default",
  associated_to_load_order: "secondary",
  dispatched: "secondary",
  pending_buyer_note: "default",
  reconciled: "secondary",
};

// The export endpoint accepts pdf/json too, but the service only renders csv and xlsx.
const EXPORT_FORMATS = [
  { value: "excel", label: "Excel (.xlsx)", ext: "xlsx" },
  { value: "csv", label: "CSV", ext: "csv" },
] as const;

const idOf = (r: any) => r?._id ?? r?.id;
const extractList = (res: any): any[] => {
  const obj = res?.responseObject ?? res?.data ?? res;
  if (Array.isArray(obj)) return obj;
  if (obj && typeof obj === "object") {
    const arr = Object.values(obj).find((v) => Array.isArray(v));
    if (Array.isArray(arr)) return arr;
  }
  return [];
};
const num = (v: any) => (v == null || Number.isNaN(Number(v)) ? "—" : Number(v).toLocaleString());
const fmtDate = (v: any) => (v ? new Date(v).toLocaleDateString() : "—");
const refName = (r: any, ...keys: string[]) => {
  if (r == null) return "—";
  if (typeof r === "string") return r;
  for (const k of keys) if (r[k]) return r[k];
  return "—";
};
// statusCounts can contain values outside DispatchNoteStatus (legacy records), so
// fall back to a humanised version of whatever the API sends.
const statusLabel = (v: string) =>
  STATUS_OPTIONS.find((o) => o.value === v)?.label ?? (v ? v.replace(/_/g, " ") : "—");

type Option = { value: string; label: string };
type Kpis = {
  totalDispatchNotes: number;
  totalPalletBins: number;
  totalEstimatedWeightKg: number;
  statusCounts?: Record<string, number>;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

function DispatchReportPage() {
  // Exporting the report is limited to these roles; everyone else with page
  // access can still read the table.
  const { hasAnyRole } = useAuth();
  const canExport = hasAnyRole(["system_administrator", "operations_director", "field_engineer"]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("all");
  const [buyerId, setBuyerId] = useState("all");
  const [destinationId, setDestinationId] = useState("all");
  const [transportProviderId, setTransportProviderId] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<any[]>([]);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [pagination, setPagination] = useState<{ total: number; totalPages: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [buyerOptions, setBuyerOptions] = useState<Option[]>([]);
  const [destinationOptions, setDestinationOptions] = useState<Option[]>([]);
  const [transporterOptions, setTransporterOptions] = useState<Option[]>([]);

  useEffect(() => {
    getAllBuyers({ limit: 200 })
      .then((res) =>
        setBuyerOptions(extractList(res).map((b) => ({ value: idOf(b), label: refName(b, "name", "internalCode") }))),
      )
      .catch(() => setBuyerOptions([]));
    getAllDestinationCenters({ limit: 200 })
      .then((res) =>
        setDestinationOptions(
          extractList(res).map((d) => ({ value: idOf(d), label: refName(d, "name", "internalCode") })),
        ),
      )
      .catch(() => setDestinationOptions([]));
    getAllTransporters({ limit: 200 })
      .then((res) =>
        setTransporterOptions(
          extractList(res).map((t) => ({ value: idOf(t), label: refName(t, "legalName", "name", "internalCode") })),
        ),
      )
      .catch(() => setTransporterOptions([]));
  }, []);

  // Debounce the note-number search.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Build the query params shared by the report fetch and the export.
  const buildParams = useCallback(
    (extra?: Record<string, any>) => {
      const params: Record<string, any> = { page, limit: PAGE_SIZE };
      if (startDate) params.startDate = new Date(startDate + "T00:00:00").toISOString();
      if (endDate) params.endDate = new Date(endDate + "T23:59:59.999").toISOString();
      if (status !== "all") params.status = status;
      if (buyerId !== "all") params.buyerId = buyerId;
      if (destinationId !== "all") params.destinationId = destinationId;
      if (transportProviderId !== "all") params.transportProviderId = transportProviderId;
      if (search) params.search = search;
      return { ...params, ...extra };
    },
    [page, startDate, endDate, status, buyerId, destinationId, transportProviderId, search],
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await dispatchNotesReport(buildParams());
      const obj = res?.responseObject ?? res?.data ?? res;
      setRows(Array.isArray(obj?.items) ? obj.items : extractList(res));
      setKpis(obj?.kpis ?? null);
      const p = obj?.pagination ?? {};
      setPagination({ total: Number(p.total) || 0, totalPages: Math.max(1, Number(p.totalPages) || 1) });
    } catch (e: any) {
      toast.error(e?.message || "Unable to load dispatch report");
    } finally {
      setIsLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, status, buyerId, destinationId, transportProviderId, search]);

  const runExport = async (format: (typeof EXPORT_FORMATS)[number]) => {
    setExporting(true);
    try {
      // Export the full (unpaginated) result set for the current filters.
      const { page: _p, limit: _l, ...rest } = buildParams();
      const blob = await exportDispatchNotesReport({ ...rest, format: format.value });
      const range = startDate || endDate ? `${startDate || "start"}_${endDate || "today"}` : "all";
      downloadBlob(blob as Blob, `dispatch_notes_${range}.${format.ext}`);
    } catch (e: any) {
      toast.error(e?.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const hasFilters =
    !!startDate ||
    !!endDate ||
    !!searchInput ||
    status !== "all" ||
    buyerId !== "all" ||
    destinationId !== "all" ||
    transportProviderId !== "all";
  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSearchInput("");
    setStatus("all");
    setBuyerId("all");
    setDestinationId("all");
    setTransportProviderId("all");
  };

  const totalItems = pagination?.total ?? rows.length;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const currentPage = Math.min(page, totalPages);
  const pageStart = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = (currentPage - 1) * PAGE_SIZE + rows.length;
  // Only surface statuses actually present, so unexpected values still show up.
  const presentStatuses = Object.entries(kpis?.statusCounts ?? {}).filter(([, n]) => Number(n) > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dispatch Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Buyer dispatches, destinations, pallet bin counts and estimated weight across the selected period.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatTile label="Dispatch notes" value={num(kpis?.totalDispatchNotes)} icon={FileText} />
        <StatTile label="Pallet bins" value={num(kpis?.totalPalletBins)} icon={Boxes} />
        <StatTile label="Estimated kg" value={num(kpis?.totalEstimatedWeightKg)} icon={Weight} />
      </div>

      {presentStatuses.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">By status</span>
          {presentStatuses.map(([key, count]) => (
            <Badge key={key} variant={STATUS_TONE[key] ?? "outline"}>
              {statusLabel(key)}: {num(count)}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="noteSearch"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search note number…"
              className="w-52 pl-8"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Start date</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">End date</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1.5">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Select value={buyerId} onValueChange={setBuyerId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All buyers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All buyers</SelectItem>
              {buyerOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Select value={destinationId} onValueChange={setDestinationId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All destinations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All destinations</SelectItem>
              {destinationOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Select value={transportProviderId} onValueChange={setTransportProviderId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All providers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All providers</SelectItem>
              {transporterOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            Clear
          </Button>
        )}
        {canExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={exporting}>
                <Download className="mr-2 h-4 w-4" />
                {exporting ? "Exporting…" : "Export"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {EXPORT_FORMATS.map((f) => (
                <DropdownMenuItem key={f.value} onClick={() => runExport(f)}>
                  {f.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Note #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Transport</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead className="text-right">Bins</TableHead>
                <TableHead className="text-right">Est. kg</TableHead>
                <TableHead>Buyer note</TableHead>
                <TableHead>Edits</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} className="p-8 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="p-8 text-center text-muted-foreground">
                    No dispatch notes found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, i) => (
                  <TableRow key={r.id || i}>
                    <TableCell className="font-mono text-xs">{r.noteNumber || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">{fmtDate(r.noteDate)}</TableCell>
                    <TableCell className="font-medium">
                      {r.buyerName || "—"}
                      {r.buyerCode && r.buyerCode !== "N/A" && (
                        <span className="ml-1 font-mono text-xs text-muted-foreground">{r.buyerCode}</span>
                      )}
                    </TableCell>
                    <TableCell>{r.destinationName || "—"}</TableCell>
                    <TableCell>{r.transportProviderName || "—"}</TableCell>
                    <TableCell>{r.campaignName || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{num(r.binsCount)}</TableCell>
                    <TableCell className="text-right tabular-nums">{num(r.estimatedTotalWeightKg)}</TableCell>
                    <TableCell>
                      {r.isAssociatedWithBuyerDeliveryNote ? (
                        <Badge variant="secondary">Assigned</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.isEditedAfterClosure ? (
                        <Badge variant="outline">{num(r.editCount)}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_TONE[r.status] ?? "outline"}>{statusLabel(r.status)}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {totalItems > PAGE_SIZE && (
            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {pageStart}–{pageEnd} of {totalItems} notes
              </p>
              <Pagination>
                  <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious
                                    onClick={(event) => {
                                      event.preventDefault();
                                      setPage((value) => Math.max(1, value - 1));
                                    }}
                                    aria-disabled={page === 1}
                                    className={page === 1 ? "pointer-events-none opacity-50" : ""}
                                    href="#"
                                  />
                                </PaginationItem>
                                {buildPageItems(page, totalPages).map((value, index) =>
                                  value === "ellipsis" ? (
                                    <PaginationItem key={`ellipsis-${index}`}>
                                      <PaginationEllipsis />
                                    </PaginationItem>
                                  ) : (
                                    <PaginationItem key={value}>
                                      <PaginationLink
                                        href="#"
                                        isActive={value === page}
                                        onClick={(event) => {
                                          event.preventDefault();
                                          setPage(value);
                                        }}
                                      >
                                        {value}
                                      </PaginationLink>
                                    </PaginationItem>
                                  )
                                )}
                                <PaginationItem>
                                  <PaginationNext
                                    onClick={(event) => {
                                      event.preventDefault();
                                      setPage((value) => Math.min(totalPages, value + 1));
                                    }}
                                    aria-disabled={page === totalPages}
                                    className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                                    href="#"
                                  />
                                </PaginationItem>
                              </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-2xl font-semibold text-foreground">{value}</div>
          {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
        </div>
        <Icon className="h-5 w-5 text-primary" />
      </CardContent>
    </Card>
  );
}

export default DispatchReportPage;
