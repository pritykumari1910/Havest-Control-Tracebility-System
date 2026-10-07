import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getAllCampaigns,
  createCampaign,
  updateCampaign,
  notifyActiveCampaignChanged,
} from "@/apis/campaigns";
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
import { Plus, Pencil, Search } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import buildPageItems from "@/utils/paginationCount";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
  { value: "historical", label: "Historical" },
] as const;

const STATUS_VARIANT: Record<string, "secondary" | "outline"> = {
  draft: "outline",
  active: "secondary",
  closed: "outline",
  historical: "outline",
};

const campaignSchema = z.object({
  // code: z.string().min(1, "Code is required"),
  campaignName: z.string().min(1, "Name is required"),
  startDate: z.string().min(1, "Start date is required"),
  estimatedEndDate: z.string().min(1, "Estimated end date is required"),
  status: z.enum(["draft", "active", "closed", "historical"]),
  comments: z.string().optional().or(z.literal("")),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

const toDateInput = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
};

function CampaignsPageComponent() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ total: number; totalPages: number } | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const PAGE_SIZE = 10;

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: PAGE_SIZE };
      if (search.trim()) params.campaignName = search.trim();
      if (statusFilter) params.status = statusFilter;

      const res = await getAllCampaigns(params);
      const ro = res?.responseObject ?? res?.data ?? res;
      const list = Array.isArray(ro) ? ro : (ro?.campaigns ?? []);
      setCampaigns(Array.isArray(list) ? list : []);
      setPagination(ro?.pagination ?? null);
    } catch (e: any) {
      toast.error(e?.message || "Unable to load campaigns");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter]);

  // Debounce the search input before hitting the API.
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 450);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Reset to the first page whenever the filters change.
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const totalItems = pagination?.total ?? campaigns.length;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const currentPage = Math.min(page, totalPages);
  const pageStart = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = (currentPage - 1) * PAGE_SIZE + campaigns.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Harvest campaigns lifecycle. Only one active campaign at a time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search campaigns…"
              className="w-56 pl-8"
            />
          </div>
          <div className="w-44">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New campaign
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>Est. End</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-8 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-8 text-center text-muted-foreground">
                    No campaigns
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((c: any) => (
                  <TableRow key={c._id ?? c.id}>
                    <TableCell className="font-medium">{c.campaignCode}</TableCell>
                    <TableCell>{c.campaignName}</TableCell>
                    <TableCell>{formatDate(c.startDate)}</TableCell>
                    <TableCell>{formatDate(c.estimatedEndDate)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[c.status] ?? "outline"}>
                        {c.status ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditing(c)}
                            aria-label="Edit campaign"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Update campaign</TooltipContent>
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
                Showing {pageStart}–{pageEnd} of {totalItems} campaigns
              </p>
              <Pagination aria-label="Campaign list pagination">
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

      <CampaignSheet
        open={creating || !!editing}
        campaign={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={() => {
          setCreating(false);
          setEditing(null);
          refresh();
          // Let the header re-fetch the active campaign chip immediately.
          notifyActiveCampaignChanged();
        }}
      />
    </div>
  );
}

function CampaignSheet({
  open,
  campaign,
  onClose,
  onSaved,
}: {
  open: boolean;
  campaign?: any | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!campaign;

  const buildDefaults = (): CampaignFormValues => ({
    // code: campaign?.code ?? "",
    campaignName: campaign?.campaignName ?? "",
    startDate: toDateInput(campaign?.startDate),
    estimatedEndDate: toDateInput(campaign?.estimatedEndDate),
    status: (campaign?.status as CampaignFormValues["status"]) ?? "draft",
    comments: campaign?.comments ?? "",
  });

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    mode: "onTouched",
    defaultValues: buildDefaults(),
  });

  useEffect(() => {
    if (open) reset(buildDefaults());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, campaign]);

  const onSubmit = async (values: CampaignFormValues) => {
    // Drop empty optional fields so they stay unset on the backend.
    const payload = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== "" && v != null),
    );
    try {
      if (isEdit) {
        await updateCampaign(campaign._id ?? campaign.id, payload);
        toast.success("Campaign updated");
      } else {
        await createCampaign(payload);
        toast.success("Campaign created");
      }
      onSaved();
    } catch (e: any) {
      toast.error(
        e?.message || (isEdit ? "Unable to update campaign" : "Unable to create campaign"),
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit campaign" : "New campaign"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
         

          <div className="space-y-1.5">
            <Label htmlFor="camp-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="campaignName"
              control={control}
              render={({ field }) => <Input id="camp-name" {...field} />}
            />
            {errors.campaignName && (
              <p className="text-xs text-destructive">{errors.campaignName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="camp-start">
              Start date <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <Input id="camp-start" type="date" {...field} />
              )}
            />
            {errors.startDate && (
              <p className="text-xs text-destructive">{errors.startDate.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="camp-end">Estimated end date <span className="text-destructive">*</span></Label>
            <Controller
              name="estimatedEndDate"
              control={control}
              render={({ field }) => (
                <Input id="camp-end" type="date" {...field} />
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              Status <span className="text-destructive">*</span>
            </Label>
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
            {errors.status && (
              <p className="text-xs text-destructive">{errors.status.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="camp-comments">Comments</Label>
            <Controller
              name="comments"
              control={control}
              render={({ field }) => (
                <Textarea id="camp-comments" rows={3} {...field} />
              )}
            />
          </div>

          <SheetFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create campaign"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export const CampaginPage = CampaignsPageComponent;

export default CampaignsPageComponent;
