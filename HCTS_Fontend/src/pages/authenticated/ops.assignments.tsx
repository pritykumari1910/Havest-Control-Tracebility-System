import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getAllAssignments, updateAssignmentStatus, updateAssignment } from "@/apis/harvest.assignments";
import { getAllCrews } from "@/apis/crews";
import { getAllVarieties } from "@/apis/varieties";
import { getAllFarms, allPlotsOfFarm, allValvesOfPlot } from "@/apis/farm.geography";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pencil } from "lucide-react";
import buildPageItems from "@/utils/paginationCount";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "closed", label: "Closed" },
] as const;

const ZONE_TYPE_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "trial", label: "Trial" },
  { value: "monitoring", label: "Monitoring" },
  { value: "control", label: "Control" },
  { value: "other", label: "Other" },
] as const;

const STATUS_TONE: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
  active: "secondary",
  paused: "outline",
  closed: "default",
};

const idOf = (r: any) => r?._id ?? r?.id;
const refId = (v: any) => (v == null ? "" : typeof v === "object" ? idOf(v) ?? "" : v);
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
const fmtDate = (v: any) => (v ? new Date(v).toLocaleDateString() : "—");
const refName = (r: any, ...keys: string[]) => {
  if (r == null) return "—";
  if (typeof r === "string") return r;
  for (const k of keys) if (r[k]) return r[k];
  return "—";
};

type Option = { value: string; label: string };

const HarvestAssignmentsPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<{ total: number; totalPages: number } | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [workDate, setWorkDate] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<any | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: PAGE_SIZE };
      if (statusFilter !== "all") params.status = statusFilter;
      if (workDate) params.workDate = new Date(workDate).toISOString();
      const res = await getAllAssignments(params);
      setRows(extractList(res));
      setPagination(extractPagination(res));
    } catch (e: any) {
      toast.error(e?.message || "Unable to load assignments");
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, workDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, workDate]);

  const totalItems = pagination?.total ?? rows.length;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const currentPage = Math.min(page, totalPages);
  const pageStart = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = (currentPage - 1) * PAGE_SIZE + rows.length;

  const changeStatus = async (row: any, status: string) => {
    if (status === row.status) return;
    setUpdatingId(idOf(row));
    try {
      await updateAssignmentStatus(idOf(row), status);
      toast.success("Status updated");
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Unable to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Harvest Assignments</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Daily crew assignments to plots, valves and varieties with their QR range.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              className="w-40"
              aria-label="Work date"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
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
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Crew</TableHead>
                  <TableHead>Farm</TableHead>
                  <TableHead>Plot / Valve</TableHead>
                  <TableHead>Variety</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>QR Range</TableHead>
                  <TableHead className="w-40">Status</TableHead>
                  <TableHead className="text-right">Edit</TableHead>
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
                      No assignments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={idOf(r)}>
                      <TableCell>{fmtDate(r.workDate)}</TableCell>
                      <TableCell className="font-medium">{r.crew?.crewCode ?? r.crew?.crewName ?? "—"}</TableCell>
                      <TableCell>{r.farm?.farmName ?? "—"}</TableCell>
                      <TableCell>
                        {r.plot?.plotName ?? "—"}
                        {r.valve?.valveName ? ` · ${r.valve.valveName}` : ""}
                      </TableCell>
                      <TableCell>{r.variety?.varietyName ?? "—"}</TableCell>
                      <TableCell>{r.assignedRows || "—"}</TableCell>
                      <TableCell>
                        {r.startQrNumber != null ? (
                          <span className="font-mono text-xs">
                            {r.qrSeries?.seriesName ? `${r.qrSeries.seriesName}: ` : ""}
                            {r.startQrNumber}…{r.endQrNumber ?? "?"}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={r.status}
                          onValueChange={(v) => changeStatus(r, v)}
                          disabled={updatingId === idOf(r)}
                        >
                          <SelectTrigger className="h-8 w-32">
                            <SelectValue>
                              <Badge variant={STATUS_TONE[r.status] ?? "outline"}>{r.status ?? "—"}</Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant="ghost" onClick={() => setEditRow(r)} aria-label="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit assignment</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {totalItems > PAGE_SIZE && (
              <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {pageStart}–{pageEnd} of {totalItems} assignments
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

        <EditAssignmentSheet
          row={editRow}
          onClose={() => setEditRow(null)}
          onSaved={() => {
            setEditRow(null);
            refresh();
          }}
        />
      </div>
    </TooltipProvider>
  );
};

// A select whose options are fetched from the value of a parent select.
function DependentSelect({
  parentValue,
  value,
  onChange,
  fetchOptions,
  labelKeys,
  parentLabel,
}: {
  parentValue: string;
  value: string;
  onChange: (v: string) => void;
  fetchOptions: (parentId: string) => Promise<any>;
  labelKeys: string[];
  parentLabel: string;
}) {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!parentValue) {
      setOptions([]);
      return;
    }
    let active = true;
    setLoading(true);
    fetchOptions(parentValue)
      .then((res) => {
        if (active) setOptions(extractList(res).map((r) => ({ value: idOf(r), label: refName(r, ...labelKeys) })));
      })
      .catch(() => active && setOptions([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentValue]);

  return (
    <Select value={value || "__none__"} onValueChange={(v) => onChange(v === "__none__" ? "" : v)} disabled={!parentValue || loading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={!parentValue ? `Select ${parentLabel} first` : loading ? "Loading…" : "None"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">None</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function EditAssignmentSheet({
  row,
  onClose,
  onSaved,
}: {
  row: any | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const open = !!row;

  const [workDate, setWorkDate] = useState("");
  const [crewId, setCrewId] = useState("");
  const [farmId, setFarmId] = useState("");
  const [plotId, setPlotId] = useState("");
  const [valveId, setValveId] = useState("");
  const [varietyId, setVarietyId] = useState("");
  const [zoneType, setZoneType] = useState("normal");
  const [assignedRows, setAssignedRows] = useState("");
  const [specialZone, setSpecialZone] = useState("");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [crewOptions, setCrewOptions] = useState<Option[]>([]);
  const [farmOptions, setFarmOptions] = useState<Option[]>([]);
  const [varietyOptions, setVarietyOptions] = useState<Option[]>([]);

  // Load option lists when the sheet opens.
  useEffect(() => {
    if (!open) return;
    getAllCrews({ limit: 100 })
      .then((res) =>
        setCrewOptions(extractList(res).map((c) => ({ value: idOf(c), label: refName(c, "crewCode", "crewName") }))),
      )
      .catch(() => setCrewOptions([]));
    getAllFarms({ limit: 200 })
      .then((res) => setFarmOptions(extractList(res).map((f) => ({ value: idOf(f), label: refName(f, "farmName", "name") }))))
      .catch(() => setFarmOptions([]));
    getAllVarieties()
      .then((res) =>
        setVarietyOptions(extractList(res).map((v) => ({ value: idOf(v), label: refName(v, "varietyName", "name") }))),
      )
      .catch(() => setVarietyOptions([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setWorkDate(row?.workDate ? new Date(row.workDate).toISOString().slice(0, 10) : "");
    setCrewId(refId(row?.crew));
    setFarmId(refId(row?.farm));
    setPlotId(refId(row?.plot));
    setValveId(refId(row?.valve));
    setVarietyId(refId(row?.variety));
    setZoneType(row?.zoneType ?? "normal");
    setAssignedRows(row?.assignedRows ?? "");
    setSpecialZone(row?.specialZone ?? "");
    setComments(row?.comments ?? "");
  }, [open, row]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crewId) return toast.error("Crew is required");
    if (!farmId) return toast.error("Farm is required");
    if (!plotId) return toast.error("Plot is required");
    if (!varietyId) return toast.error("Variety is required");

    const payload: Record<string, any> = {
      crewId,
      farmId,
      plotId,
      valveId: valveId || null,
      varietyId,
      zoneType,
      assignedRows: assignedRows.trim() || null,
      specialZone: specialZone.trim() || null,
      comments: comments.trim() || null,
    };
    if (workDate) payload.workDate = new Date(workDate).toISOString();

    setSubmitting(true);
    try {
      await updateAssignment(idOf(row), payload);
      toast.success("Assignment updated");
      onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update assignment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit assignment</SheetTitle>
        </SheetHeader>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label>Work date</Label>
            <Input type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>
              Crew <span className="text-destructive">*</span>
            </Label>
            <Select value={crewId} onValueChange={setCrewId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select crew" />
              </SelectTrigger>
              <SelectContent>
                {crewOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>
              Farm <span className="text-destructive">*</span>
            </Label>
            <Select
              value={farmId}
              onValueChange={(v) => {
                setFarmId(v);
                setPlotId("");
                setValveId("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select farm" />
              </SelectTrigger>
              <SelectContent>
                {farmOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                Plot <span className="text-destructive">*</span>
              </Label>
              <DependentSelect
                parentValue={farmId}
                value={plotId}
                onChange={(v) => {
                  setPlotId(v);
                  setValveId("");
                }}
                fetchOptions={allPlotsOfFarm}
                labelKeys={["plotName", "plotCode", "name"]}
                parentLabel="farm"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Valve</Label>
              <DependentSelect
                parentValue={plotId}
                value={valveId}
                onChange={setValveId}
                fetchOptions={allValvesOfPlot}
                labelKeys={["valveName", "valveCode", "name"]}
                parentLabel="plot"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>
              Variety <span className="text-destructive">*</span>
            </Label>
            <Select value={varietyId} onValueChange={setVarietyId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select variety" />
              </SelectTrigger>
              <SelectContent>
                {varietyOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Zone type</Label>
              <Select value={zoneType} onValueChange={setZoneType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select zone type" />
                </SelectTrigger>
                <SelectContent>
                  {ZONE_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assigned rows</Label>
              <Input value={assignedRows} onChange={(e) => setAssignedRows(e.target.value)} placeholder="e.g. 1–12" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Special zone</Label>
            <Input value={specialZone} onChange={(e) => setSpecialZone(e.target.value)} placeholder="Optional" />
          </div>

          <div className="space-y-1.5">
            <Label>Comments</Label>
            <Textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={3} placeholder="Optional" />
          </div>

          <SheetFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default HarvestAssignmentsPage;
