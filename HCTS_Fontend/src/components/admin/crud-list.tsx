import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Pencil, Power, Search, X, Loader2 } from "lucide-react";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "../ui/pagination";
import buildPageItems from "@/utils/paginationCount";

// ---------- shared types ----------
export type FieldKind = "text" | "textarea" | "number" | "date" | "select" | "multi-select";

export type FieldDef = {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  optionsFrom?: string; // key into optionsMap (e.g. "farms")
  options?: Option[]; // inline, static options for a select
  // For cascading selects: this field's options are fetched from `fetchOptions`
  // using the current value of the `dependsOn` field (e.g. plots of a farm).
  dependsOn?: string;
  fetchOptions?: (parentValue: string) => Promise<any>;
};

export type ColumnDef = {
  key: string;
  header: string;
  render?: (row: any) => React.ReactNode;
};

// A custom per-row action button (rendered in the actions column, before Edit).
export type RowAction = {
  icon: React.ReactNode;
  tooltip: string;
  onClick: (row: any) => void | Promise<void>;
};

// A custom toolbar action button (rendered next to the "New" button).
export type HeaderAction = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void | Promise<void>;
  variant?: "default" | "outline" | "secondary" | "ghost";
};

// A cascading ancestor filter for the table toolbar. `path` points at the
// (populated) parent ref on each row, e.g. "parentFarm". Filters listed earlier
// constrain the options of the ones after them (Farm → Plot → Valve).
// In server mode, `param` is the query-string key and `optionsFrom` supplies the
// dropdown options (they can't be derived from a single fetched page).
export type FilterDef = {
  label: string;
  path: string;
  param?: string;
  optionsFrom?: string;
  // Server-mode cascading filters: fetch this filter's options from the selected
  // value of the `dependsOn` filter (e.g. plots of the picked farm).
  dependsOn?: string;
  fetchOptions?: (parentValue: string) => Promise<any>;
};

export type MasterConfig = {
  title: string;
  description?: string;
  columns: ColumnDef[];
  fields: FieldDef[];
  searchColumns?: string[];
  hasStatus?: boolean;
  filters?: FilterDef[];
  rowActions?: RowAction[];
  headerActions?: HeaderAction[];
  // When true, search / filter / pagination are handled by the API (fetchAll is
  // called with { page, limit, search, status, ...filters }) instead of in-memory.
  serverMode?: boolean;
};

export type CrudApi = {
  fetchAll: (params?: Record<string, any>) => Promise<any>;
  create: (values: any) => Promise<any>;
  update: (id: string, values: any) => Promise<any>;
};

export type Option = { value: string; label: string };

// ---------- helpers ----------
export const extractList = (res: any): any[] => {
  const obj = res?.responseObject ?? res?.data ?? res;
  if (Array.isArray(obj)) return obj;
  if (obj && typeof obj === "object") {
    const arr = Object.values(obj).find((v) => Array.isArray(v));
    if (Array.isArray(arr)) return arr;
  }
  return [];
};

// Pulls { total, totalPages } from a paginated response, wherever the meta sits.
const extractPagination = (res: any): { total: number; totalPages: number } => {
  const obj = res?.responseObject ?? res?.data ?? res;
  const values = obj && typeof obj === "object" ? Object.values(obj) : [];
  const p: any = obj?.pagination ?? values.find((v) => v && typeof v === "object" && "totalPages" in v) ?? {};
  return { total: Number(p.total) || 0, totalPages: Math.max(1, Number(p.totalPages) || 1) };
};

// Key a filter is stored/looked-up under (its query param in server mode, else its row path).
const filterKey = (flt: FilterDef) => flt.param ?? flt.path;

export const idOf = (row: any) => row?._id ?? row?.id;

export const labelOf = (r: any) =>
  r?.farmName ??
  r?.plotName ??
  r?.valveName ??
  r?.parkName ??
  r?.companyName ??
  r?.name ??
  r?.code ??
  idOf(r);

// A parent ref may arrive populated (an object) or as a bare id string.
const refIdLabel = (ref: any): { id?: string; label?: string } => {
  if (!ref) return {};
  if (typeof ref === "string") return { id: ref, label: ref };
  return { id: idOf(ref), label: labelOf(ref) };
};

const statusOf = (row: any): "active" | "inactive" => {
  if (typeof row?.status === "string") return row.status === "active" ? "active" : "inactive";
  if (typeof row?.isActive === "boolean") return row.isActive ? "active" : "inactive";
  return "active";
};

export const getValueByPath = (row: any, path?: string) => {
  if (!row || !path) return undefined;
  if (Object.prototype.hasOwnProperty.call(row, path)) return row[path];
  return path.split(".").reduce((acc, key) => acc?.[key], row);
};

// Normalizes whatever shape the backend uses (single id, array of ids, or
// array of populated objects) into a plain array of id strings.
export const toIdArray = (raw: any): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((v) => (typeof v === "string" ? v : v?._id ?? v?.id ?? "")).filter(Boolean);
  }
  if (typeof raw === "string") return [raw];
  if (typeof raw === "object") return [raw._id ?? raw.id].filter(Boolean);
  return [];
};

function buildSchema(fields: FieldDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    let s: z.ZodTypeAny;
    if (f.kind === "number") {
      s = z.preprocess(
        (v) => (v === "" || v == null ? undefined : Number(v)),
        z.number().optional(),
      );
      if (f.required) {
        s = (s as z.ZodTypeAny).refine((v: any) => v !== undefined && !Number.isNaN(v), "Required");
      }
    } else if (f.kind === "multi-select") {
      const arr = z.array(z.string());
      s = f.required ? arr.min(1, "Required") : arr.optional();
    } else {
      let str = z.string();
      if (f.required) str = str.min(1, "Required");
      s = f.required ? str : str.optional().or(z.literal(""));
    }
    shape[f.name] = s;
  }
  return z.object(shape);
}

// ---------- multi-select control ----------
function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
}: {
  options: Option[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (val: string) => {
    if (value.includes(val)) onChange(value.filter((v) => v !== val));
    else onChange([...value, val]);
  };

  const remove = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== val));
  };

  const selected = options.filter((o) => value.includes(o.value));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm shadow-sm"
      >
        {selected.length === 0 ? (
          <span className="px-1 text-muted-foreground">{placeholder}</span>
        ) : (
          selected.map((o) => (
            <Badge key={o.value} variant="secondary" className="gap-1 font-normal">
              {o.label}
              <span
                role="button"
                onClick={(e) => remove(o.value, e)}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </span>
            </Badge>
          ))
        )}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
          {options.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">No options</div>
          ) : (
            options.map((o) => (
              <label
                key={o.value}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Checkbox
                  checked={value.includes(o.value)}
                  onCheckedChange={() => toggle(o.value)}
                />
                {o.label}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ---------- cascading select (options fetched from a parent field's value) ----------
function DependentSelect({
  field,
  parentLabel,
  parentValue,
  value,
  onChange,
}: {
  field: FieldDef;
  parentLabel?: string;
  parentValue: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!parentValue || !field.fetchOptions) {
      setOptions([]);
      return;
    }
    let active = true;
    setLoading(true);
    field
      .fetchOptions(parentValue)
      .then((res) => {
        if (active) setOptions(extractList(res).map((r) => ({ value: idOf(r), label: labelOf(r) })));
      })
      .catch(() => {
        if (active) setOptions([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentValue]);

  return (
    <Select value={value ?? ""} onValueChange={onChange} disabled={!parentValue || loading}>
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={
            !parentValue
              ? `Select ${parentLabel ?? "the parent"} first`
              : loading
                ? "Loading…"
                : field.placeholder ?? "Select…"
          }
        />
      </SelectTrigger>
      <SelectContent>
        {options.length === 0 && parentValue && !loading ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">No options</div>
        ) : (
          options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

// ---------- toolbar filter dropdown (with an "All" option) ----------
function FilterSelect({
  flt,
  value,
  parentValue,
  staticOptions,
  onChange,
}: {
  flt: FilterDef;
  value: string;
  parentValue: string;
  staticOptions: Option[];
  onChange: (v: string) => void;
}) {
  const dependent = !!(flt.fetchOptions && flt.dependsOn);
  const [fetched, setFetched] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!dependent) return;
    if (!parentValue) {
      setFetched([]);
      return;
    }
    let active = true;
    setLoading(true);
    flt
      .fetchOptions!(parentValue)
      .then((res) => {
        if (active) setFetched(extractList(res).map((r) => ({ value: idOf(r), label: labelOf(r) })));
      })
      .catch(() => {
        if (active) setFetched([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentValue, dependent]);

  const options = dependent ? fetched : staticOptions;
  const disabled = dependent && !parentValue;

  return (
    <Select value={value || "__all__"} onValueChange={onChange} disabled={disabled || loading}>
      <SelectTrigger className="w-44">
        <SelectValue
          placeholder={disabled ? `All ${flt.label}s` : loading ? "Loading…" : `All ${flt.label}s`}
        />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">All {flt.label}s</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ---------- generic master list ----------
export function MasterList({
  config,
  api,
  optionsMap = {},
  onChanged,
}: {
  config: MasterConfig;
  api: CrudApi;
  optionsMap?: Record<string, Option[]>;
  onChanged?: () => void;
}) {
  const serverMode = !!config.serverMode;

  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  // Status filter: "all" (default), "active", or "inactive".
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("all");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  // Tracks the in-flight custom row action, keyed as `${actionIndex}:${rowId}`.
  const [busyAction, setBusyAction] = useState<string | null>(null);
  // Selected filters keyed by filterKey() ("" = All).
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [serverMeta, setServerMeta] = useState({ total: 0, totalPages: 1 });
  const PAGE_SIZE = 20;

  // Debounce the search box so server-mode typing doesn't fire a request per key.
  useEffect(() => {
    if (!serverMode) return;
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search, serverMode]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      let res: any;
      if (serverMode) {
        const params: Record<string, any> = { page, limit: PAGE_SIZE };
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        if (config.hasStatus && statusFilter !== "all") params.status = statusFilter;
        for (const flt of config.filters ?? []) {
          const val = filterValues[filterKey(flt)];
          if (val) params[flt.param ?? flt.path] = val;
        }
        res = await api.fetchAll(params);
        setServerMeta(extractPagination(res));
      } else {
        res = await api.fetchAll();
      }
      setRows(extractList(res));
    } catch (e: any) {
      toast.error(e?.message || `Unable to load ${config.title.toLowerCase()}`);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, config.title, serverMode, page, debouncedSearch, statusFilter, filterValues]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Rows narrowed by the status toggle only — the base for both the ancestor
  // filter dropdowns and the final filtered list (client mode).
  const rowsByStatus = useMemo(() => {
    if (serverMode || !config.hasStatus || statusFilter === "all") return rows;
    return rows.filter((r) => statusOf(r) === statusFilter);
  }, [rows, statusFilter, config.hasStatus, serverMode]);

  // Options for each filter. Server mode: from optionsMap (a single page can't
  // enumerate them). Client mode: derived from the rows and cascaded.
  const filterOptions = useMemo(() => {
    const result: Record<string, Option[]> = {};
    const filters = config.filters ?? [];
    filters.forEach((flt, i) => {
      if (serverMode) {
        result[filterKey(flt)] = flt.optionsFrom ? optionsMap[flt.optionsFrom] ?? [] : [];
        return;
      }
      let base = rowsByStatus;
      for (let j = 0; j < i; j++) {
        const up = filters[j];
        const sel = filterValues[filterKey(up)];
        if (sel) base = base.filter((r) => refIdLabel(getValueByPath(r, up.path)).id === sel);
      }
      const seen = new Map<string, string>();
      for (const r of base) {
        const { id, label } = refIdLabel(getValueByPath(r, flt.path));
        if (id && !seen.has(id)) seen.set(id, label ?? id);
      }
      result[filterKey(flt)] = Array.from(seen, ([value, label]) => ({ value, label }));
    });
    return result;
  }, [rowsByStatus, config.filters, filterValues, serverMode, optionsMap]);

  // Client-mode filtered list (server mode uses the fetched page directly).
  const filtered = useMemo(() => {
    if (serverMode) return rows;
    let list = rowsByStatus;
    for (const flt of config.filters ?? []) {
      const sel = filterValues[filterKey(flt)];
      if (sel) list = list.filter((r) => refIdLabel(getValueByPath(r, flt.path)).id === sel);
    }
    const term = search.trim().toLowerCase();
    if (term && config.searchColumns?.length) {
      list = list.filter((r) =>
        config.searchColumns!.some((c) => String(getValueByPath(r, c) ?? "").toLowerCase().includes(term)),
      );
    }
    return list;
  }, [serverMode, rows, rowsByStatus, search, filterValues, config.filters, config.searchColumns]);

  // Reset to the first page whenever the query (not the results) changes.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, search, filterValues, statusFilter]);

  const totalPages = serverMode ? serverMeta.totalPages : Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => (serverMode ? rows : filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)),
    [serverMode, rows, filtered, currentPage],
  );
  const totalCount = serverMode ? serverMeta.total : filtered.length;
  const rangeStart = (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = serverMode ? rangeStart + rows.length - 1 : Math.min(currentPage * PAGE_SIZE, filtered.length);

  const setFilter = (index: number, value: string) => {
    const filters = config.filters ?? [];
    setFilterValues((prev) => {
      const next = { ...prev, [filterKey(filters[index])]: value };
      // Clear downstream filters so a stale child selection can't linger.
      filters.slice(index + 1).forEach((d) => {
        next[filterKey(d)] = "";
      });
      return next;
    });
  };

  const afterSave = () => {
    setCreating(false);
    setEditing(null);
    refresh();
    onChanged?.();
  };

  const toggleStatus = async (row: any) => {
    const next = statusOf(row) === "active" ? "inactive" : "active";
    setTogglingId(idOf(row));
    try {
      await api.update(idOf(row), { status: next, isActive: next === "active" });
      toast.success("Status updated");
      refresh();
      onChanged?.();
    } catch (e: any) {
      toast.error(e?.message || "Unable to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const runRowAction = async (action: RowAction, row: any, key: string) => {
    setBusyAction(key);
    try {
      await action.onClick(row);
    } catch (e: any) {
      toast.error(e?.message || "Action failed");
    } finally {
      setBusyAction(null);
    }
  };

  const runHeaderAction = async (action: HeaderAction, key: string) => {
    setBusyAction(key);
    try {
      await action.onClick();
    } catch (e: any) {
      toast.error(e?.message || "Action failed");
    } finally {
      setBusyAction(null);
    }
  };

  const columnCount = config.columns.length + (config.hasStatus ? 1 : 0) + 1;

  return (
    <TooltipProvider>
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-56 pl-8"
            />
          </div>
          {(config.filters ?? []).map((flt, i) => (
            <FilterSelect
              key={filterKey(flt)}
              flt={flt}
              value={filterValues[filterKey(flt)] ?? ""}
              parentValue={flt.dependsOn ? filterValues[flt.dependsOn] ?? "" : ""}
              staticOptions={filterOptions[filterKey(flt)] ?? []}
              onChange={(v) => setFilter(i, v === "__all__" ? "" : v)}
            />
          ))}
          {config.hasStatus && (
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "active" | "inactive" | "all")}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(config.headerActions ?? []).map((action, ai) => {
            const key = `header:${ai}`;
            const busy = busyAction === key;
            return (
              <Button
                key={ai}
                variant={action.variant ?? "outline"}
                disabled={busy}
                onClick={() => runHeaderAction(action, key)}
              >
                {busy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  action.icon && <span className="mr-2">{action.icon}</span>
                )}
                {action.label}
              </Button>
            );
          })}
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {config.columns.map((c) => (
                  <TableHead key={c.key}>{c.header}</TableHead>
                ))}
                {config.hasStatus && <TableHead>Status</TableHead>}
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columnCount} className="p-8 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columnCount} className="p-8 text-center text-muted-foreground">
                    No records
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((row) => (
                  <TableRow key={idOf(row)}>
                    {config.columns.map((c) => (
                      <TableCell key={c.key}>{c.render ? c.render(row) : (getValueByPath(row, c.key) ?? "—")}</TableCell>
                    ))}
                    {config.hasStatus && (
                      <TableCell>
                        <Badge variant={statusOf(row) === "active" ? "secondary" : "outline"}>
                          {statusOf(row)}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {(config.rowActions ?? []).map((action, ai) => {
                          const key = `${ai}:${idOf(row)}`;
                          const busy = busyAction === key;
                          return (
                            <Tooltip key={ai}>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  disabled={busy}
                                  onClick={() => runRowAction(action, row, key)}
                                  aria-label={action.tooltip}
                                >
                                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : action.icon}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{action.tooltip}</TooltipContent>
                            </Tooltip>
                          );
                        })}
                        <Tooltip>
                      <TooltipTrigger asChild>

                        <Button size="icon" variant="ghost" onClick={() => setEditing(row)} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                        {config.hasStatus && (
                          <Tooltip>
                   <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={togglingId === idOf(row)}
                            onClick={() => toggleStatus(row)}
                            aria-label={statusOf(row) === "active" ? "Deactivate" : "Reactivate"}
                          >
                            <Power
                              className={
                                statusOf(row) === "active"
                                  ? "h-4 w-4 text-destructive"
                                  : "h-4 w-4 text-primary"
                              }
                            />
                          </Button>
                           </TooltipTrigger>
                          <TooltipContent>{statusOf(row) === "active" ? "Deactivate" : "Activate"}</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
             {totalCount > PAGE_SIZE && (
              <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {rangeStart}–{rangeEnd} of {totalCount}
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

      {/* {!isLoading && paged.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {rangeStart}–{rangeEnd} of {totalCount}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="px-1">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )} */}

      <EntityForm
        open={creating || !!editing}
        title={`${editing ? "Edit" : "New"} ${config.title.replace(/s$/i, "")}`}
        fields={config.fields}
        optionsMap={optionsMap}
        record={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSubmit={async (values) => {
          if (editing) await api.update(idOf(editing), values);
          else await api.create(values);
          toast.success(editing ? "Updated" : "Created");
          afterSave();
        }}
      />
    </div>
    </TooltipProvider>
  );
}

// ---------- create / edit form ----------
function EntityForm({
  open,
  title,
  fields,
  optionsMap,
  record,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  fields: FieldDef[];
  optionsMap: Record<string, Option[]>;
  record?: any | null;
  onClose: () => void;
  onSubmit: (values: any) => Promise<void>;
}) {
  const schema = useMemo(() => buildSchema(fields), [fields]);

  // Map each parent field to the child fields that depend on it, so changing a
  // parent (e.g. Farm) can clear its dependent selects (e.g. Plot).
  const childrenOf = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const f of fields) {
      if (f.dependsOn) (map[f.dependsOn] ??= []).push(f.name);
    }
    return map;
  }, [fields]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  // Clearing a select resets its whole dependent chain (e.g. Farm → Plot →
  // Valve), so no stale downstream selection survives.
  const clearDescendants = (name: string) => {
    (childrenOf[name] ?? []).forEach((c) => {
      setValue(c, "", { shouldValidate: true });
      clearDescendants(c);
    });
  };
  const onSelectChange = (name: string, v: string) => {
    setValue(name, v, { shouldValidate: true });
    clearDescendants(name);
  };

  useEffect(() => {
    if (open) {
      reset(
        fields.reduce((acc, f) => {
          const raw = getValueByPath(record, f.name);
          let val: any;
          if (f.kind === "multi-select") {
            val = toIdArray(raw);
          } else if (f.kind === "select") {
            // Refs (e.g. parentFarm) come back populated as objects; the
            // Select matches option values by id, so normalize to an id string.
            val = raw && typeof raw === "object" ? idOf(raw) ?? "" : raw ?? "";
          } else if (f.kind === "date") {
            // <input type="date"> needs a yyyy-MM-dd value.
            val = raw ? String(raw).slice(0, 10) : "";
          } else {
            val = raw ?? "";
          }
          return { ...acc, [f.name]: val };
        }, {} as Record<string, any>),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, record, fields]);

  const submit = handleSubmit(async (values) => {
    // Strip empty optional values so nullable columns stay unset.
    const clean = Object.fromEntries(
      Object.entries(values).filter(([, v]) => {
        if (v === "" || v === undefined) return false;
        if (Array.isArray(v) && v.length === 0) return false;
        return true;
      }),
    );
    try {
      await onSubmit(clean);
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    }
  });

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {fields.map((f) => {
            const err = errors[f.name]?.message as string | undefined;
            const options = f.options ?? (f.optionsFrom ? optionsMap[f.optionsFrom] ?? [] : []);
            return (
              <div key={f.name} className="space-y-1.5">
                <Label htmlFor={f.name}>
                  {f.label}
                  {f.required && <span className="ml-1 text-destructive">*</span>}
                </Label>
                {f.kind === "textarea" ? (
                  <Textarea id={f.name} rows={3} placeholder={f.placeholder} {...register(f.name)} />
                ) : f.kind === "select" && f.dependsOn ? (
                  <DependentSelect
                    field={f}
                    parentLabel={fields.find((pf) => pf.name === f.dependsOn)?.label}
                    parentValue={(watch(f.dependsOn) as string) ?? ""}
                    value={(watch(f.name) as string) ?? ""}
                    onChange={(v) => onSelectChange(f.name, v)}
                  />
                ) : f.kind === "select" ? (
                  <Select
                    value={(watch(f.name) as string) ?? ""}
                    onValueChange={(v) => onSelectChange(f.name, v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={f.placeholder ?? "Select…"} />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : f.kind === "multi-select" ? (
                  <MultiSelect
                    options={options}
                    value={(watch(f.name) as string[]) ?? []}
                    onChange={(v) => setValue(f.name, v, { shouldValidate: true })}
                    placeholder={f.placeholder ?? "Select…"}
                  />
                ) : (
                  <Input
                    id={f.name}
                    type={f.kind === "number" ? "number" : f.kind === "date" ? "date" : "text"}
                    step={f.kind === "number" ? "any" : undefined}
                    placeholder={f.placeholder}
                    {...register(f.name)}
                  />
                )}
                {err && <p className="text-xs text-destructive">{err}</p>}
              </div>
            );
          })}
          <SheetFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
