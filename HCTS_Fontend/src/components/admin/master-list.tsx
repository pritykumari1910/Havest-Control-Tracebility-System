import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@/lib/useFetch";
import { useServerFn } from "@/lib/server-fn";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  adminListRecords, adminCreateRecord, adminUpdateRecord, adminSetStatus, adminDeleteRecord,
} from "@/lib/admin/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Power, Trash2, Search } from "lucide-react";

export type FieldKind = "text" | "textarea" | "number" | "date" | "select";
export type FieldDef = {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: { value: string; label: string }[]; // for select
  optionsFrom?: string; // table name to fetch options from (uses id + name)
  optionsLabelKey?: string;
  optionsWhere?: Record<string, any>;
  placeholder?: string;
  min?: number;
};

export type ColumnDef = {
  key: string;
  header: string;
  render?: (row: any) => React.ReactNode;
};

export type MasterListConfig = {
  table: string;                 // must be in ADMIN_TABLES
  module: string;                // audit module name
  title: string;
  description?: string;
  columns: ColumnDef[];
  fields: FieldDef[];
  searchColumns?: string[];
  hasStatus?: boolean;           // supports active/inactive
  hardDelete?: boolean;          // join tables (no soft-delete)
};

function useOptions(f: FieldDef) {
  return useQuery({
    queryKey: ["admin-options", f.optionsFrom, f.optionsWhere],
    enabled: !!f.optionsFrom,
    queryFn: async () => {
      const rows = await adminListRecords({ data: { table: f.optionsFrom!, includeInactive: false } });
      return (rows ?? []).filter((r: any) =>
        !f.optionsWhere || Object.entries(f.optionsWhere).every(([k, v]) => r[k] === v)
      );
    },
  });
}

function FieldInput({ f, form }: { f: FieldDef; form: ReturnType<typeof useForm> }) {
  const opts = useOptions(f);
  const err = form.formState.errors[f.name]?.message as string | undefined;
  const val = form.watch(f.name);
  const commonProps = { id: f.name, ...form.register(f.name) };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={f.name}>
        {f.label}
        {f.required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {f.kind === "textarea" ? (
        <Textarea {...commonProps} placeholder={f.placeholder} rows={3} />
      ) : f.kind === "select" && f.options ? (
        <Select value={(val as string) ?? ""} onValueChange={(v) => form.setValue(f.name, v, { shouldValidate: true })}>
          <SelectTrigger><SelectValue placeholder={f.placeholder ?? "Select…"} /></SelectTrigger>
          <SelectContent>
            {f.options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : f.kind === "select" && f.optionsFrom ? (
        <Select value={(val as string) ?? ""} onValueChange={(v) => form.setValue(f.name, v, { shouldValidate: true })}>
          <SelectTrigger><SelectValue placeholder={f.placeholder ?? "Select…"} /></SelectTrigger>
          <SelectContent>
            {(opts.data ?? []).map((o: any) => (
              <SelectItem key={o.id} value={o.id}>{o[f.optionsLabelKey ?? "name"]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input {...commonProps} type={f.kind === "number" ? "number" : f.kind === "date" ? "date" : "text"} placeholder={f.placeholder} step={f.kind === "number" ? "any" : undefined} min={f.min} />
      )}
      {err && <p className="text-xs text-destructive">{err}</p>}
    </div>
  );
}

function buildSchema(fields: FieldDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    let s: z.ZodTypeAny;
    if (f.kind === "number") {
      s = z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number({ invalid_type_error: "Must be a number" }));
    } else {
      s = z.string();
    }
    if (f.required) {
      if (f.kind === "number") s = s.refine((v) => v !== undefined && !Number.isNaN(v), "Required");
      else s = (s as z.ZodString).min(1, "Required");
    } else {
      s = s.optional().or(z.literal(""));
    }
    shape[f.name] = s;
  }
  return z.object(shape);
}

export function MasterListPage({ config }: { config: MasterListConfig }) {
  const qc = useQueryClient();
  const [includeInactive, setIncludeInactive] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<any | null>(null);

  const listFn = useServerFn(adminListRecords);
  const createFn = useServerFn(adminCreateRecord);
  const updateFn = useServerFn(adminUpdateRecord);
  const statusFn = useServerFn(adminSetStatus);
  const deleteFn = useServerFn(adminDeleteRecord);

  const list = useQuery({
    queryKey: ["admin-list", config.table, includeInactive, search],
    queryFn: () => listFn({ data: { table: config.table, includeInactive, search, searchColumns: config.searchColumns } }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-list", config.table] });

  const createMut = useMutation({
    mutationFn: (values: any) => createFn({ data: { table: config.table, values, module: config.module } }),
    onSuccess: () => { toast.success("Created"); setCreating(false); invalidate(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, values }: { id: string; values: any }) => updateFn({ data: { table: config.table, id, values, module: config.module } }),
    onSuccess: () => { toast.success("Updated"); setEditing(null); invalidate(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "inactive" }) => statusFn({ data: { table: config.table, id, status, module: config.module } }),
    onSuccess: () => { toast.success("Status updated"); setConfirmDeactivate(null); invalidate(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { table: config.table, id, module: config.module } }),
    onSuccess: () => { toast.success("Removed"); setConfirmDeactivate(null); invalidate(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const cols: ColumnDef[] = [
    ...config.columns,
    ...(config.hasStatus ? [{ key: "status", header: "Status", render: (r: any) => (
      <Badge variant={r.status === "active" ? "secondary" : "outline"}>{r.status}</Badge>
    ) }] : []),
    { key: "_actions", header: "", render: (r: any) => (
      <div className="flex justify-end gap-1">
        <Button size="icon" variant="ghost" onClick={() => setEditing(r)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
        {config.hasStatus ? (
          <Button size="icon" variant="ghost" onClick={() => setConfirmDeactivate(r)} aria-label={r.status === "active" ? "Deactivate" : "Reactivate"}>
            <Power className={r.status === "active" ? "h-4 w-4 text-destructive" : "h-4 w-4 text-primary"} />
          </Button>
        ) : config.hardDelete ? (
          <Button size="icon" variant="ghost" onClick={() => setConfirmDeactivate(r)} aria-label="Remove"><Trash2 className="h-4 w-4 text-destructive" /></Button>
        ) : null}
      </div>
    ) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{config.title}</h1>
          {config.description && <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-8 w-56" />
          </div>
          {config.hasStatus && (
            <div className="flex items-center gap-2 text-sm">
              <Switch checked={includeInactive} onCheckedChange={setIncludeInactive} id="inact" />
              <Label htmlFor="inact">Show inactive</Label>
            </div>
          )}
          <Button onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" />New</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>{cols.map((c) => <TableHead key={c.key}>{c.header}</TableHead>)}</TableRow>
            </TableHeader>
            <TableBody>
              {list.isLoading ? (
                <TableRow><TableCell colSpan={cols.length} className="p-8 text-center text-muted-foreground">Loading…</TableCell></TableRow>
              ) : (list.data ?? []).length === 0 ? (
                <TableRow><TableCell colSpan={cols.length} className="p-8 text-center text-muted-foreground">No records</TableCell></TableRow>
              ) : (
                (list.data ?? []).map((row: any) => (
                  <TableRow key={row.id}>
                    {cols.map((c) => <TableCell key={c.key}>{c.render ? c.render(row) : row[c.key]}</TableCell>)}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EntityForm
        open={creating}
        onClose={() => setCreating(false)}
        title={`Create ${config.title.replace(/s$/i, "")}`}
        fields={config.fields}
        onSubmit={(v) => createMut.mutateAsync(v)}
        submitting={createMut.isPending}
      />
      <EntityForm
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`Edit ${config.title.replace(/s$/i, "")}`}
        fields={config.fields}
        defaultValues={editing ?? undefined}
        onSubmit={(v) => updateMut.mutateAsync({ id: editing.id, values: v })}
        submitting={updateMut.isPending}
      />

      <AlertDialog open={!!confirmDeactivate} onOpenChange={(o) => !o && setConfirmDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {config.hardDelete ? "Remove record?" : confirmDeactivate?.status === "active" ? "Deactivate this record?" : "Reactivate this record?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {config.hardDelete
                ? "This will delete the association. This action is logged."
                : "History is preserved — the record is hidden from operational lists but remains in reports and audit."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirmDeactivate) return;
                if (config.hardDelete) deleteMut.mutate(confirmDeactivate.id);
                else statusMut.mutate({ id: confirmDeactivate.id, status: confirmDeactivate.status === "active" ? "inactive" : "active" });
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EntityForm({
  open, onClose, title, fields, defaultValues, onSubmit, submitting,
}: {
  open: boolean; onClose: () => void; title: string;
  fields: FieldDef[]; defaultValues?: any; onSubmit: (v: any) => Promise<any>; submitting: boolean;
}) {
  const schema = buildSchema(fields);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: fields.reduce((acc, f) => ({ ...acc, [f.name]: defaultValues?.[f.name] ?? "" }), {}),
    values: defaultValues ? fields.reduce((acc, f) => ({ ...acc, [f.name]: defaultValues[f.name] ?? "" }), {}) : undefined,
  });

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={form.handleSubmit(async (v) => {
            // Strip empty strings so nullable columns stay null
            const clean = Object.fromEntries(Object.entries(v).filter(([, val]) => val !== "" && val !== undefined));
            await onSubmit(clean);
          })}
          className="mt-6 space-y-4"
        >
          {fields.map((f) => <FieldInput key={f.name} f={f} form={form} />)}
          <SheetFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save"}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
