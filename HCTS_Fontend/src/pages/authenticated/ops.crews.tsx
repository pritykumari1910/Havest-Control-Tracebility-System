import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getAllCrews,
  createCrew,
  updateCrew,
  toggleCrewStatus,
  copyPreviousCrews,
  getAttendanceByCrewId,
  checkInAttendance,
  checkOutAttendance,
} from "@/apis/crews";
import { getAllWorkers } from "@/apis/companies&worker";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, Pencil, Power, Users, CalendarClock, Search } from "lucide-react";
import buildPageItems from "@/utils/paginationCount";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
] as const;

const STATUS_TONE: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
  draft: "outline",
  active: "secondary",
  closed: "default",
};

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
const fmtDate = (v: any) => (v ? new Date(v).toLocaleDateString() : "—");
const fmtTime = (v: any) =>
  v ? new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
const workerName = (w: any) =>
  [w?.firstName, w?.lastName].filter(Boolean).join(" ") ||
  w?.documentIdNumber ||
  (typeof w === "string" ? w : "—");
const refId = (v: any) => (v == null ? "" : typeof v === "object" ? idOf(v) ?? "" : v);

type WorkerOption = { value: string; label: string };

function statusBadge(v: string) {
  return <Badge variant={STATUS_TONE[v] ?? "outline"}>{v ?? "—"}</Badge>;
}

// Reusable worker picker data (server-side search).
function useWorkerSearch(open: boolean) {
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const [workers, setWorkers] = useState<WorkerOption[]>([]);
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

function CrewsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<{ total: number; totalPages: number } | null>(null);
  const [page, setPage] = useState(1);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [workDate, setWorkDate] = useState("");

  const [creating, setCreating] = useState(false);
  const [editRow, setEditRow] = useState<any | null>(null);
  const [attendanceCrew, setAttendanceCrew] = useState<any | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: PAGE_SIZE };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "all") params.status = statusFilter;
      if (workDate) params.workDate = new Date(workDate).toISOString();
      const res = await getAllCrews(params);
      setRows(extractList(res));
      setPagination(extractPagination(res));
    } catch (e: any) {
      toast.error(e?.message || "Unable to load crews");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, workDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, workDate]);

  const totalItems = pagination?.total ?? rows.length;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const currentPage = Math.min(page, totalPages);
  const pageStart = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = (currentPage - 1) * PAGE_SIZE + rows.length;

  const toggle = async (row: any) => {
    setTogglingId(idOf(row));
    try {
      await toggleCrewStatus(idOf(row));
      toast.success("Crew status updated");
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Unable to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const copyPrevious = async () => {
    setCopying(true);
    try {
      const res = await copyPreviousCrews(workDate ? { workDate: new Date(workDate).toISOString() } : undefined);
      toast.success(res?.message || "Crews copied from previous day");
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Unable to copy crews");
    } finally {
      setCopying(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Daily Crews</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Crews formed for a work date, led by a supervisor. Pickers and attendance hang off each crew.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search crews…"
                className="w-52 pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
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
            <Input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              className="w-40"
              aria-label="Work date"
            />
            {/* <Button variant="outline" onClick={copyPrevious} disabled={copying}>
              <CalendarClock className="mr-2 h-4 w-4" />
              {copying ? "Copying…" : "Copy previous"}
            </Button> */}
            {/* <Button onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New crew
            </Button> */}
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>Pickers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-8 text-center text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-8 text-center text-muted-foreground">
                      No crews — click “New crew” to add one.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={idOf(r)}>
                      <TableCell>{fmtDate(r.workDate)}</TableCell>
                      <TableCell className="font-medium">{r.crewCode}</TableCell>
                      <TableCell>{r.crewName}</TableCell>
                      <TableCell>{workerName(r.supervisor)}</TableCell>
                      <TableCell>{Array.isArray(r.assignedPickers) ? r.assignedPickers.length : 0}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setAttendanceCrew(r)}
                                aria-label="Attendance"
                              >
                                <Users className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Attendance</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" onClick={() => setEditRow(r)} aria-label="Edit">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={togglingId === idOf(r)}
                                onClick={() => toggle(r)}
                                aria-label="Advance status"
                              >
                                <Power className={r.status === "active" ? "h-4 w-4 text-destructive" : "h-4 w-4 text-primary"} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {r.status === "draft" ? "Activate" : r.status === "active" ? "Close" : "Reopen"}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {totalItems > PAGE_SIZE && (
              <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {pageStart}–{pageEnd} of {totalItems} crews
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

        <CrewSheet
          open={creating || !!editRow}
          row={editRow}
          onClose={() => {
            setCreating(false);
            setEditRow(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditRow(null);
            refresh();
          }}
        />

        <AttendanceSheet crew={attendanceCrew} onClose={() => setAttendanceCrew(null)} />
      </div>
    </TooltipProvider>
  );
}

function CrewSheet({
  open,
  row,
  onClose,
  onSaved,
}: {
  open: boolean;
  row: any | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!row;
  const [crewName, setCrewName] = useState("");
  const [workDate, setWorkDate] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [leader, setLeader] = useState("");
  const [pickers, setPickers] = useState<string[]>([]);
  const [status, setStatus] = useState("Draft");
  const [submitting, setSubmitting] = useState(false);

  const { input, setInput, workers, loading } = useWorkerSearch(open);

  // Keep labels for already-selected workers even when they aren't in the current search page.
  const [knownWorkers, setKnownWorkers] = useState<Record<string, string>>({});
  useEffect(() => {
    if (workers.length === 0) return;
    setKnownWorkers((prev) => {
      const next = { ...prev };
      workers.forEach((w) => (next[w.value] = w.label));
      return next;
    });
  }, [workers]);

  useEffect(() => {
    if (!open) return;
    setCrewName(row?.crewName ?? "");
    setWorkDate(row?.workDate ? new Date(row.workDate).toISOString().slice(0, 10) : "");
    setSupervisor(refId(row?.supervisor));
    setLeader(refId(row?.leader));
    setPickers(Array.isArray(row?.assignedPickers) ? row.assignedPickers.map(refId).filter(Boolean) : []);
    setStatus(row?.status ?? "Draft");
    setInput("");
    // Seed labels from the populated crew record.
    const seed: Record<string, string> = {};
    const add = (w: any) => {
      const id = refId(w);
      if (id && typeof w === "object") seed[id] = workerName(w);
    };
    add(row?.supervisor);
    add(row?.leader);
    (row?.assignedPickers ?? []).forEach(add);
    setKnownWorkers((prev) => ({ ...prev, ...seed }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, row]);

  const labelFor = (id: string) => knownWorkers[id] ?? workers.find((w) => w.value === id)?.label ?? id;

  const togglePicker = (id: string) =>
    setPickers((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crewName.trim()) return toast.error("Crew name is required");
    if (!supervisor) return toast.error("Supervisor is required");
    if (pickers.length === 0) return toast.error("Add at least one picker");

    const payload: Record<string, any> = {
      crewName: crewName.trim(),
      supervisor,
      assignedPickers: pickers,
      leader: leader || null,
      status,
    };
    if (workDate) payload.workDate = new Date(workDate).toISOString();

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateCrew(idOf(row), payload);
        toast.success("Crew updated");
      } else {
        await createCrew(payload);
        toast.success("Crew created");
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save crew");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit crew" : "New crew"}</SheetTitle>
        </SheetHeader>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                Crew name <span className="text-destructive">*</span>
              </Label>
              <Input value={crewName} onChange={(e) => setCrewName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Work date</Label>
              <Input type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>
              Supervisor <span className="text-destructive">*</span>
            </Label>
            <Select value={supervisor} onValueChange={setSupervisor}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select supervisor">
                  {supervisor ? labelFor(supervisor) : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {workers.map((w) => (
                  <SelectItem key={w.value} value={w.value}>
                    {w.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Leader (optional)</Label>
            <Select value={leader || "__none__"} onValueChange={(v) => setLeader(v === "__none__" ? "" : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select leader">{leader ? labelFor(leader) : undefined}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {workers.map((w) => (
                  <SelectItem key={w.value} value={w.value}>
                    {w.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>
                Pickers <span className="text-destructive">*</span>
              </Label>
              <span className="text-xs text-muted-foreground">{pickers.length} selected</span>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search workers…"
                className="pl-8"
              />
            </div>
            <div className="max-h-48 space-y-1 overflow-auto rounded-md border p-1">
              {loading ? (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">Searching…</div>
              ) : workers.length === 0 ? (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">No workers found.</div>
              ) : (
                workers.map((w) => (
                  <label
                    key={w.value}
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <Checkbox checked={pickers.includes(w.value)} onCheckedChange={() => togglePicker(w.value)} />
                    {w.label}
                  </label>
                ))
              )}
            </div>
            {pickers.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {pickers.map((id) => (
                  <Badge key={id} variant="secondary" className="gap-1 font-normal">
                    {labelFor(id)}
                    <button
                      type="button"
                      onClick={() => togglePicker(id)}
                      className="ml-0.5 text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <SheetFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create crew"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function AttendanceSheet({ crew, onClose }: { crew: any | null; onClose: () => void }) {
  const open = !!crew;
  const crewId = crew ? idOf(crew) : "";
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  // Pickers assigned to this crew are the check-in candidates.
  const pickers: WorkerOption[] = Array.isArray(crew?.assignedPickers)
    ? crew.assignedPickers
        .map((p: any) => ({ value: refId(p), label: workerName(p) }))
        .filter((p: WorkerOption) => p.value)
    : [];

  const load = useCallback(async () => {
    if (!crewId) return;
    setLoading(true);
    try {
      const res = await getAttendanceByCrewId(crewId);
      setLogs(extractList(res));
    } catch (e: any) {
      toast.error(e?.message || "Unable to load attendance");
    } finally {
      setLoading(false);
    }
  }, [crewId]);

  useEffect(() => {
    if (open) {
      setSelected([]);
      load();
    }
  }, [open, load]);

  const toggleSel = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));

  const doCheck = async (kind: "in" | "out") => {
    if (selected.length === 0) return toast.error("Select at least one picker");
    setBusy(true);
    try {
      if (kind === "in") await checkInAttendance(crewId, { workerIds: selected });
      else await checkOutAttendance(crewId, { workerIds: selected });
      toast.success(kind === "in" ? "Checked in" : "Checked out");
      setSelected([]);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Attendance update failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Attendance · {crew?.crewCode}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Pickers</Label>
              {/* <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => doCheck("in")}
                  disabled={busy || selected.length === 0}
                >
                  Check in
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => doCheck("out")}
                  disabled={busy || selected.length === 0}
                >
                  Check out
                </Button>
              </div> */}
            </div>
            {pickers.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
                No pickers assigned to this crew.
              </p>
            ) : (
              <div className="max-h-40 space-y-1 overflow-auto rounded-md border p-1">
                {pickers.map((p) => (
                  <label
                    key={p.value}
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <Checkbox checked={selected.includes(p.value)} onCheckedChange={() => toggleSel(p.value)} />
                    {p.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Attendance log</div>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : logs.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                No attendance recorded yet.
              </p>
            ) : (
              <div className="overflow-hidden rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-2 text-left font-medium">Worker</th>
                      <th className="p-2 text-left font-medium">In</th>
                      <th className="p-2 text-left font-medium">Out</th>
                      <th className="p-2 text-left font-medium">Shift</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr key={idOf(l)} className="border-t">
                        <td className="p-2">{workerName(l.worker)}</td>
                        <td className="p-2">{fmtTime(l.entryTime)}</td>
                        <td className="p-2">{fmtTime(l.exitTime)}</td>
                        <td className="p-2 tabular-nums">{l.shiftFraction ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default CrewsPage;
