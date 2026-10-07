import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getAllDispatchNotes, updateDispatchNote } from "@/apis/dispatchnotes";
import { getAllCampaigns } from "@/apis/campaigns";
import { getAllBuyers, getAllDestinationCenters } from "@/apis/buyer&transport";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pencil } from "lucide-react";
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
import buildPageItems from "@/utils/paginationCount";

const PAGE_SIZE = 10;

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

const idOf = (r: any) => r?._id ?? r?.id;
const refId = (v: any) => (v == null ? "" : typeof v === "object" ? idOf(v) ?? "" : v);
// The API rejects edits to dispatched/reconciled notes, and to any note already tied
// to a buyer delivery note, so surface that as a disabled action instead of a failed save.
const lockReason = (r: any): string | null => {
  if (r?.isAssociatedWithBuyerDeliveryNote) return "Locked — associated with a buyer delivery note";
  if (r?.status === "dispatched" || r?.status === "reconciled")
    return `Cannot edit a ${statusLabel(r.status).toLowerCase()} note`;
  return null;
};
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
const statusLabel = (v: string) =>
  STATUS_OPTIONS.find((o) => o.value === v)?.label ?? (v ? v.replace(/_/g, " ") : "—");

type Option = { value: string; label: string };

const DispatchNotesPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<{ total: number; totalPages: number } | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [campaignId, setCampaignId] = useState("all");
  const [campaignOptions, setCampaignOptions] = useState<Option[]>([]);
  const [editRow, setEditRow] = useState<any | null>(null);

  useEffect(() => {
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
      if (statusFilter !== "all") params.status = statusFilter;
      if (campaignId !== "all") params.campaign = campaignId;
      const res = await getAllDispatchNotes(params);
      setRows(extractList(res));
      setPagination(extractPagination(res));
    } catch (e: any) {
      toast.error(e?.message || "Unable to load dispatch notes");
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, campaignId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, campaignId]);

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
            <h1 className="text-2xl font-semibold tracking-tight">Dispatch Notes</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Dispatch notes issued to buyers and destination centres. Closed notes become part of the audit trail.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={campaignId} onValueChange={setCampaignId}>
              <SelectTrigger className="w-48">
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Note #</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Bins</TableHead>
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
                      No dispatch notes found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={idOf(r)}>
                      <TableCell>{fmtDate(r.noteDate)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.internalNoteNumber ?? r.dispatchCode ?? "—"}
                      </TableCell>
                      <TableCell>{refName(r.campaign, "campaignName", "campaignCode")}</TableCell>
                      <TableCell>{refName(r.buyer, "name", "internalCode")}</TableCell>
                      <TableCell>{refName(r.destination, "name", "internalCode")}</TableCell>
                      <TableCell>{Array.isArray(r.bins) ? r.bins.length : 0}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_TONE[r.status] ?? "outline"}>{statusLabel(r.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setEditRow(r)}
                                disabled={!!lockReason(r)}
                                aria-label="Edit dispatch note"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{lockReason(r) ?? "Edit dispatch note"}</TooltipContent>
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

        <EditDispatchNoteSheet
          row={editRow}
          campaignOptions={campaignOptions}
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

function EditDispatchNoteSheet({
  row,
  campaignOptions,
  onClose,
  onSaved,
}: {
  row: any | null;
  campaignOptions: Option[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const open = !!row;

  const [noteDate, setNoteDate] = useState("");
  const [campaign, setCampaign] = useState("");
  const [buyer, setBuyer] = useState("");
  const [destination, setDestination] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [buyerOptions, setBuyerOptions] = useState<Option[]>([]);
  const [destinationOptions, setDestinationOptions] = useState<Option[]>([]);

  // Only active buyers/destinations are accepted by the API, so don't offer inactive ones.
  useEffect(() => {
    if (!open) return;
    getAllBuyers({ status: "active", limit: 200 })
      .then((res) =>
        setBuyerOptions(extractList(res).map((b) => ({ value: idOf(b), label: refName(b, "name", "internalCode") }))),
      )
      .catch(() => setBuyerOptions([]));
    getAllDestinationCenters({ status: "active", limit: 200 })
      .then((res) =>
        setDestinationOptions(
          extractList(res).map((d) => ({ value: idOf(d), label: refName(d, "name", "internalCode") })),
        ),
      )
      .catch(() => setDestinationOptions([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setNoteDate(row?.noteDate ? new Date(row.noteDate).toISOString().slice(0, 10) : "");
    setCampaign(refId(row?.campaign));
    setBuyer(refId(row?.buyer));
    setDestination(refId(row?.destination));
  }, [open, row]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Every field is optional server-side, and sending buyer/destination triggers a
    // transfer-order consistency check — so send only what actually changed.
    const payload: Record<string, any> = {};
    if (campaign && campaign !== refId(row?.campaign)) payload.campaign = campaign;
    if (buyer && buyer !== refId(row?.buyer)) payload.buyer = buyer;
    if (destination && destination !== refId(row?.destination)) payload.destination = destination;
    const originalDate = row?.noteDate ? new Date(row.noteDate).toISOString().slice(0, 10) : "";
    if (noteDate && noteDate !== originalDate) payload.noteDate = new Date(noteDate).toISOString();

    if (Object.keys(payload).length === 0) {
      toast.info("Nothing to update");
      return;
    }

    setSubmitting(true);
    try {
      await updateDispatchNote(idOf(row), payload);
      toast.success("Dispatch note updated");
      onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update dispatch note");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit dispatch note</SheetTitle>
        </SheetHeader>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label>Note number</Label>
            <Input value={row?.internalNoteNumber ?? row?.dispatchCode ?? "—"} disabled readOnly />
          </div>

          <div className="space-y-1.5">
            <Label>Note date</Label>
            <Input type="date" value={noteDate} onChange={(e) => setNoteDate(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Campaign</Label>
            <Select value={campaign} onValueChange={setCampaign}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select campaign" />
              </SelectTrigger>
              <SelectContent>
                {campaignOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Buyer</Label>
            <Select value={buyer} onValueChange={setBuyer}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select buyer" />
              </SelectTrigger>
              <SelectContent>
                {buyerOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Destination</Label>
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                {destinationOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <SheetFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
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

export default DispatchNotesPage;
