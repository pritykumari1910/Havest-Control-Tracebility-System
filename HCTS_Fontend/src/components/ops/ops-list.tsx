import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type OpsColumn = {
  key: string;
  header: string;
  accessor?: (row: any) => React.ReactNode;
  className?: string;
};

export type OpsListConfig = {
  table: string;
  title: string;
  description?: string;
  select?: string; // e.g. "*, farm:farms(name), variety:varieties(name)"
  orderBy?: { column: string; ascending?: boolean };
  columns: OpsColumn[];
  searchColumns?: string[]; // client-side substring filter
  statusOptions?: { value: string; label: string }[]; // if provided, adds a status filter
  statusColumn?: string; // defaults to "status"
  limit?: number;
  emptyMessage?: string;
  extraFilter?: (row: any) => boolean;
};

const STATUS_TONE: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
  active: "secondary",
  closed: "outline",
  historical: "outline",
  open: "default",
  pending: "outline",
  received: "secondary",
  dispatched: "secondary",
  in_transit: "default",
  delivered: "secondary",
  cancelled: "destructive",
  inactive: "outline",
  received_from_printer: "outline",
  sent_to_printer: "outline",
};

export function statusBadge(v: any) {
  if (v == null) return <span className="text-muted-foreground">—</span>;
  const tone = STATUS_TONE[String(v)] ?? "outline";
  return <Badge variant={tone}>{String(v).replace(/_/g, " ")}</Badge>;
}

export function fmtDate(v: any) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  // date-only if no time component
  if (typeof v === "string" && v.length <= 10) return d.toLocaleDateString();
  return d.toLocaleString();
}

export function OpsListPage({ config }: { config: OpsListConfig }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["ops-list", config.table, config.select ?? "*", status, config.orderBy?.column],
    queryFn: async () => {
      let q = (supabase as any).from(config.table).select(config.select ?? "*");
      if (config.orderBy) q = q.order(config.orderBy.column, { ascending: config.orderBy.ascending ?? false });
      if (config.statusOptions && status !== "all") {
        q = q.eq(config.statusColumn ?? "status", status);
      }
      q = q.limit(config.limit ?? 500);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const rows = useMemo(() => {
    let r = data ?? [];
    if (config.extraFilter) r = r.filter(config.extraFilter);
    if (search && config.searchColumns?.length) {
      const s = search.toLowerCase();
      r = r.filter((row) =>
        config.searchColumns!.some((c) => {
          const parts = c.split(".");
          let v: any = row;
          for (const p of parts) v = v?.[p];
          return String(v ?? "").toLowerCase().includes(s);
        })
      );
    }
    return r;
  }, [data, search, config]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{config.title}</h1>
          {config.description && <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {config.searchColumns?.length ? (
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-8 w-64" />
            </div>
          ) : null}
          {config.statusOptions ? (
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {config.statusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {config.columns.map((c) => <TableHead key={c.key} className={c.className}>{c.header}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={config.columns.length} className="p-8 text-center text-muted-foreground">Loading…</TableCell></TableRow>
              ) : error ? (
                <TableRow><TableCell colSpan={config.columns.length} className="p-8 text-center text-destructive">{(error as any).message}</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={config.columns.length} className="p-8 text-center text-muted-foreground">{config.emptyMessage ?? "No records"}</TableCell></TableRow>
              ) : rows.map((row: any) => (
                <TableRow key={row.id}>
                  {config.columns.map((c) => (
                    <TableCell key={c.key} className={c.className}>
                      {c.accessor ? c.accessor(row) : (row[c.key] ?? "—")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">{rows.length} record{rows.length === 1 ? "" : "s"}</p>
      )}
    </div>
  );
}
