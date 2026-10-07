import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Pencil, Power, Trash2, Search } from "lucide-react";
import {
  getAllVarieties,
  createVariety,
  updateVariety,
  getAllPlotVarieties,
  createPlotVariety,
  deletePlotVariety,
} from "@/apis/varieties";
import { getAllPlots } from "@/apis/farm.geography";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// ---------- shared types (mirror the old MasterListPage config shape) ----------
type FieldKind = "text" | "textarea" | "number" | "date" | "select";

type FieldDef = {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  options?: Option[]; // inline select options
  optionsFrom?: string; // key into optionsMap (e.g. "plots")
};

type ColumnDef = {
  key: string;
  header: string;
  render?: (row: any) => React.ReactNode;
};

type MasterConfig = {
  title: string;
  description?: string;
  columns: ColumnDef[];
  fields: FieldDef[];
  searchColumns?: string[];
  hasStatus?: boolean;
  hardDelete?: boolean; // join tables: delete instead of deactivate
};

type CrudApi = {
  fetchAll: () => Promise<any>;
  create: (values: any) => Promise<any>;
  update?: (id: string, values: any) => Promise<any>;
  remove?: (id: string) => Promise<any>;
};

type Option = { value: string; label: string };

// ---------- helpers ----------
const extractList = (res: any): any[] => {
  const obj = res?.responseObject ?? res?.data ?? res;
  if (Array.isArray(obj)) return obj;
  if (obj && typeof obj === "object") {
    const arr = Object.values(obj).find((v) => Array.isArray(v));
    if (Array.isArray(arr)) return arr;
  }
  return [];
};

const idOf = (row: any) => row?._id ?? row?.id;

const statusOf = (row: any): "active" | "inactive" => {
  if (typeof row?.status === "string") return row.status === "active" ? "active" : "inactive";
  if (typeof row?.isActive === "boolean") return row.isActive ? "active" : "inactive";
  return "active";
};

const getValueByPath = (row: any, path?: string) => {
  if (!row || !path) return undefined;
  if (Object.prototype.hasOwnProperty.call(row, path)) return row[path];
  return path.split(".").reduce((acc, key) => acc?.[key], row);
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
    } else {
      let str = z.string();
      if (f.required) str = str.min(1, "Required");
      s = f.required ? str : str.optional().or(z.literal(""));
    }
    shape[f.name] = s;
  }
  if (fields.some((f) => f.name === "varietyType")) {
    shape.otherVarietyType = z.string().optional().or(z.literal(""));
  }
  return z.object(shape);
}

// ---------- generic master list (self-contained) ----------
function MasterList({
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
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  // Status filter: "all" (default), "active", or "inactive".
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("all");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<any | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.fetchAll();
      setRows(extractList(res));
    } catch (e: any) {
      toast.error(e?.message || `Unable to load ${config.title.toLowerCase()}`);
    } finally {
      setIsLoading(false);
    }
  }, [api, config.title]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    let list = rows;
    if (config.hasStatus && statusFilter !== "all") {
      list = list.filter((r) => statusOf(r) === statusFilter);
    }
    const term = search.trim().toLowerCase();
    if (term && config.searchColumns?.length) {
      list = list.filter((r) =>
        config.searchColumns!.some((c) =>
          String(getValueByPath(r, c) ?? "").toLowerCase().includes(term),
        ),
      );
    }
    return list;
  }, [rows, search, statusFilter, config.hasStatus, config.searchColumns]);

  const afterSave = () => {
    setCreating(false);
    setEditing(null);
    refresh();
    onChanged?.();
  };

  const toggleStatus = async (row: any) => {
    if (!api.update) return;
    const next = statusOf(row) === "active" ? "inactive" : "active";
    setBusyId(idOf(row));
    try {
      await api.update(idOf(row), { status: next, isActive: next === "active" });
      toast.success("Status updated");
      refresh();
      onChanged?.();
    } catch (e: any) {
      toast.error(e?.message || "Unable to update status");
    } finally {
      setBusyId(null);
    }
  };

  const removeRow = async () => {
    if (!api.remove || !confirmRemove) return;
    setBusyId(idOf(confirmRemove));
    try {
      await api.remove(idOf(confirmRemove));
      toast.success("Removed");
      setConfirmRemove(null);
      refresh();
      onChanged?.();
    } catch (e: any) {
      toast.error(e?.message || "Unable to remove");
    } finally {
      setBusyId(null);
    }
  };

  const columnCount = config.columns.length + (config.hasStatus ? 1 : 0) + 1;
  const canSearch = !!config.searchColumns?.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* {canSearch && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-56 pl-8"
              />
            </div>
          )} */}
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
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New
        </Button>
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
                filtered.map((row) => (
                  <TableRow key={idOf(row)}>
                    {config.columns.map((c) => (
                      <TableCell key={c.key}>
                        {c.render ? c.render(row) : (getValueByPath(row, c.key) ?? "—")}
                      </TableCell>
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
                        {api.update && (
                          <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant="ghost" onClick={() => setEditing(row)} aria-label="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                            <TooltipContent>Edit Variety</TooltipContent>
                          </Tooltip>
                        )}
                        {config.hasStatus && api.update && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={busyId === idOf(row)}
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
                            <TooltipContent>
                              {statusOf(row) === "active" ? "Deactivate" : "Activate"}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {config.hardDelete && api.remove && (
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={busyId === idOf(row)}
                            onClick={() => setConfirmRemove(row)}
                            aria-label="Remove"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
          if (editing && api.update) await api.update(idOf(editing), values);
          else await api.create(values);
          toast.success(editing ? "Updated" : "Created");
          afterSave();
        }}
      />

      <AlertDialog open={!!confirmRemove} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove record?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the association. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={removeRow}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const selectedVarietyType = watch("varietyType");

  useEffect(() => {
    if (open) {
      reset(
        fields.reduce(
          (acc, f) => ({ ...acc, [f.name]: record?.[f.name] ?? "" }),
          { otherVarietyType: record?.otherVarietyType ?? "" } as Record<string, any>,
        ),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, record, fields]);

  const submit = handleSubmit(async (values) => {
    const clean = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== "" && v !== undefined),
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
            const isOtherVariety = f.name === "varietyType" && selectedVarietyType === "Other";
            return (
              <div key={f.name} className="space-y-1.5">
                <Label htmlFor={f.name}>
                  {f.label}
                  {f.required && <span className="ml-1 text-destructive">*</span>}
                </Label>
                {f.kind === "textarea" ? (
                  <Textarea id={f.name} rows={3} placeholder={f.placeholder} {...register(f.name)} />
                ) : f.kind === "select" ? (
                  <>
                    <Select
                      value={(watch(f.name) as string) ?? ""}
                      onValueChange={(v) => setValue(f.name, v, { shouldValidate: true })}
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
                    {isOtherVariety && (
                      <div className="space-y-1.5 pt-2">
                        <Label htmlFor="otherVarietyType">Other type</Label>
                        <Input
                          id="otherVarietyType"
                          placeholder="Enter other variety type"
                          {...register("otherVarietyType")}
                        />
                        {errors.otherVarietyType && (
                          <p className="text-xs text-destructive">{errors.otherVarietyType.message as string}</p>
                        )}
                      </div>
                    )}
                  </>
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

// ---------- page ----------
const VARIETY_API: CrudApi = {
  fetchAll: getAllVarieties,
  create: createVariety,
  update: updateVariety,
};
// const PLOT_VARIETY_API: CrudApi = {
//   fetchAll: getAllPlotVarieties,
//   create: createPlotVariety,
//   remove: deletePlotVariety,
// };

function VarietiesPage() {
  const [tab, setTab] = useState("varieties");
  const [optionsMap, setOptionsMap] = useState<Record<string, Option[]>>({
    plots: [],
    varieties: [],
  });

  const loadOptions = useCallback(async () => {
    try {
      const [plotsRes, varietiesRes] = await Promise.all([getAllPlots(), getAllVarieties()]);
      const toOptions = (res: any): Option[] =>
        extractList(res).map((r) => ({ value: idOf(r), label: r.name ?? r.code ?? idOf(r) }));
      setOptionsMap({ plots: toOptions(plotsRes), varieties: toOptions(varietiesRes) });
    } catch {
      /* best-effort; the varieties tab loads its own data regardless */
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Varieties</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {/* Master list of varieties and their plot assignments. */}
          Master list of varieties .

        </p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        {/* <TabsList>
          <TabsTrigger value="varieties">Varieties</TabsTrigger>
          <TabsTrigger value="assignments">Plot assignments</TabsTrigger>
        </TabsList> */}

        <TabsContent value="varieties" className="mt-6">
          <MasterList
            api={VARIETY_API}
            onChanged={loadOptions}
            config={{
              title: "Varieties",
              searchColumns: ["name", "varietyCode"],
              hasStatus: true,
              columns: [
                { key: "varietyCode", header: "Code" },
                { key: "varietyName", header: "Name" },
                { key: "varietyType", header: "Type" },
              ],
              fields: [
                // { name: "varietyCode", label: "Code", kind: "text", required: true },
                { name: "varietyName", label: "Name", kind: "text", required: true },
                {
                  name: "varietyType",
                  label: "Type",
                  kind: "select",
                  required: true,
                  options: [
                    { value: "Main", label: "Main" },
                    { value: "Pollinator", label: "Pollinator" },
                    { value: "Other", label: "Other" },
                  ],
                },
                { name: "technicalComments", label: "Comments", kind: "textarea" },
              ],
            }}
          />
        </TabsContent>

        {/* <TabsContent value="assignments" className="mt-6">
          <MasterList
            api={PLOT_VARIETY_API}
            optionsMap={optionsMap}
            config={{
              title: "Plot ↔ Variety",
              hardDelete: true,
              columns: [
                {
                  key: "plot_id",
                  header: "Plot",
                  render: (r) =>
                    optionsMap.plots.find((o) => o.value === (r.plot_id ?? idOf(r.plot)))?.label ??
                    r.plot_id ??
                    "—",
                },
                {
                  key: "variety_id",
                  header: "Variety",
                  render: (r) =>
                    optionsMap.varieties.find((o) => o.value === (r.variety_id ?? idOf(r.variety)))
                      ?.label ??
                    r.variety_id ??
                    "—",
                },
                { key: "createdAt", header: "Assigned", render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—") },
              ],
              fields: [
                { name: "plot_id", label: "Plot", kind: "select", required: true, optionsFrom: "plots" },
                { name: "variety_id", label: "Variety", kind: "select", required: true, optionsFrom: "varieties" },
              ],
            }}
          />
        </TabsContent> */}
      </Tabs>
    </div>
  );
}

export default VarietiesPage;
