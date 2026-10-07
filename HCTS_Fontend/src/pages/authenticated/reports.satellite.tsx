import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getAllSatelliteStaffs, updateSatelliteStaff } from "@/apis/satellitestaffs";
import { getSatelliteWorkers, getAllWorkers } from "@/apis/companies&worker";
import { getAllFarms, allPlotsOfFarm, allValvesOfPlot } from "@/apis/farm.geography";
import { getAllCampaigns } from "@/apis/campaigns";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import { Pencil, Search } from "lucide-react";
import buildPageItems from "@/utils/paginationCount";
import { useAuth } from "@/hooks/use-auth";

const PAGE_SIZE = 10;

const SHIFT_OPTIONS = [
  { value: "full", label: "Full" },
  { value: "partial", label: "Partial" },
] as const;

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
const fmtTime = (v: any) => {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? String(v) : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};
const workerName = (w: any) =>
  [w?.firstName ?? w?.first_name, w?.lastName ?? w?.last_name].filter(Boolean).join(" ") ||
  w?.internalCode ||
  (typeof w === "string" ? w : "—");
const refName = (r: any, ...keys: string[]) => {
  if (r == null) return "—";
  if (typeof r === "string") return r;
  for (const k of keys) if (r[k]) return r[k];
  return "—";
};

type Option = { value: string; label: string };

export const SatelliteStaffPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<{ total: number; totalPages: number } | null>(null);
  const [page, setPage] = useState(1);
  const [editRow, setEditRow] = useState<any | null>(null);

  // Editing satellite staff records is limited to these roles; everyone else
  // with page access gets a read-only table.
  const { hasAnyRole } = useAuth();
  const canManage = hasAnyRole(["system_administrator", "operations_director", "field_engineer"]);
  // 8 data columns, plus the Actions column only when it is rendered.
  const colCount = canManage ? 9 : 8;

  // Filters supported by GET /satellite-staff: workDate, satelliteRoleId, farmId, campaignId.
  const [workDate, setWorkDate] = useState("");
  const [farmId, setFarmId] = useState("all");
  const [satelliteRoleId, setSatelliteRoleId] = useState("all");
  const [campaignId, setCampaignId] = useState("all");

  const [farmOptions, setFarmOptions] = useState<Option[]>([]);
  const [roleOptions, setRoleOptions] = useState<Option[]>([]);
  const [campaignOptions, setCampaignOptions] = useState<Option[]>([]);

  // Load filter dropdown options once (also reused by the edit sheet).
  useEffect(() => {
    getAllFarms({ limit: 200 })
      .then((res) => setFarmOptions(extractList(res).map((f) => ({ value: idOf(f), label: refName(f, "farmName", "name") }))))
      .catch(() => setFarmOptions([]));
    getSatelliteWorkers()
      .then((res) => setRoleOptions(extractList(res).map((r) => ({ value: idOf(r), label: refName(r, "name") }))))
      .catch(() => setRoleOptions([]));
    getAllCampaigns({ limit: 200 })
      .then((res) =>
        setCampaignOptions(
          extractList(res).map((c) => ({ value: idOf(c), label: refName(c, "campaignName", "campaignCode") })),
        ),
      )
      .catch(() => setCampaignOptions([]));
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: PAGE_SIZE };
      if (workDate) params.workDate = workDate;
      if (farmId !== "all") params.farmId = farmId;
      if (satelliteRoleId !== "all") params.satelliteRoleId = satelliteRoleId;
      if (campaignId !== "all") params.campaignId = campaignId;
      const res = await getAllSatelliteStaffs(params);
      setRows(extractList(res));
      setPagination(extractPagination(res));
    } catch (e: any) {
      toast.error(e?.message || "Unable to load satellite staff");
    } finally {
      setIsLoading(false);
    }
  }, [page, workDate, farmId, satelliteRoleId, campaignId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setPage(1);
  }, [workDate, farmId, satelliteRoleId, campaignId]);

  const hasFilters = !!workDate || farmId !== "all" || satelliteRoleId !== "all" || campaignId !== "all";
  const clearFilters = () => {
    setWorkDate("");
    setFarmId("all");
    setSatelliteRoleId("all");
    setCampaignId("all");
  };

  const totalItems = pagination?.total ?? rows.length;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const currentPage = Math.min(page, totalPages);
  const pageStart = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = (currentPage - 1) * PAGE_SIZE + rows.length;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Satellite Staff</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Daily attendance and shift entries for support staff working across farms.
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
            <Select value={campaignId} onValueChange={setCampaignId}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All campaigns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All campaigns</SelectItem>
                {campaignOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={farmId} onValueChange={setFarmId}>
              <SelectTrigger className="w-44">
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
            <Select value={satelliteRoleId} onValueChange={setSatelliteRoleId}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {roleOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Worker</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Farm / Plot / Valve</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Fraction</TableHead>
                  {/* <TableHead>In → Out</TableHead> */}
                  {canManage && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={colCount} className="p-8 text-center text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={colCount} className="p-8 text-center text-muted-foreground">
                      No satellite staff entries found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => {
                    const farm = refName(r.farm, "farmName", "legalName", "legal_name");
                    const plot = refName(r.plot, "plotName", "name");
                    const valve = refName(r.valve, "valveName", "name");
                    const shift = String(r.shiftType ?? r.shift_type ?? "—").replace(/_/g, " ");
                    const entryTime = r.entryTime ?? r.entry_time;
                    const exitTime = r.exitTime ?? r.exit_time;
                    return (
                      <TableRow key={idOf(r)}>
                        <TableCell>{fmtDate(r.workDate ?? r.work_date)}</TableCell>
                        <TableCell>{refName(r.campaign, "campaignName", "campaignCode")}</TableCell>
                        <TableCell>{workerName(r.worker)}</TableCell>
                        <TableCell>{refName(r.satelliteRole, "name")}</TableCell>
                        <TableCell>{refName(r.employmentCompany, "companyName", "legal_name", "name")}</TableCell>
                        <TableCell>{`${farm}${plot !== "—" ? " · " + plot : ""}${valve !== "—" ? " · " + valve : ""}`}</TableCell>
                        <TableCell>{shift}</TableCell>
                        <TableCell>{r.shiftFraction ?? r.shift_fraction ?? "—"}</TableCell>
                        {/* <TableCell>
                          {entryTime || exitTime
                            ? `${fmtTime(entryTime)} → ${fmtTime(exitTime)}`
                            : "—"}
                        </TableCell> */}
                        {canManage && (
                          <TableCell className="text-right">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" onClick={() => setEditRow(r)} aria-label="Edit">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            {totalItems > PAGE_SIZE && (
              <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {pageStart}–{pageEnd} of {totalItems} entries
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

        <EditStaffSheet
          row={editRow}
          roleOptions={roleOptions}
          farmOptions={farmOptions}
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

// Single-worker searchable picker (server-side search over active workers).
function useWorkerSearch(open: boolean) {
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const [workers, setWorkers] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(input), 350);
    return () => clearTimeout(t);
  }, [input]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    const params: Record<string, any> = { limit: 50 };
    if (debounced.trim()) params.search = debounced.trim();
    getAllWorkers(params)
      .then((res) => {
        if (active) setWorkers(extractList(res).map((w) => ({ value: idOf(w), label: workerName(w) })));
      })
      .catch(() => active && setWorkers([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [open, debounced]);

  return { input, setInput, workers, loading };
}

// A select whose options are fetched from the value of a parent select.
function DependentSelect({
  parentValue,
  value,
  onChange,
  fetchOptions,
  labelKeys,
  placeholder,
  parentLabel,
}: {
  parentValue: string;
  value: string;
  onChange: (v: string) => void;
  fetchOptions: (parentId: string) => Promise<any>;
  labelKeys: string[];
  placeholder?: string;
  parentLabel?: string;
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
        if (active)
          setOptions(extractList(res).map((r) => ({ value: idOf(r), label: refName(r, ...labelKeys) })));
      })
      .catch(() => active && setOptions([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentValue]);

  return (
    <Select
      value={value || "__none__"}
      onValueChange={(v) => onChange(v === "__none__" ? "" : v)}
      disabled={!parentValue || loading}
    >
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={
            !parentValue ? `Select ${parentLabel ?? "parent"} first` : loading ? "Loading…" : placeholder ?? "None"
          }
        />
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

function EditStaffSheet({
  row,
  roleOptions,
  farmOptions,
  onClose,
  onSaved,
}: {
  row: any | null;
  roleOptions: Option[];
  farmOptions: Option[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const open = !!row;

  const [workDate, setWorkDate] = useState("");
  const [worker, setWorker] = useState("");
  const [satelliteRoleId, setSatelliteRoleId] = useState("");
  const [farmId, setFarmId] = useState("");
  const [plotId, setPlotId] = useState("");
  const [valveId, setValveId] = useState("");
  const [shiftType, setShiftType] = useState<"full" | "partial">("full");
  const [shiftFraction, setShiftFraction] = useState("");
  const [partialReason, setPartialReason] = useState("");
  const [workZone, setWorkZone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { input, setInput, workers, loading } = useWorkerSearch(open);

  // Preserve the currently-selected worker's label even when not in the search page.
  const [knownWorkers, setKnownWorkers] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!workers.length) return;
    setKnownWorkers((prev) => {
      const next = { ...prev };
      workers.forEach((w) => (next[w.value] = w.label));
      return next;
    });
  }, [workers]);

  useEffect(() => {
    if (!open) return;
    setWorkDate(row?.workDate ? new Date(row.workDate).toISOString().slice(0, 10) : "");
    setWorker(refId(row?.worker));
    setSatelliteRoleId(refId(row?.satelliteRole));
    setFarmId(refId(row?.farm));
    setPlotId(refId(row?.plot));
    setValveId(refId(row?.valve));
    setShiftType(row?.shiftType === "partial" ? "partial" : "full");
    setShiftFraction(row?.shiftFraction != null ? String(row.shiftFraction) : "");
    setPartialReason(row?.partialReason ?? "");
    setWorkZone(row?.workZone ?? "");
    setInput("");
    // Seed the worker label from the populated row.
    if (row?.worker && typeof row.worker === "object") {
      const id = refId(row.worker);
      if (id) setKnownWorkers((prev) => ({ ...prev, [id]: workerName(row.worker) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, row]);

  const labelFor = (id: string) => knownWorkers[id] ?? workers.find((w) => w.value === id)?.label ?? id;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker) return toast.error("Worker is required");
    if (!satelliteRoleId) return toast.error("Satellite role is required");
    if (!farmId) return toast.error("Farm is required");
    if (shiftType === "partial") {
      const f = Number(shiftFraction);
      if (shiftFraction === "" || Number.isNaN(f) || f < 0 || f > 1) {
        return toast.error("Shift fraction must be between 0 and 1");
      }
    }

    const payload: Record<string, any> = {
      workerId: worker,
      satelliteRoleId,
      farmId,
      plotId: plotId || null,
      valveId: valveId || null,
      shiftType,
      workZone,
    };
    if (workDate) payload.workDate = new Date(workDate).toISOString();
    if (shiftType === "partial") {
      payload.shiftFraction = Number(shiftFraction);
      payload.partialReason = partialReason;
    } else {
      payload.shiftFraction = 1.0;
    }

    setSubmitting(true);
    try {
      await updateSatelliteStaff(idOf(row), payload);
      toast.success("Satellite staff updated");
      onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update satellite staff");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit satellite staff</SheetTitle>
        </SheetHeader>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label>Work date</Label>
            <Input type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>
              Worker <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search workers…"
                className="pl-8"
              />
            </div>
            <Select value={worker} onValueChange={setWorker}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select worker">{worker ? labelFor(worker) : undefined}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <div className="px-2 py-6 text-center text-sm text-muted-foreground">Searching…</div>
                ) : workers.length === 0 ? (
                  <div className="px-2 py-6 text-center text-sm text-muted-foreground">No workers found.</div>
                ) : (
                  workers.map((w) => (
                    <SelectItem key={w.value} value={w.value}>
                      {w.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>
              Satellite role <span className="text-destructive">*</span>
            </Label>
            <Select value={satelliteRoleId} onValueChange={setSatelliteRoleId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((o) => (
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
              <Label>Plot</Label>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Shift type</Label>
              <Select value={shiftType} onValueChange={(v) => setShiftType(v as "full" | "partial")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  {SHIFT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {shiftType === "partial" && (
              <div className="space-y-1.5">
                <Label>
                  Shift fraction <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  max={1}
                  value={shiftFraction}
                  onChange={(e) => setShiftFraction(e.target.value)}
                  placeholder="0.0 – 1.0"
                />
              </div>
            )}
          </div>

          {shiftType === "partial" && (
            <div className="space-y-1.5">
              <Label>Partial reason</Label>
              <Input
                value={partialReason}
                onChange={(e) => setPartialReason(e.target.value)}
                placeholder="Reason for partial shift"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Work zone</Label>
            <Input value={workZone} onChange={(e) => setWorkZone(e.target.value)} placeholder="Optional" />
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
