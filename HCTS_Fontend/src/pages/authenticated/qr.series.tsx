import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getAllSeries,
  generateSeries,
  updateSeries,
  updatePrinterOrder,
  registerReceipt,
  activateSeries,
  cancelSeries,
  exportSeries,
} from "@/apis/qr.series";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Pencil, Send, PackageCheck, Power, Ban, Download, Search } from "lucide-react";
import buildPageItems from "@/utils/paginationCount";

const STATUS_TONE: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
  Draft: "outline",
  Generated: "outline",
  "Sent to Printer": "default",
  Received: "secondary",
  Active: "secondary",
  Exhausted: "outline",
  Cancelled: "destructive",
};

const PRINTER_STATUS_OPTIONS = [
  { value: "sent", label: "Sent" },
  { value: "in production", label: "In production" },
  { value: "received", label: "Received" },
  { value: "with issue", label: "With issue" },
] as const;

function statusBadge(v: string) {
  return <Badge variant={STATUS_TONE[v] ?? "outline"}>{v ?? "—"}</Badge>;
}
function fmt(v: any) {
  return v ? new Date(v).toLocaleDateString() : "—";
}

const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const PAGE_SIZE = 10;

export default function QRSeriesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ total: number; totalPages: number } | null>(null);

  const [creating, setCreating] = useState(false);
  const [editRow, setEditRow] = useState<any | null>(null);
  const [printerOrderRow, setPrinterOrderRow] = useState<any | null>(null);
  const [receiptRow, setReceiptRow] = useState<any | null>(null);
  const [confirm, setConfirm] = useState<{ row: any; action: "activate" | "cancel" } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: PAGE_SIZE };
      if (search.trim()) params.search = search.trim();
      const res = await getAllSeries(params);
      const ro = res?.responseObject ?? res?.data ?? res;
      const list = Array.isArray(ro) ? ro : ro?.series ?? [];
      setRows(Array.isArray(list) ? list : []);
      setPagination(ro?.pagination ?? null);
    } catch (e: any) {
      toast.error(e?.message || "Unable to load QR series");
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  // Debounce search before hitting the API.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 450);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const idOf = (r: any) => r?._id ?? r?.id;

  const runConfirm = async () => {
    if (!confirm) return;
    setConfirming(true);
    try {
      if (confirm.action === "activate") {
        await activateSeries(idOf(confirm.row));
        toast.success("Series activated");
      } else {
        await cancelSeries(idOf(confirm.row));
        toast.success("Series cancelled");
      }
      setConfirm(null);
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Action failed");
    } finally {
      setConfirming(false);
    }
  };

  const handleExport = async (row: any, format: "csv" | "pdf" | "zip") => {
    setExportingId(idOf(row));
    try {
      const blob = await exportSeries(idOf(row), format);
      saveBlob(blob, `${row.seriesName ?? "qr-series"}.${format}`);
    } catch (e: any) {
      toast.error(e?.message || "Export failed");
    } finally {
      setExportingId(null);
    }
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
          <h1 className="text-2xl font-semibold tracking-tight">QR Series</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, print, verify, and activate QR series for pallet-bin labelling.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search series…"
              className="w-56 pl-8"
            />
          </div>
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New series
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Range</TableHead>
                <TableHead>Printer</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Received</TableHead>
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
                    No series yet — click “New series” to generate one.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r: any) => (
                  <TableRow key={idOf(r)}>
                    <TableCell className="font-medium">{r.seriesName}</TableCell>
                    <TableCell>{r.totalQRs?.toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.initialCode} … {r.finalCode}
                    </TableCell>
                    <TableCell>{r.printerOrder?.printerName || "—"}</TableCell>
                    <TableCell>{fmt(r.printerOrder?.sentToPrinterDate)}</TableCell>
                    <TableCell>{fmt(r.receipt?.dateReceived)}</TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {r.status !== "Cancelled" && r.status !== "Exhausted" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setEditRow(r)}
                                aria-label="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                        )}
                        {(r.status === "Generated" || r.status === "Sent to Printer") && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setPrinterOrderRow(r)}
                                aria-label="Send to printer"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Send to printer</TooltipContent>
                          </Tooltip>
                        )}
                        {(r.status === "Sent to Printer" || r.status === "Received") && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setReceiptRow(r)}
                                aria-label="Register receipt"
                              >
                                <PackageCheck className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Register receipt</TooltipContent>
                          </Tooltip>
                        )}
                        {(r.status === "Received" || r.status === "Active") && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setConfirm({ row: r, action: "activate" })}
                                aria-label="Activate"
                              >
                                <Power className="h-4 w-4 text-primary" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Activate</TooltipContent>
                          </Tooltip>
                        )}
                        <DropdownMenu>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  aria-label="Export"
                                  disabled={exportingId === idOf(r)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent>Export</TooltipContent>
                          </Tooltip>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleExport(r, "csv")}>
                              Export CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleExport(r, "pdf")}>
                              Export PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleExport(r, "zip")}>
                              Export ZIP
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {r.status !== "Cancelled" && r.status !== "Exhausted" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setConfirm({ row: r, action: "cancel" })}
                                aria-label="Cancel"
                              >
                                <Ban className="h-4 w-4 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Cancel</TooltipContent>
                          </Tooltip>
                        )}
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
                Showing {pageStart}–{pageEnd} of {totalItems} series
              </p>
              <Pagination aria-label="QR series pagination">
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

      <CreateSeriesSheet
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={() => {
          setCreating(false);
          refresh();
        }}
      />

      <EditSeriesSheet
        open={!!editRow}
        row={editRow}
        onClose={() => setEditRow(null)}
        onSaved={() => {
          setEditRow(null);
          refresh();
        }}
      />

      <PrinterOrderSheet
        open={!!printerOrderRow}
        row={printerOrderRow}
        onClose={() => setPrinterOrderRow(null)}
        onSaved={() => {
          setPrinterOrderRow(null);
          refresh();
        }}
      />

      <ReceiptSheet
        open={!!receiptRow}
        row={receiptRow}
        onClose={() => setReceiptRow(null)}
        onSaved={() => {
          setReceiptRow(null);
          refresh();
        }}
      />

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.action === "activate" ? "Activate this QR series?" : "Cancel this series?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.action === "activate"
                ? "Once activated, QR codes become available to the field application. This is a mandatory control point."
                : "Cancelling voids all unassigned codes in this series. Used codes are preserved. This is logged."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirming}>Back</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); runConfirm(); }} disabled={confirming}>
              {confirming ? "Working…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
}

function CreateSeriesSheet({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [seriesName, setSeriesName] = useState("");
  const [startNumber, setStartNumber] = useState<number>(1);
  const [endNumber, setEndNumber] = useState<number>(10);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSeriesName("");
      setStartNumber(1);
      setEndNumber(10);
      setComments("");
    }
  }, [open]);

  const pad = (n: number) => `QR-01-${String(n).padStart(6, "0")}`;
  const total = endNumber >= startNumber ? endNumber - startNumber + 1 : 0;
  const preview = total > 0 ? `${pad(startNumber)} … ${pad(endNumber)}` : "—";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesName.trim()) return toast.error("Series name is required");
    if (!(endNumber >= startNumber) || startNumber < 1) return toast.error("Enter a valid start/end range");
    setSubmitting(true);
    try {
      await generateSeries({
        seriesName: seriesName.trim(),
        startNumber: Number(startNumber),
        endNumber: Number(endNumber),
        comments: comments || undefined,
      });
      toast.success("Series created and QR codes generated");
      onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create series");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create QR series</SheetTitle>
        </SheetHeader>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label>
              Series name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={seriesName}
              onChange={(e) => setSeriesName(e.target.value)}
              placeholder="e.g. Campaign 2026 batch A"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                Start number <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                value={startNumber}
                onChange={(e) => setStartNumber(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                End number <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                value={endNumber}
                onChange={(e) => setEndNumber(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="text-xs text-muted-foreground">Preview range · {total.toLocaleString()} codes</div>
            <div className="font-mono">{preview}</div>
          </div>
          <div className="space-y-1.5">
            <Label>Comments</Label>
            <Textarea rows={3} value={comments} onChange={(e) => setComments(e.target.value)} />
          </div>
          <SheetFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Generating…" : "Generate series"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function EditSeriesSheet({
  open,
  row,
  onClose,
  onSaved,
}: {
  open: boolean;
  row: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [seriesName, setSeriesName] = useState("");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (row) {
      setSeriesName(row.seriesName ?? "");
      setComments(row.comments ?? "");
    }
  }, [row?._id, row?.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesName.trim()) return toast.error("Series name is required");
    setSubmitting(true);
    try {
      await updateSeries(row._id ?? row.id, {
        seriesName: seriesName.trim(),
        comments,
      });
      toast.success("Series updated");
      onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update series");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit series</SheetTitle>
        </SheetHeader>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label>
              Series name <span className="text-destructive">*</span>
            </Label>
            <Input value={seriesName} onChange={(e) => setSeriesName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Comments</Label>
            <Textarea rows={3} value={comments} onChange={(e) => setComments(e.target.value)} />
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

function PrinterOrderSheet({
  open,
  row,
  onClose,
  onSaved,
}: {
  open: boolean;
  row: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [printerName, setPrinterName] = useState("");
  const [fileReference, setFileReference] = useState("");
  const [sentToPrinterDate, setSentToPrinterDate] = useState("");
  const [printerStatus, setPrinterStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (row) {
      setPrinterName(row.printerOrder?.printerName ?? "");
      setFileReference(row.printerOrder?.fileReference ?? "");
      setSentToPrinterDate(
        row.printerOrder?.sentToPrinterDate
          ? new Date(row.printerOrder.sentToPrinterDate).toISOString().slice(0, 10)
          : "",
      );
      setPrinterStatus(row.printerOrder?.printerStatus ?? "");
    }
  }, [row?._id, row?.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Record<string, any> = {};
      if (printerName) payload.printerName = printerName;
      if (fileReference) payload.fileReference = fileReference;
      if (sentToPrinterDate) payload.sentToPrinterDate = new Date(sentToPrinterDate).toISOString();
      if (printerStatus) payload.printerStatus = printerStatus;
      await updatePrinterOrder(row._id ?? row.id, payload);
      toast.success("Printer order updated");
      onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update printer order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Send to printer · {row?.seriesName}</SheetTitle>
        </SheetHeader>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label>Printer name</Label>
            <Input value={printerName} onChange={(e) => setPrinterName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>File reference</Label>
            <Input value={fileReference} onChange={(e) => setFileReference(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Sent to printer date</Label>
            <Input
              type="date"
              value={sentToPrinterDate}
              onChange={(e) => setSentToPrinterDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Printer status</Label>
            <Select value={printerStatus} onValueChange={setPrinterStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {PRINTER_STATUS_OPTIONS.map((o) => (
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
              {submitting ? "Saving…" : "Save & mark sent"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function ReceiptSheet({
  open,
  row,
  onClose,
  onSaved,
}: {
  open: boolean;
  row: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [dateReceived, setDateReceived] = useState("");
  const [quantityReceived, setQuantityReceived] = useState<number | "">("");
  const [responsiblePerson, setResponsiblePerson] = useState("");
  const [printingIssues, setPrintingIssues] = useState("");
  const [qualityCheckResult, setQualityCheckResult] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (row) {
      setDateReceived(
        row.receipt?.dateReceived
          ? new Date(row.receipt.dateReceived).toISOString().slice(0, 10)
          : "",
      );
      setQuantityReceived(row.receipt?.quantityReceived ?? "");
      setResponsiblePerson(row.receipt?.responsiblePerson ?? "");
      setPrintingIssues(row.receipt?.printingIssues ?? "");
      setQualityCheckResult(row.receipt?.qualityCheckResult ?? "");
    }
  }, [row?._id, row?.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Record<string, any> = {};
      if (dateReceived) payload.dateReceived = new Date(dateReceived).toISOString();
      if (quantityReceived !== "") payload.quantityReceived = Number(quantityReceived);
      if (responsiblePerson) payload.responsiblePerson = responsiblePerson;
      if (printingIssues) payload.printingIssues = printingIssues;
      if (qualityCheckResult) payload.qualityCheckResult = qualityCheckResult;
      await registerReceipt(row._id ?? row.id, payload);
      toast.success("Receipt registered");
      onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Failed to register receipt");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Register receipt · {row?.seriesName}</SheetTitle>
        </SheetHeader>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date received</Label>
              <Input type="date" value={dateReceived} onChange={(e) => setDateReceived(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Quantity received</Label>
              <Input
                type="number"
                min={0}
                value={quantityReceived}
                onChange={(e) => setQuantityReceived(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Responsible person</Label>
            <Input value={responsiblePerson} onChange={(e) => setResponsiblePerson(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Printing issues</Label>
            <Textarea rows={2} value={printingIssues} onChange={(e) => setPrintingIssues(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Quality check result</Label>
            <Textarea
              rows={2}
              value={qualityCheckResult}
              onChange={(e) => setQualityCheckResult(e.target.value)}
            />
          </div>
          <SheetFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save & mark received"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
