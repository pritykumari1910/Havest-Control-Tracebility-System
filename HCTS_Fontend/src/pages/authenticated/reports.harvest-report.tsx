import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { harvestProgress, exportHarvestProgress } from "@/apis/reports";
import { getAllFarms } from "@/apis/farm.geography";
import { getAllVarieties } from "@/apis/varieties";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Download, Boxes, Weight } from "lucide-react";
import buildPageItems from "@/utils/paginationCount";
import { useAuth } from "@/hooks/use-auth";

const PAGE_SIZE = 10;

const GROUP_BY_OPTIONS = [
  { value: "farm", label: "Farm" },
  { value: "plot", label: "Plot" },
  { value: "valve", label: "Valve" },
  { value: "park", label: "Park" },
  { value: "variety", label: "Variety" },
  { value: "crew", label: "Crew" },
  { value: "campaign", label: "Campaign" },
  { value: "assignment", label: "Assignment" },
] as const;

const EXPORT_FORMATS = [
  { value: "excel", label: "Excel (.xlsx)", ext: "xlsx" },
  { value: "csv", label: "CSV", ext: "csv" },
  { value: "pdf", label: "PDF", ext: "pdf" },
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
const refName = (r: any, ...keys: string[]) => {
  if (r == null) return "—";
  if (typeof r === "string") return r;
  for (const k of keys) if (r[k]) return r[k];
  return "—";
};

type Option = { value: string; label: string };
type Summary = {
  totalBinsScanned: number;
  standardBinWeightKg: number;
  totalHarvestedKg: number;
  totalHarvestedTonnes: number;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

function HarvestReportPage() {
  // Exporting the report is limited to these roles; everyone else with page
  // access can still read the table.
  const { hasAnyRole } = useAuth();
  const canExport = hasAnyRole(["system_administrator", "operations_director", "field_engineer"]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [groupBy, setGroupBy] = useState<string>("farm");
  const [farmId, setFarmId] = useState("all");
  const [varietyId, setVarietyId] = useState("all");
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<any[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pagination, setPagination] = useState<{ total: number; totalPages: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

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

  // Build the query params shared by the report fetch and the export.
  const buildParams = useCallback(
    (extra?: Record<string, any>) => {
      const params: Record<string, any> = { groupBy, page, limit: PAGE_SIZE };
      if (startDate) params.startDate = new Date(startDate + "T00:00:00").toISOString();
      if (endDate) params.endDate = new Date(endDate + "T23:59:59.999").toISOString();
      if (farmId !== "all") params.farmId = farmId;
      if (varietyId !== "all") params.varietyId = varietyId;
      return { ...params, ...extra };
    },
    [groupBy, page, startDate, endDate, farmId, varietyId],
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await harvestProgress(buildParams());
      const obj = res?.responseObject ?? res?.data ?? res;
      setRows(Array.isArray(obj?.items) ? obj.items : extractList(res));
      setSummary(obj?.summary ?? null);
      const p = obj?.pagination ?? {};
      setPagination({ total: Number(p.total) || 0, totalPages: Math.max(1, Number(p.totalPages) || 1) });
    } catch (e: any) {
      toast.error(e?.message || "Unable to load harvest report");
    } finally {
      setIsLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setPage(1);
  }, [groupBy, startDate, endDate, farmId, varietyId]);

  const runExport = async (format: (typeof EXPORT_FORMATS)[number]) => {
    setExporting(true);
    try {
      // Export the full (unpaginated) result set for the current filters.
      const { page: _p, limit: _l, ...rest } = buildParams();
      const blob = await exportHarvestProgress({ ...rest, format: format.value });
      const range = startDate || endDate ? `${startDate || "start"}_${endDate || "today"}` : "all";
      downloadBlob(blob as Blob, `harvest_progress_${range}.${format.ext}`);
    } catch (e: any) {
      toast.error(e?.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const totalItems = pagination?.total ?? rows.length;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const currentPage = Math.min(page, totalPages);
  const pageStart = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = (currentPage - 1) * PAGE_SIZE + rows.length;
  const groupHeader = GROUP_BY_OPTIONS.find((g) => g.value === groupBy)?.label ?? "Group";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Harvest Report</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bins scanned at reception aggregated across the selected period, with estimated harvested weight.
          </p>
        </div>

  <div className="grid gap-3 md:grid-cols-4">
        <StatTile label="Total bins" value={num(summary?.totalBinsScanned)} icon={Boxes} />
        <StatTile
          label="Estimated kg"
          value={num(summary?.totalHarvestedKg)}
          sub={summary ? `@ ${num(summary.standardBinWeightKg)} kg/bin` : ""}
          icon={Weight}
        />
        <StatTile label="Estimated tonnes" value={num(summary?.totalHarvestedTonnes)} icon={Weight} />
        <StatTile label={`${groupHeader}s`} value={num(totalItems)} icon={Boxes} />
      </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs text-muted-foreground">From</div>
          <Input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 w-36"
            aria-label="Start date"
          />
          <div className="text-xs text-muted-foreground">To</div>
          <Input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 w-36"
            aria-label="End date"
          />
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              {GROUP_BY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      </div>

    

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Farm</TableHead>
                <TableHead>Plot / Valve / Park</TableHead>
                <TableHead>Variety</TableHead>
                <TableHead>Crew</TableHead>
                <TableHead className="text-right">Bins</TableHead>
                <TableHead className="text-right">Estimated kg</TableHead>
                <TableHead className="text-right">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-8 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-8 text-center text-muted-foreground">
                    No harvest in this range.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, i) => {
                  const location =
                    [r.plotName, r.valveName, r.parkName].filter(Boolean).join(" · ") || "—";
                  return (
                    <TableRow key={r.groupId || i}>
                      <TableCell>{r.campaignName || "—"}</TableCell>
                      <TableCell className="font-medium">{r.farmName || "—"}</TableCell>
                      <TableCell>{location}</TableCell>
                      <TableCell>{r.varietyName || "—"}</TableCell>
                      <TableCell>{r.crewName || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{num(r.totalBinsScanned)}</TableCell>
                      <TableCell className="text-right tabular-nums">{num(r.totalHarvestedKg)}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {r.percentageOfTotal != null ? `${r.percentageOfTotal}%` : "—"}
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
                {pageStart}–{pageEnd} of {totalItems} {groupHeader.toLowerCase()}s
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

export default HarvestReportPage;
