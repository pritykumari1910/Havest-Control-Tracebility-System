import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getUnassignedPallets,
  resolvedUnasignedPallets,
  rejectUnassignedPallets,
} from "@/apis/unassignedpallet";
import { getAllAssignments } from "@/apis/harvest.assignments";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { CheckCircle2, XCircle } from "lucide-react";
import buildPageItems from "@/utils/paginationCount";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
] as const;

const FAILURE_REASON_OPTIONS = [
  { value: "no_assignment", label: "No assignment" },
  { value: "assignment_not_found", label: "Assignment not found" },
  { value: "crew_inactive", label: "Crew inactive" },
] as const;

const STATUS_TONE: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
  pending: "default",
  resolved: "secondary",
  rejected: "destructive",
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
const fmtDateTime = (v: any) => (v ? new Date(v).toLocaleString() : "—");
const fmtDate = (v: any) => (v ? new Date(v).toLocaleDateString() : "—");
const refName = (r: any, ...keys: string[]) => {
  if (r == null) return "—";
  if (typeof r === "string") return r;
  for (const k of keys) if (r[k]) return r[k];
  return "—";
};
const labelOf = (options: readonly { value: string; label: string }[], v: string) =>
  options.find((o) => o.value === v)?.label ?? (v ? v.replace(/_/g, " ") : "—");

type Option = { value: string; label: string };

const UnassignedPalletBinsPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<{ total: number; totalPages: number } | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [resolveItem, setResolveItem] = useState<any | null>(null);
  const [rejectItem, setRejectItem] = useState<any | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: PAGE_SIZE };
      if (statusFilter !== "all") params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;
      const res = await getUnassignedPallets(params);
      setRows(extractList(res));
      setPagination(extractPagination(res));
    } catch (e: any) {
      toast.error(e?.message || "Unable to load unassigned bins");
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, dateFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, dateFilter]);

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
            <h1 className="text-2xl font-semibold tracking-tight">Unassigned Pallet Bins</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Bins scanned at reception without a valid harvest assignment. Resolve each by attaching it to an
              assignment, or reject it.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
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
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-40"
              aria-label="Scanned date"
            />
            {dateFilter && (
              <Button variant="ghost" onClick={() => setDateFilter("")}>
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
                  <TableHead>Scanned</TableHead>
                  <TableHead>QR</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Scanned by</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                      No unassigned pallet bins — good!
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => {
                    const pending = r.status === "pending";
                    return (
                      <TableRow key={idOf(r)}>
                        <TableCell className="whitespace-nowrap">{fmtDateTime(r.scannedAt)}</TableCell>
                        <TableCell className="font-mono text-xs">{refName(r.qrInventory, "qrCode")}</TableCell>
                        <TableCell>{refName(r.receptionBatch, "batchCode")}</TableCell>
                        <TableCell>{refName(r.campaign, "name", "campaignCode")}</TableCell>
                        <TableCell>{labelOf(FAILURE_REASON_OPTIONS, r.failureReason)}</TableCell>
                        <TableCell>{refName(r.scannedBy, "name", "email")}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_TONE[r.status] ?? "outline"}>
                            {labelOf(STATUS_OPTIONS, r.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {pending ? (
                            <div className="flex justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" onClick={() => setResolveItem(r)} aria-label="Resolve">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Resolve — attach to an assignment</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" onClick={() => setRejectItem(r)} aria-label="Reject">
                                    <XCircle className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Reject</TooltipContent>
                              </Tooltip>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
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
                  {pageStart}–{pageEnd} of {totalItems} bins
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

        <ResolveDialog
          item={resolveItem}
          onClose={() => setResolveItem(null)}
          onDone={() => {
            setResolveItem(null);
            refresh();
          }}
        />
        <RejectDialog
          item={rejectItem}
          onClose={() => setRejectItem(null)}
          onDone={() => {
            setRejectItem(null);
            refresh();
          }}
        />
      </div>
    </TooltipProvider>
  );
};

function ResolveDialog({ item, onClose, onDone }: { item: any | null; onClose: () => void; onDone: () => void }) {
  const open = !!item;
  const [assignments, setAssignments] = useState<Option[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [harvestAssignmentId, setHarvestAssignmentId] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setHarvestAssignmentId("");
    setNote("");
    setLoadingOptions(true);
    // Only active assignments can receive a re-attached bin.
    getAllAssignments({ status: "active", limit: 100 })
      .then((res) =>
        setAssignments(
          extractList(res).map((a) => ({
            value: idOf(a),
            label: `${refName(a.crew, "crewCode", "crewName")} · ${refName(a.farm, "farmName")}${
              a.plot?.plotName ? " / " + a.plot.plotName : ""
            } · ${refName(a.variety, "varietyName")} · ${fmtDate(a.workDate)}`,
          })),
        ),
      )
      .catch(() => setAssignments([]))
      .finally(() => setLoadingOptions(false));
  }, [open]);

  const submit = async () => {
    if (!harvestAssignmentId) return toast.error("Select a harvest assignment");
    setSubmitting(true);
    try {
      await resolvedUnasignedPallets(idOf(item), { harvestAssignmentId, note: note.trim() || undefined });
      toast.success("Bin resolved and added to the harvest flow");
      onDone();
    } catch (e: any) {
      toast.error(e?.message || "Unable to resolve bin");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resolve bin</DialogTitle>
          <DialogDescription>
            Attach QR <span className="font-mono">{refName(item?.qrInventory, "qrCode")}</span> to an active harvest
            assignment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>
              Harvest assignment <span className="text-destructive">*</span>
            </Label>
            <Select value={harvestAssignmentId} onValueChange={setHarvestAssignmentId} disabled={loadingOptions}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loadingOptions ? "Loading…" : "Select assignment"} />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Note</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Optional" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Resolving…" : "Resolve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({ item, onClose, onDone }: { item: any | null; onClose: () => void; onDone: () => void }) {
  const open = !!item;
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const submit = async () => {
    if (!reason.trim()) return toast.error("A reason is required");
    setSubmitting(true);
    try {
      await rejectUnassignedPallets(idOf(item), { reason: reason.trim() });
      toast.success("Bin rejected");
      onDone();
    } catch (e: any) {
      toast.error(e?.message || "Unable to reject bin");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject bin</DialogTitle>
          <DialogDescription>
            Reject QR <span className="font-mono">{refName(item?.qrInventory, "qrCode")}</span>. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5 py-2">
          <Label>
            Reason <span className="text-destructive">*</span>
          </Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Why is this bin being rejected?"
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={submit} disabled={submitting}>
            {submitting ? "Rejecting…" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UnassignedPalletBinsPage;
