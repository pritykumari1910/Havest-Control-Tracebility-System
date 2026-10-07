import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { palletTraceability } from "@/apis/reports";
import { getAllFarms } from "@/apis/farm.geography";
import { getAllVarieties } from "@/apis/varieties";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const PAGE_SIZE = 10;

const DISPATCH_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "closed", label: "Closed" },
  { value: "associated_to_load_order", label: "Associated to load order" },
  { value: "dispatched", label: "Dispatched" },
  { value: "pending_buyer_note", label: "Pending buyer note" },
  { value: "reconciled", label: "Reconciled" },
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
const extractPagination = (res: any): { total: number; totalPages: number } => {
  const obj = res?.responseObject ?? res?.data ?? res;
  const p: any = obj?.pagination ?? {};
  return { total: Number(p.total) || 0, totalPages: Math.max(1, Number(p.totalPages) || 1) };
};
const fmtDateTime = (v: any) => (v ? new Date(v).toLocaleString() : "—");
const refName = (r: any, ...keys: string[]) => {
  if (r == null) return "—";
  if (typeof r === "string") return r;
  for (const k of keys) if (r[k]) return r[k];
  return "—";
};

type Option = { value: string; label: string };

function TraceabilityPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<{ total: number; totalPages: number } | null>(null);
  const [page, setPage] = useState(1);

  // Filters supported by GET /reports/harvest-receipt-scans.
  const [qrInput, setQrInput] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [farmId, setFarmId] = useState("all");
  const [varietyId, setVarietyId] = useState("all");
  const [dispatchStatus, setDispatchStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [farmOptions, setFarmOptions] = useState<Option[]>([]);
  const [varietyOptions, setVarietyOptions] = useState<Option[]>([]);

  useEffect(() => {
    getAllFarms({ limit: 200 })
      .then((res) => setFarmOptions(extractList(res).map((f) => ({ value: idOf(f), label: refName(f, "farmName", "name") }))))
      .catch(() => setFarmOptions([]));
    getAllVarieties()
      .then((res) =>
        setVarietyOptions(extractList(res).map((v) => ({ value: idOf(v), label: refName(v, "varietyName", "name") }))),
      )
      .catch(() => setVarietyOptions([]));
  }, []);

  // Debounce the QR code search.
  useEffect(() => {
    const t = setTimeout(() => setQrCode(qrInput.trim()), 400);
    return () => clearTimeout(t);
  }, [qrInput]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: PAGE_SIZE };
      if (qrCode) params.qrCode = qrCode;
      if (farmId !== "all") params.farmId = farmId;
      if (varietyId !== "all") params.varietyId = varietyId;
      if (dispatchStatus !== "all") params.dispatchNoteStatus = dispatchStatus;
      if (startDate) params.startDate = new Date(startDate + "T00:00:00").toISOString();
      if (endDate) params.endDate = new Date(endDate + "T23:59:59.999").toISOString();
      const res = await palletTraceability(params);
      setRows(extractList(res));
      setPagination(extractPagination(res));
    } catch (e: any) {
      toast.error(e?.message || "Unable to load traceability data");
    } finally {
      setIsLoading(false);
    }
  }, [page, qrCode, farmId, varietyId, dispatchStatus, startDate, endDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setPage(1);
  }, [qrCode, farmId, varietyId, dispatchStatus, startDate, endDate]);

  const hasFilters =
    !!qrInput || farmId !== "all" || varietyId !== "all" || dispatchStatus !== "all" || !!startDate || !!endDate;
  const clearFilters = () => {
    setQrInput("");
    setFarmId("all");
    setVarietyId("all");
    setDispatchStatus("all");
    setStartDate("");
    setEndDate("");
  };

  const totalItems = pagination?.total ?? rows.length;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const currentPage = Math.min(page, totalPages);
  const pageStart = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = (currentPage - 1) * PAGE_SIZE + rows.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pallet Traceability</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Trace scanned pallet bins from field to dispatch. Search by QR code or filter by farm, variety, date and
          dispatch status.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            placeholder="Scan or type a QR code…"
            className="w-64 pl-8 font-mono"
          />
        </div>
        <Select value={farmId} onValueChange={setFarmId}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All farms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All farms</SelectItem>
            {farmOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={varietyId} onValueChange={setVarietyId}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All varieties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All varieties</SelectItem>
            {varietyOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dispatchStatus} onValueChange={setDispatchStatus}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All dispatch statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All dispatch statuses</SelectItem>
            {DISPATCH_STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
          <div className="text-xs text-muted-foreground">From</div>

        <Input
          type="date"
          value={startDate}
          max={endDate || undefined}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-36"
          aria-label="Start date"
        />
        <div className="text-xs text-muted-foreground">To</div>
        <Input
          type="date"
          value={endDate}
          min={startDate || undefined}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-36"
          aria-label="End date"
        />
        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            Clear
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scanned</TableHead>
                <TableHead>QR</TableHead>
                <TableHead>Farm</TableHead>
                <TableHead>Plot / Valve</TableHead>
                <TableHead>Variety</TableHead>
                <TableHead>Crew</TableHead>
                <TableHead>Machine</TableHead>
                <TableHead>Reception</TableHead>
                <TableHead>Dispatch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="p-8 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="p-8 text-center text-muted-foreground">
                    No scans found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => {
                  const plot = refName(r.plot, "plotName", "plotCode");
                  const valve = refName(r.valve, "valveName", "valveCode");
                  const dispatch = Array.isArray(r.dispatchNotes) ? r.dispatchNotes[0] : null;
                  return (
                    <TableRow key={idOf(r)}>
                      <TableCell className="whitespace-nowrap">{fmtDateTime(r.timestamp ?? r.scannedAt)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.qrCode ?? refName(r.qrInventory, "qrCode")}
                      </TableCell>
                      <TableCell>{refName(r.farm, "farmName", "internalCode")}</TableCell>
                      <TableCell>{`${plot}${valve !== "—" ? " · " + valve : ""}`}</TableCell>
                      <TableCell>{refName(r.variety, "varietyName", "varietyCode")}</TableCell>
                      <TableCell>{refName(r.crew, "crewName", "crewCode")}</TableCell>
                      <TableCell>{refName(r.machine, "name", "internalCode")}</TableCell>
                      <TableCell>{refName(r.reception, "batchCode")}</TableCell>
                      <TableCell>
                        {dispatch ? (
                          <Badge variant="secondary" className="font-mono text-xs">
                            {dispatch.dispatchCode ?? dispatch.internalNoteNumber ?? "—"}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          {totalItems > PAGE_SIZE && (
            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {pageStart}–{pageEnd} of {totalItems} scans
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

export default TraceabilityPage;
