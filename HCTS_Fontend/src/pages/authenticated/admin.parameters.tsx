import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getAllSystemParameters,
  createSystemParameter,
  updateSystemParameter,
} from "@/apis/systemparameters";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Pencil, Search } from "lucide-react";

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
const extractPagination = (res: any): { total: number; totalPages: number } => {
  const obj = res?.responseObject ?? res?.data ?? res;
  const p: any = obj?.pagination ?? {};
  return { total: Number(p.total) || 0, totalPages: Math.max(1, Number(p.totalPages) || 1) };
};

const fmtDate = (v: any) => (v ? new Date(v).toLocaleString() : "—");
const updatedByName = (u: any) =>
  [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.name || u?.email || "—";

// `value` is a Mixed type on the backend — render objects as JSON, scalars as-is.
const displayValue = (v: any) => {
  if (v == null) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};
// Prefill an edit form: keep objects as pretty JSON, scalars as their string form.
const valueToInput = (v: any) => {
  if (v == null) return "";
  if (typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v);
};
// Preserve typed values (number/boolean/object) by attempting a JSON parse; fall back to raw string.
const parseValue = (raw: string): any => {
  const trimmed = raw.trim();
  if (trimmed === "") return "";
  try {
    return JSON.parse(trimmed);
  } catch {
    return raw;
  }
};

const SystemParametersPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<{ total: number; totalPages: number } | null>(null);
  const [page, setPage] = useState(1);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [creating, setCreating] = useState(false);
  const [editRow, setEditRow] = useState<any | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: PAGE_SIZE };
      if (search.trim()) params.search = search.trim();
      const res = await getAllSystemParameters(params);
      setRows(extractList(res));
      setPagination(extractPagination(res));
    } catch (e: any) {
      toast.error(e?.message || "Unable to load system parameters");
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setPage(1);
  }, [search]);

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
            <h1 className="text-2xl font-semibold tracking-tight">System Parameters</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Estimated pallet weight, offline sync window, QR generation rules, session timeout, and other
              operational parameters.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search key or description…"
                className="w-64 pl-8"
              />
            </div>
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New parameter
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Updated by</TableHead>
                  <TableHead>Updated at</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-8 text-center text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-8 text-center text-muted-foreground">
                      No system parameters — click “New parameter” to add one.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={idOf(r)}>
                      <TableCell className="font-medium">{r.key}</TableCell>
                      <TableCell className="max-w-xs truncate font-mono text-sm">{displayValue(r.value)}</TableCell>
                      <TableCell className="max-w-sm truncate text-muted-foreground">
                        {r.description || "—"}
                      </TableCell>
                      <TableCell>{updatedByName(r.updatedBy)}</TableCell>
                      <TableCell className="text-muted-foreground">{fmtDate(r.updatedAt)}</TableCell>
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {totalItems > PAGE_SIZE && (
              <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {pageStart}–{pageEnd} of {totalItems} parameters
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage((v) => Math.max(1, v - 1));
                        }}
                        aria-disabled={currentPage === 1}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <PaginationItem key={i + 1}>
                        <PaginationLink
                          href="#"
                          isActive={i + 1 === currentPage}
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(i + 1);
                          }}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage((v) => Math.min(totalPages, v + 1));
                        }}
                        aria-disabled={currentPage === totalPages}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>

        <ParameterSheet
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
      </div>
    </TooltipProvider>
  );
};

function ParameterSheet({
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
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setKey(row?.key ?? "");
    setValue(valueToInput(row?.value));
    setDescription(row?.description ?? "");
  }, [open, row]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit && !key.trim()) return toast.error("Key is required");
    if (value.trim() === "") return toast.error("Value is required");

    setSubmitting(true);
    try {
      if (isEdit) {
        // Key is immutable on the backend — only value and description can change.
        await updateSystemParameter(idOf(row), {
          value: parseValue(value),
          description: description.trim(),
        });
        toast.success("Parameter updated");
      } else {
        await createSystemParameter({
          key: key.trim(),
          value: parseValue(value),
          description: description.trim(),
        });
        toast.success("Parameter created");
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save parameter");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit parameter" : "New parameter"}</SheetTitle>
        </SheetHeader>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label>
              Key <span className="text-destructive">*</span>
            </Label>
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g. estimated_pallet_weight_kg"
              disabled={isEdit}
            />
            {isEdit && <p className="text-xs text-muted-foreground">Key cannot be changed after creation.</p>}
          </div>

          <div className="space-y-1.5">
            <Label>
              Value <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='Plain text, number, or JSON (e.g. 25, true, "1h", {"foo":1})'
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Numbers, booleans, and JSON objects are stored as typed values; anything else is stored as text.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this parameter controls"
              rows={3}
            />
          </div>

          <SheetFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create parameter"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default SystemParametersPage;
