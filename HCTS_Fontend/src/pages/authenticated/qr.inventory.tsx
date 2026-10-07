import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getAllSeries, getInventory, getSeriesSummary } from "@/apis/qr.series";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Search } from "lucide-react";
import buildPageItems from "@/utils/paginationCount";

// QR lifecycle statuses (must match backend QrInventoryStatus values).
const ALL_STATUSES = [
  "Generated",
  "Available",
  "Assigned",
  "Used",
  "Scanned at Collection Point",
  "Assigned to Dispatch Note",
  "Dispatched",
  "Returned",
  "Damaged",
  "Lost",
  "Cancelled",
] as const;

const STATUS_TONE: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
  Generated: "outline",
  Available: "secondary",
  Assigned: "default",
  Used: "secondary",
  "Scanned at Collection Point": "default",
  "Assigned to Dispatch Note": "default",
  Dispatched: "secondary",
  Returned: "outline",
  Damaged: "destructive",
  Lost: "destructive",
  Cancelled: "destructive",
};

// The per-series summary the backend returns (fixed set of counters).
const SUMMARY_KEYS = ["available", "assigned", "used", "returned", "damaged", "lost", "cancelled"] as const;

const PAGE_SIZE = 15;

const idOf = (r: any) => r?._id ?? r?.id;
const fmt = (v: any) => (v ? new Date(v).toLocaleDateString() : "—");

export default function QRInventoryPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<{ total: number; totalPages: number } | null>(null);
  const [page, setPage] = useState(1);

  const [seriesOptions, setSeriesOptions] = useState<any[]>([]);
  const [seriesId, setSeriesId] = useState("all");
  const [status, setStatus] = useState("all");
  const [harvestInput, setHarvestInput] = useState("");
  const [harvest, setHarvest] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [summary, setSummary] = useState<any | null>(null);

  // Load series list for the filter dropdown once.
  useEffect(() => {
    (async () => {
      try {
        const res = await getAllSeries({ limit: 100 });
        const ro = res?.responseObject ?? res?.data ?? res;
        const list = Array.isArray(ro) ? ro : ro?.series ?? [];
        setSeriesOptions(Array.isArray(list) ? list : []);
      } catch {
        /* best-effort */
      }
    })();
  }, []);

  // Debounce the harvest-assignment search.
  useEffect(() => {
    const t = setTimeout(() => setHarvest(harvestInput), 450);
    return () => clearTimeout(t);
  }, [harvestInput]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: PAGE_SIZE };
      if (seriesId !== "all") params.seriesId = seriesId;
      if (status !== "all") params.status = status;
      if (harvest.trim()) params.harvestAssignmentId = harvest.trim();
      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) params.endDate = new Date(endDate).toISOString();
      const res = await getInventory(params);
      const ro = res?.responseObject ?? res?.data ?? res;
      const list = Array.isArray(ro) ? ro : ro?.items ?? [];
      setRows(Array.isArray(list) ? list : []);
      setPagination(ro?.pagination ?? null);
    } catch (e: any) {
      toast.error(e?.message || "Unable to load QR inventory");
    } finally {
      setIsLoading(false);
    }
  }, [page, seriesId, status, harvest, startDate, endDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setPage(1);
  }, [seriesId, status, harvest, startDate, endDate]);

  // Per-series summary counters (only available for a specific series).
  useEffect(() => {
    if (seriesId === "all") {
      setSummary(null);
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await getSeriesSummary(seriesId);
        const ro = res?.responseObject ?? res?.data ?? res;
        if (active) setSummary(ro ?? null);
      } catch {
        if (active) setSummary(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [seriesId, rows]);

  const totalItems = pagination?.total ?? rows.length;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const currentPage = Math.min(page, totalPages);
  const pageStart = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = (currentPage - 1) * PAGE_SIZE + rows.length;

  const summaryCards = useMemo(() => {
    if (!summary) return null;
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total QRs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{(summary.totalQRs ?? 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        {SUMMARY_KEYS.map((k) => (
          <Card key={k}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium capitalize text-muted-foreground">{k}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {(summary.summary?.[k] ?? 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }, [summary]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">QR Inventory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete lifecycle visibility of every individual QR code.
        </p>
      </div>

      {seriesId === "all" ? (
        <p className="rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          Select a series to see its summary counters (available, assigned, used, returned, damaged, lost, cancelled).
        </p>
      ) : (
        summaryCards
      )}

      <div className="flex flex-wrap items-end gap-3">
        <Select value={seriesId} onValueChange={setSeriesId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Series" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All series</SelectItem>
            {seriesOptions.map((s: any) => (
              <SelectItem key={idOf(s)} value={idOf(s)}>
                {s.seriesName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={harvestInput}
            onChange={(e) => setHarvestInput(e.target.value)}
            placeholder="Harvest assignment…"
            className="w-56 pl-8"
          />
        </div>
        {/* <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
        </div> */}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>QR code</TableHead>
                <TableHead>#</TableHead>
                <TableHead>Series</TableHead>
                <TableHead>Harvest assignment</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-8 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-8 text-center text-muted-foreground">
                    No QR codes match this filter.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r: any) => (
                  <TableRow key={idOf(r) ?? r.qrCode}>
                    <TableCell className="font-mono text-xs">{r.qrCode}</TableCell>
                    <TableCell className="tabular-nums">{r.qrNumber}</TableCell>
                    <TableCell>{r.series?.seriesName ?? "—"}</TableCell>
                    <TableCell>{r.harvestAssignmentId? "Yes" :  "—"}</TableCell>
                    <TableCell>{fmt(r.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_TONE[r.status] ?? "outline"}>{r.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {totalItems > PAGE_SIZE && (
            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {pageStart}–{pageEnd} of {totalItems} codes
              </p>
              <Pagination aria-label="QR inventory pagination">
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
