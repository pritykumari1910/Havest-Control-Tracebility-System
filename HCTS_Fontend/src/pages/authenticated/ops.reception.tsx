import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getAllReceptonsBatchList,
  getAllPalletsForReception,
  updateReceptionPallets,
} from "@/apis/reception&pallets";
import { getMachine, getMachineOperators } from "@/apis/machine.operators";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Package, Pencil } from "lucide-react";
import buildPageItems from "@/utils/paginationCount";

type Option = { value: string; label: string };

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
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

const fmtDate = (v: any) => (v ? new Date(v).toLocaleDateString() : "—");
const fmtDateTime = (v: any) => (v ? new Date(v).toLocaleString() : "—");
const workerName = (w: any) =>
  [w?.firstName ?? w?.first_name, w?.lastName ?? w?.last_name].filter(Boolean).join(" ") || "—";
const refName = (r: any, ...keys: string[]) => {
  if (r == null) return "—";
  if (typeof r === "string") return r;
  for (const k of keys) if (r[k]) return r[k];
  return "—";
};
const machineLabel = (m: any) => {
  if (!m || typeof m !== "object") return "—";
  const name = m.name ?? "—";
  const code = m.internalCode ?? m.licensePlateOrInternalId;
  return code ? `${name} · ${code}` : name;
};

function statusBadge(status: string) {
  return <Badge variant={status === "open" ? "default" : "outline"}>{status === "open" ? "Open" : "Closed"}</Badge>;
}

export const ReceptionPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<{ total: number; totalPages: number } | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [palletsBatch, setPalletsBatch] = useState<any | null>(null);
  const [editBatch, setEditBatch] = useState<any | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: PAGE_SIZE };
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await getAllReceptonsBatchList(params);
      setRows(extractList(res));
      setPagination(extractPagination(res));
    } catch (e: any) {
      toast.error(e?.message || "Unable to load reception batches");
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

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
            <h1 className="text-2xl font-semibold tracking-tight">Reception &amp; Pallets</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {/* Reception sessions opened at a machine by an operator. Pallet bins are scanned within an open batch. */}
              Reception batches are created at the collection point. Pallets are then scanned and added to the corresponding reception batch.
            </p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
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

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Closed</TableHead>
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
                      No reception batches found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={idOf(r)}>
                      <TableCell>{fmtDate(r.workDate)}</TableCell>
                      <TableCell className="font-medium">{r.batchCode ?? "—"}</TableCell>
                      <TableCell>{machineLabel(r.machine)}</TableCell>
                      <TableCell>{workerName(r.operator?.worker)}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.closedAt ? fmtDateTime(r.closedAt) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setPalletsBatch(r)}
                                aria-label="View pallets"
                              >
                                <Package className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View scanned pallets</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setEditBatch(r)}
                                aria-label="Edit batch"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit batch</TooltipContent>
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
                  {pageStart}–{pageEnd} of {totalItems} batches
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

        <PalletsSheet batch={palletsBatch} onClose={() => setPalletsBatch(null)} />

        <EditBatchSheet
          batch={editBatch}
          onClose={() => setEditBatch(null)}
          onSaved={() => {
            setEditBatch(null);
            refresh();
          }}
        />
      </div>
    </TooltipProvider>
  );
};

function EditBatchSheet({
  batch,
  onClose,
  onSaved,
}: {
  batch: any | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const open = !!batch;

  const [workDate, setWorkDate] = useState("");
  const [status, setStatus] = useState("open");
  const [machineId, setMachineId] = useState("");
  const [operatorId, setOperatorId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [machineOptions, setMachineOptions] = useState<Option[]>([]);
  const [operatorOptions, setOperatorOptions] = useState<Option[]>([]);
  const [operatorsLoading, setOperatorsLoading] = useState(false);

  // Load machines when the sheet opens.
  useEffect(() => {
    if (!open) return;
    getMachine({ limit: 100 })
      .then((res) =>
        setMachineOptions(extractList(res).map((m) => ({ value: idOf(m), label: machineLabel(m) }))),
      )
      .catch(() => setMachineOptions([]));
  }, [open]);

  // Seed the form from the batch.
  useEffect(() => {
    if (!open) return;
    setWorkDate(batch?.workDate ? new Date(batch.workDate).toISOString().slice(0, 10) : "");
    setStatus(batch?.status === "closed" ? "closed" : "open");
    setMachineId(idOf(batch?.machine) ?? (typeof batch?.machine === "string" ? batch.machine : ""));
    setOperatorId(idOf(batch?.operator) ?? (typeof batch?.operator === "string" ? batch.operator : ""));
  }, [open, batch]);

  // Load the operators standing-assigned to the selected machine.
  useEffect(() => {
    if (!open || !machineId) {
      setOperatorOptions([]);
      return;
    }
    let active = true;
    setOperatorsLoading(true);
    getMachineOperators(machineId)
      .then((res) => {
        if (active)
          setOperatorOptions(
            extractList(res).map((op) => ({ value: idOf(op), label: workerName(op.worker) })),
          );
      })
      .catch(() => active && setOperatorOptions([]))
      .finally(() => active && setOperatorsLoading(false));
    return () => {
      active = false;
    };
  }, [open, machineId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineId) return toast.error("Machine is required");
    if (!operatorId) return toast.error("Operator is required");

    const payload: Record<string, any> = { machineId, operatorId, status };
    if (workDate) payload.workDate = new Date(workDate).toISOString();

    setSubmitting(true);
    try {
      await updateReceptionPallets(idOf(batch), payload);
      toast.success("Reception batch updated");
      onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update batch");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit batch · {batch?.batchCode ?? ""}</SheetTitle>
        </SheetHeader>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label>Work date</Label>
            <Input type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>
              Machine <span className="text-destructive">*</span>
            </Label>
            <Select
              value={machineId}
              onValueChange={(v) => {
                setMachineId(v);
                setOperatorId("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select machine" />
              </SelectTrigger>
              <SelectContent>
                {machineOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>
              Operator <span className="text-destructive">*</span>
            </Label>
            <Select value={operatorId} onValueChange={setOperatorId} disabled={!machineId || operatorsLoading}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={!machineId ? "Select machine first" : operatorsLoading ? "Loading…" : "Select operator"}
                />
              </SelectTrigger>
              <SelectContent>
                {operatorOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {submitting ? "Saving…" : "Save changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function PalletsSheet({ batch, onClose }: { batch: any | null; onClose: () => void }) {
  const open = !!batch;
  const batchId = batch ? idOf(batch) : "";
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      const res = await getAllPalletsForReception(batchId);
      setScans(extractList(res));
    } catch (e: any) {
      toast.error(e?.message || "Unable to load pallets");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Pallets · {batch?.batchCode ?? ""}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          <div className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${scans.length} pallet bin${scans.length === 1 ? "" : "s"} scanned`}
          </div>
          {!loading && scans.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
              No pallets scanned in this batch yet.
            </p>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-2 text-left font-medium">QR / Bin</th>
                    <th className="p-2 text-left font-medium">Variety</th>
                    <th className="p-2 text-left font-medium">Farm / Plot / Valve</th>
                    <th className="p-2 text-left font-medium">Scanned at</th>
                  </tr>
                </thead>
                <tbody>
                  {scans.map((s) => {
                    const farm = refName(s.farm, "farmName", "internalCode");
                    const plot = refName(s.plot, "plotName", "plotCode");
                    const valve = refName(s.valve, "valveName", "valveCode");
                    return (
                      <tr key={idOf(s)} className="border-t">
                        <td className="p-2 font-mono text-xs">
                          {s.qrCode ?? refName(s.qrInventory, "qrCode")}
                        </td>
                        <td className="p-2">{refName(s.variety, "varietyName", "varietyCode")}</td>
                        <td className="p-2">
                          {`${farm}${plot !== "—" ? " · " + plot : ""}${valve !== "—" ? " · " + valve : ""}`}
                        </td>
                        <td className="p-2 whitespace-nowrap text-muted-foreground">{fmtDateTime(s.scannedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
