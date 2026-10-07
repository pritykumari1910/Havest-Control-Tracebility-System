import { useCallback, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  getHarvestForecast,
  createHarvestForecast,
  updateHarvestForecast,
  bulkuploadHarvestForecast,
} from "@/apis/harvest.forcast";
import { getAllCampaigns } from "@/apis/campaigns";
import { getAllFarms, allPlotsOfFarm, allValvesOfPlot, allParksOfValve } from "@/apis/farm.geography";
import { getAllVarieties } from "@/apis/varieties";
import { useAuth } from "@/hooks/use-auth";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Pencil, Upload, FileDown } from "lucide-react";
import buildPageItems from "@/utils/paginationCount";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "validated", label: "Validated" },
  { value: "closed", label: "Closed" },
  { value: "revised", label: "Revised" },
] as const;

const STATUS_TONE: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
  draft: "outline",
  validated: "secondary",
  closed: "default",
  revised: "outline",
};

const forecastSchema = z.object({
  campaign: z.string().min(1, "Campaign is required"),
  farm: z.string().min(1, "Farm is required"),
  plot: z.string().min(1, "Plot is required"),
  valve: z.string().optional().or(z.literal("")),
  park: z.string().optional().or(z.literal("")),
  variety: z.string().min(1, "Variety is required"),
  surfaceArea: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number({ error: "Surface area is required" }).positive("Surface area must be greater than 0"),
  ),
  estimatedKg: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number({ error: "Estimated kg is required" }).min(0, "Estimated kg must be ≥ 0"),
  ),
  recordDate: z.string().optional().or(z.literal("")),
  status: z.enum(["draft", "validated", "closed", "revised"]),
  comments: z.string().optional().or(z.literal("")),
});

type ForecastFormValues = z.infer<typeof forecastSchema>;

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
const num = (v: any) => (v == null || Number.isNaN(Number(v)) ? "—" : Number(v).toLocaleString());

type Option = { value: string; label: string };

function statusBadge(v: string) {
  const opt = STATUS_OPTIONS.find((o) => o.value === v);
  return <Badge variant={STATUS_TONE[v] ?? "outline"}>{opt?.label ?? v ?? "—"}</Badge>;
}

// A select whose options are fetched from the value of a parent select.
function DependentSelect({
  parentValue,
  value,
  onChange,
  fetchOptions,
  placeholder,
  parentLabel,
  allowNone,
}: {
  parentValue: string;
  value: string;
  onChange: (v: string) => void;
  fetchOptions: (parentId: string) => Promise<any>;
  placeholder?: string;
  parentLabel?: string;
  allowNone?: boolean;
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
          setOptions(
            extractList(res).map((r) => ({
              value: idOf(r),
              label: r.plotName ?? r.valveName ?? r.parkName ?? r.name ?? idOf(r),
            })),
          );
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
            !parentValue
              ? `Select ${parentLabel ?? "parent"} first`
              : loading
                ? "Loading…"
                : placeholder ?? "Select…"
          }
        />
      </SelectTrigger>
      <SelectContent>
        {allowNone && <SelectItem value="__none__">None</SelectItem>}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const HarvestForecasts = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<{ total: number; totalPages: number } | null>(null);
  const [page, setPage] = useState(1);

  const [campaignFilter, setCampaignFilter] = useState("all");
  const [farmFilter, setFarmFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [creating, setCreating] = useState(false);
  const [editRow, setEditRow] = useState<any | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  // Creating, bulk-uploading and editing forecasts is limited to these roles;
  // everyone else with page access gets a read-only table.
  const { hasAnyRole } = useAuth();
  const canManage = hasAnyRole(["system_administrator", "operations_director", "field_engineer"]);
  // 8 data columns, plus the Actions column only when it is rendered.
  const colCount = canManage ? 9 : 8;

  const [campaigns, setCampaigns] = useState<Option[]>([]);
  const [farms, setFarms] = useState<Option[]>([]);
  const [varieties, setVarieties] = useState<Option[]>([]);

  // Load option lists once.
  useEffect(() => {
    (async () => {
      try {
        const [cRes, fRes, vRes] = await Promise.all([
          getAllCampaigns({ limit: 100 }),
          getAllFarms({ limit: 100 }),
          getAllVarieties(),
        ]);
        setCampaigns(
          extractList(cRes).map((r) => ({ value: idOf(r), label: r.campaignName ?? r.name ?? idOf(r) })),
        );
        setFarms(extractList(fRes).map((r) => ({ value: idOf(r), label: r.farmName ?? r.name ?? idOf(r) })));
        setVarieties(
          extractList(vRes).map((r) => ({ value: idOf(r), label: r.varietyName ?? r.name ?? idOf(r) })),
        );
      } catch {
        /* best-effort */
      }
    })();
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: PAGE_SIZE };
      if (campaignFilter !== "all") params.campaignId = campaignFilter;
      if (farmFilter !== "all") params.farmId = farmFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await getHarvestForecast(params);
      const ro = res?.responseObject ?? res?.data ?? res;
      const list = Array.isArray(ro) ? ro : ro?.forecasts ?? [];
      setRows(Array.isArray(list) ? list : []);
      setPagination(ro?.pagination ?? null);
    } catch (e: any) {
      toast.error(e?.message || "Unable to load forecasts");
    } finally {
      setIsLoading(false);
    }
  }, [page, campaignFilter, farmFilter, statusFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setPage(1);
  }, [campaignFilter, farmFilter, statusFilter]);

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
            <h1 className="text-2xl font-semibold tracking-tight">Harvest Forecasts</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Estimated yields per plot, valve and variety for each campaign.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All campaigns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All campaigns</SelectItem>
                {campaigns.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={farmFilter} onValueChange={setFarmFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All farms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All farms</SelectItem>
                {farms.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            {canManage && (
              <>
                <Button variant="outline" onClick={() => setBulkOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk upload
                </Button>
                <Button onClick={() => setCreating(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New forecast
                </Button>
              </>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Farm</TableHead>
                  <TableHead>Plot-Valve-Park</TableHead>
                  <TableHead>Variety</TableHead>
                  <TableHead>Surface (ha)</TableHead>
                  <TableHead>Estimated kg</TableHead>
                  <TableHead>kg / ha</TableHead>
                  <TableHead>Status</TableHead>
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
                      {canManage ? "No forecasts — click “New forecast” to add one." : "No forecasts found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r: any) => (
                    <TableRow key={idOf(r)}>
                      <TableCell className="font-medium">
                        {r.campaign?.campaignName ?? r.campaign?.campaignCode ?? "—"}
                      </TableCell>
                      <TableCell>{r.farm?.farmName ?? "—"}</TableCell>
                      <TableCell>
                        {r.plot?.plotName ?? "—"}
                        {r.valve?.valveName ? ` - ${r.valve.valveName}` : ""}
                        {r.park?.parkName ? ` - ${r.park.parkName}` : ""}
                      </TableCell>
                      <TableCell>{r.variety?.varietyName ?? "—"}</TableCell>
                      <TableCell>{num(r.surfaceArea)}</TableCell>
                      <TableCell>{num(r.estimatedKg)}</TableCell>
                      <TableCell>{num(r.estimatedKgPerHa)}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
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
                  ))
                )}
              </TableBody>
            </Table>
            {totalItems > PAGE_SIZE && (
              <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {pageStart}–{pageEnd} of {totalItems} forecasts
                </p>
                <Pagination aria-label="Forecast pagination">
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

        <ForecastSheet
          open={creating || !!editRow}
          row={editRow}
          campaigns={campaigns}
          farms={farms}
          varieties={varieties}
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

        <BulkUploadSheet
          open={bulkOpen}
          onClose={() => setBulkOpen(false)}
          onUploaded={() => {
            setBulkOpen(false);
            refresh();
          }}
        />
      </div>
    </TooltipProvider>
  );
};

const TEMPLATE_COLUMNS = [
  "Campaign Code",
  "Farm Code",
  "Plot Code",
  "Valve Code",
  "Park Code",
  "Variety Code",
  "Surface Area",
  "Estimated Kg",
  "Responsible Person",
  "Status",
  "Comments",
];

function BulkUploadSheet({
  open,
  onClose,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [rowErrors, setRowErrors] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setFile(null);
      setRowErrors([]);
    }
  }, [open]);

  const downloadTemplate = () => {
    const header = TEMPLATE_COLUMNS.join(",");
    const example = "C-2026-01,FARM01,PLOT001,,,HASS,12.5,45000,Jane Doe,draft,Optional note";
    const blob = new Blob([`${header}\n${example}\n`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "harvest-forecast-template.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const upload = async () => {
    if (!file) return toast.error("Choose a file to upload");
    setUploading(true);
    setRowErrors([]);
    try {
      const res = await bulkuploadHarvestForecast(file);
      toast.success(res?.message || "Forecasts uploaded");
      onUploaded();
    } catch (err: any) {
      if (Array.isArray(err?.rowErrors) && err.rowErrors.length) {
        setRowErrors(err.rowErrors);
        toast.error(err?.message || "Some rows have errors");
      } else {
        toast.error(err?.message || "Upload failed");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Bulk forecast upload</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload an Excel (.xlsx / .xls) or CSV file. The first sheet is read; references are matched by
            their <span className="font-medium">codes</span> (campaign, farm, plot, valve, park, variety).
          </p>

          <div className="rounded-md border bg-muted/30 p-3 text-xs">
            <div className="mb-1 font-medium">Expected columns</div>
            <div className="flex flex-wrap gap-1">
              {TEMPLATE_COLUMNS.map((c) => (
                <Badge key={c} variant="outline" className="font-normal">
                  {c}
                </Badge>
              ))}
            </div>
            <p className="mt-2 text-muted-foreground">
              Valve, Park, Status and Comments are optional. Status defaults to “draft”.
            </p>
          </div>

          <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
            <FileDown className="mr-2 h-4 w-4" />
            Download CSV template
          </Button>

          <div className="space-y-1.5">
            <Label>File</Label>
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setRowErrors([]);
              }}
            />
          </div>

          {rowErrors.length > 0 && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
              <div className="mb-1 text-sm font-medium text-destructive">
                {rowErrors.length} row error{rowErrors.length > 1 ? "s" : ""} — nothing was imported
              </div>
              <ul className="max-h-48 space-y-1 overflow-auto text-xs text-destructive">
                {rowErrors.map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <SheetFooter className="mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={upload} disabled={uploading || !file}>
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function ForecastSheet({
  open,
  row,
  campaigns,
  farms,
  varieties,
  onClose,
  onSaved,
}: {
  open: boolean;
  row: any | null;
  campaigns: Option[];
  farms: Option[];
  varieties: Option[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!row;

  // Refs come back either populated (object) or as a bare id string.
  const refId = (v: any) => (v == null ? "" : typeof v === "object" ? idOf(v) ?? "" : v);

  const buildDefaults = (): ForecastFormValues => ({
    campaign: refId(row?.campaign),
    farm: refId(row?.farm),
    plot: refId(row?.plot),
    valve: refId(row?.valve),
    park: refId(row?.park),
    variety: refId(row?.variety),
    surfaceArea: (row?.surfaceArea ?? "") as any,
    estimatedKg: (row?.estimatedKg ?? "") as any,
    recordDate: row?.recordDate ? new Date(row.recordDate).toISOString().slice(0, 10) : "",
    status: (row?.status as ForecastFormValues["status"]) ?? "draft",
    comments: row?.comments ?? "",
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forecastSchema),
    mode: "onTouched",
    defaultValues: buildDefaults() as any,
  });

  useEffect(() => {
    if (open) reset(buildDefaults());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, row]);

  const farm = watch("farm");
  const plot = watch("plot");
  const valve = watch("valve");
  const kg = Number(watch("estimatedKg"));
  const ha = Number(watch("surfaceArea"));
  const tonnes = kg > 0 ? kg / 1000 : 0;
  const kgPerHa = kg > 0 && ha > 0 ? kg / ha : 0;

  const onSubmit = handleSubmit(async (values) => {
    const payload: Record<string, any> = {
      campaign: values.campaign,
      farm: values.farm,
      plot: values.plot,
      valve: values.valve || null,
      park: values.park || null,
      variety: values.variety,
      surfaceArea: Number(values.surfaceArea),
      estimatedKg: Number(values.estimatedKg),
      status: values.status,
    };
    if (values.recordDate) payload.recordDate = new Date(values.recordDate).toISOString();
    if (values.comments) payload.comments = values.comments;

    try {
      if (isEdit) {
        await updateHarvestForecast(idOf(row), payload);
        toast.success("Forecast updated");
      } else {
        await createHarvestForecast(payload);
        toast.success("Forecast created");
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save forecast");
    }
  });

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit forecast" : "New forecast"}</SheetTitle>
        </SheetHeader>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label>
              Campaign <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="campaign"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.campaign && <p className="text-xs text-destructive">{errors.campaign.message as string}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>
              Farm <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="farm"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    setValue("plot", "");
                    setValue("valve", "");
                    setValue("park", "");
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select farm" />
                  </SelectTrigger>
                  <SelectContent>
                    {farms.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.farm && <p className="text-xs text-destructive">{errors.farm.message as string}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>
              Plot <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="plot"
              control={control}
              render={({ field }) => (
                <DependentSelect
                  parentValue={farm}
                  parentLabel="farm"
                  placeholder="Select plot"
                  value={field.value}
                  fetchOptions={allPlotsOfFarm}
                  onChange={(v) => {
                    field.onChange(v);
                    setValue("valve", "");
                    setValue("park", "");
                  }}
                />
              )}
            />
            {errors.plot && <p className="text-xs text-destructive">{errors.plot.message as string}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Valve</Label>
            <Controller
              name="valve"
              control={control}
              render={({ field }) => (
                <DependentSelect
                  parentValue={plot}
                  parentLabel="plot"
                  placeholder="Select valve"
                  value={field.value ?? ""}
                  allowNone
                  fetchOptions={allValvesOfPlot}
                  onChange={(v) => {
                    field.onChange(v);
                    setValue("park", "");
                  }}
                />
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Park</Label>
            <Controller
              name="park"
              control={control}
              render={({ field }) => (
                <DependentSelect
                  parentValue={valve ?? ""}
                  parentLabel="valve"
                  placeholder="Select park"
                  value={field.value ?? ""}
                  allowNone
                  fetchOptions={allParksOfValve}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              Variety <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="variety"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select variety" />
                  </SelectTrigger>
                  <SelectContent>
                    {varieties.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.variety && <p className="text-xs text-destructive">{errors.variety.message as string}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                Surface area (ha) <span className="text-destructive">*</span>
              </Label>
              <Input type="number" step="any" min={0} {...register("surfaceArea")} />
              {errors.surfaceArea && (
                <p className="text-xs text-destructive">{errors.surfaceArea.message as string}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>
                Estimated kg <span className="text-destructive">*</span>
              </Label>
              <Input type="number" step="any" min={0} {...register("estimatedKg")} />
              {errors.estimatedKg && (
                <p className="text-xs text-destructive">{errors.estimatedKg.message as string}</p>
              )}
            </div>
          </div>

          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated tonnes</span>
              <span className="font-medium">{tonnes ? tonnes.toLocaleString() : "—"}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-muted-foreground">Estimated kg / ha</span>
              <span className="font-medium">{kgPerHa ? Math.round(kgPerHa).toLocaleString() : "—"}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Record date</Label>
              <Input type="date" {...register("recordDate")} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
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
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Comments</Label>
            <Textarea rows={3} {...register("comments")} />
          </div>

          <SheetFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create forecast"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default HarvestForecasts;
