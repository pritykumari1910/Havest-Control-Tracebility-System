import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
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
import { Plus, Pencil, Power, Search } from "lucide-react";
import {
  registerBuyer,
  updateBuyer,
  getAllBuyers,
  registerDestinationCenter,
  updateDestinationCenter,
  getAllDestinationCenters,
  registerTransporter,
  updateTransporter,
  getAllTransporters,
} from "@/apis/buyer&transport";
import buildPageItems from "@/utils/paginationCount";

const PAGE_SIZE = 10;

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
const statusOf = (r: any): "active" | "inactive" => (r?.status === "inactive" ? "inactive" : "active");
const extractPagination = (res: any): { total: number; totalPages: number } => {
  const obj = res?.responseObject ?? res?.data ?? res;
  const p: any = obj?.pagination ?? {};
  return { total: Number(p.total) || 0, totalPages: Math.max(1, Number(p.totalPages) || 1) };
};

type ListApi = {
  fetchAll: (params?: Record<string, any>) => Promise<any>;
  create: (data: any) => Promise<any>;
  update: (id: string, data: any) => Promise<any>;
};

function CommercialPage() {
  const [tab, setTab] = useState("buyers");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Buyers &amp; Transport</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Buyers, destination centres and transport providers for dispatch logistics.
        </p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="buyers">Buyers</TabsTrigger>
          <TabsTrigger value="dests">Destination Centres</TabsTrigger>
          <TabsTrigger value="transport">Transport Providers</TabsTrigger>
        </TabsList>

        <TabsContent value="buyers" className="mt-6">
          <LogisticsList
            title="Buyer"
            nameKey="name"
            nameLabel="Name"
            showCode
            api={{ fetchAll: getAllBuyers, create: registerBuyer, update: updateBuyer }}
          />
        </TabsContent>

        <TabsContent value="dests" className="mt-6">
          <LogisticsList
            title="Destination Centre"
            nameKey="name"
            nameLabel="Name"
            showCode
            showAddress
            api={{
              fetchAll: getAllDestinationCenters,
              create: registerDestinationCenter,
              update: updateDestinationCenter,
            }}
          />
        </TabsContent>

        <TabsContent value="transport" className="mt-6">
          <LogisticsList
            title="Transport Provider"
            nameKey="legalName"
            nameLabel="Legal name"
            showCode={false}
            api={{
              fetchAll: getAllTransporters,
              create: registerTransporter,
              update: updateTransporter,
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LogisticsList({
  title,
  nameKey,
  nameLabel,
  showCode,
  showAddress = false,
  api,
}: {
  title: string;
  nameKey: "name" | "legalName";
  nameLabel: string;
  showCode: boolean;
  showAddress?: boolean;
  api: ListApi;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ total: number; totalPages: number } | null>(null);
  const [creating, setCreating] = useState(false);
  const [editRow, setEditRow] = useState<any | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Debounce the search box before hitting the API.
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
      const res = await api.fetchAll(params);
      setRows(extractList(res));
      setPagination(extractPagination(res));
    } catch (e: any) {
      toast.error(e?.message || `Unable to load ${title.toLowerCase()}s`);
    } finally {
      setIsLoading(false);
    }
  }, [api, title, page, search, statusFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Reset to the first page whenever the query changes.
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const totalItems = pagination?.total ?? rows.length;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const currentPage = Math.min(page, totalPages);
  const pageStart = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = (currentPage - 1) * PAGE_SIZE + rows.length;
  const columnCount = (showCode ? 1 : 0) + (showAddress ? 1 : 0) + 4;

  const toggleStatus = async (row: any) => {
    const next = statusOf(row) === "active" ? "inactive" : "active";
    setTogglingId(idOf(row));
    try {
      await api.update(idOf(row), { status: next });
      toast.success("Status updated");
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Unable to update status");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search…"
                className="w-56 pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New {title.toLowerCase()}
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {showCode && <TableHead>Code</TableHead>}
                  <TableHead>{nameLabel}</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  {showAddress && <TableHead>Address</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={columnCount + 1} className="p-8 text-center text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columnCount + 1} className="p-8 text-center text-muted-foreground">
                      No records
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={idOf(r)}>
                      {showCode && <TableCell className="font-medium">{r.internalCode ?? "—"}</TableCell>}
                      <TableCell>{r[nameKey]}</TableCell>
                      <TableCell>{r.contactDetails?.phone || "—"}</TableCell>
                      <TableCell>{r.contactDetails?.email || "—"}</TableCell>
                      {showAddress && (
                        <TableCell className="max-w-[220px] truncate">
                          {r.contactDetails?.address || "—"}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant={statusOf(r) === "active" ? "secondary" : "outline"}>
                          {statusOf(r)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
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
                                onClick={() => toggleStatus(r)}
                                aria-label={statusOf(r) === "active" ? "Deactivate" : "Reactivate"}
                              >
                                <Power
                                  className={
                                    statusOf(r) === "active"
                                      ? "h-4 w-4 text-destructive"
                                      : "h-4 w-4 text-primary"
                                  }
                                />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {statusOf(r) === "active" ? "Deactivate" : "Reactivate"}
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
                  {pageStart}–{pageEnd} of {totalItems}
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

        <LogisticsSheet
          open={creating || !!editRow}
          row={editRow}
          title={title}
          nameKey={nameKey}
          nameLabel={nameLabel}
          showAddress={showAddress}
          api={api}
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
      </div>
    </TooltipProvider>
  );
}

function LogisticsSheet({
  open,
  row,
  title,
  nameKey,
  nameLabel,
  showAddress = false,
  api,
  onClose,
  onSaved,
}: {
  open: boolean;
  row: any | null;
  title: string;
  nameKey: "name" | "legalName";
  nameLabel: string;
  showAddress?: boolean;
  api: ListApi;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!row;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(row?.[nameKey] ?? "");
    setEmail(row?.contactDetails?.email ?? "");
    setPhone(row?.contactDetails?.phone ?? "");
    setAddress(row?.contactDetails?.address ?? "");
    setStatus(row?.status === "inactive" ? "inactive" : "active");
  }, [open, row, nameKey]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error(`${nameLabel} is required`);

    // Only include contact fields that are set — the backend validates email
    // and rejects an empty string.
    const contactDetails: Record<string, string> = {};
    if (email.trim()) contactDetails.email = email.trim();
    if (phone.trim()) contactDetails.phone = phone.trim();
    if (address.trim()) contactDetails.address = address.trim();

    const payload: Record<string, any> = { [nameKey]: name.trim(), status };
    if (Object.keys(contactDetails).length) payload.contactDetails = contactDetails;

    setSubmitting(true);
    try {
      if (isEdit) {
        await api.update(idOf(row), payload);
        toast.success(`${title} updated`);
      } else {
        await api.create(payload);
        toast.success(`${title} created`);
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "Edit" : "New"} {title.toLowerCase()}
          </SheetTitle>
        </SheetHeader>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label>
              {nameLabel} <span className="text-destructive">*</span>
            </Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          {showAddress && (
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Switch
              id="status"
              checked={status === "active"}
              onCheckedChange={(v) => setStatus(v ? "active" : "inactive")}
            />
            <Label htmlFor="status">Active</Label>
          </div>
          <SheetFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : isEdit ? "Save changes" : `Create ${title.toLowerCase()}`}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default CommercialPage;
