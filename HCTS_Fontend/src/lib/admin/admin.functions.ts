import { createServerFn } from "@/lib/server-fn";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const ADMIN_TABLES = [
  "campaigns", "farms", "plots", "valves", "parks",
  "varieties", "plot_varieties",
  "employment_companies", "workers", "satellite_roles",
  "machines", "machine_operators",
  "buyers", "destination_centres", "transport_providers",
  "operational_parameters",
] as const;
export type AdminTable = (typeof ADMIN_TABLES)[number];

function assertTable(t: string): AdminTable {
  if (!(ADMIN_TABLES as readonly string[]).includes(t)) throw new Error(`Table not allowed: ${t}`);
  return t as AdminTable;
}

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "system_administrator" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: system administrator role required");
}

async function writeAudit(supabase: any, args: {
  module: string; record_type: string; record_id: string | null;
  action: string; previous: any; next: any; reason?: string;
}) {
  const params: any = {
    _module: args.module, _record_type: args.record_type, _record_id: args.record_id,
    _action: args.action, _previous: args.previous, _new: args.next,
  };
  if (args.reason) params._reason = args.reason;
  await supabase.rpc("write_audit", params);
}

export const adminListRecords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { table: string; includeInactive?: boolean; search?: string; searchColumns?: string[] }) => d)
  .handler(async ({ data, context }) => {
    const table = assertTable(data.table);
    const sb = context.supabase as any;
    let query = sb.from(table).select("*");
    if (!data.includeInactive) {
      const probe = await sb.from(table).select("*").eq("status", "active");
      if (!probe.error) {
        return probe.data ?? [];
      }
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    let result = rows ?? [];
    if (data.search && data.searchColumns?.length) {
      const s = data.search.toLowerCase();
      result = result.filter((r: any) =>
        data.searchColumns!.some((c) => String(r[c] ?? "").toLowerCase().includes(s))
      );
    }
    return result;
  });

export const adminCreateRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { table: string; values: Record<string, any>; module: string }) => d)
  .handler(async ({ data, context }) => {
    const table = assertTable(data.table);
    await assertAdmin(context.supabase, context.userId);
    const sb = context.supabase as any;
    const { data: row, error } = await sb.from(table).insert(data.values).select().single();
    if (error) throw new Error(error.message);
    await writeAudit(sb, { module: data.module, record_type: table, record_id: row.id, action: "create", previous: null, next: row });
    return row;
  });

export const adminUpdateRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { table: string; id: string; values: Record<string, any>; module: string; reason?: string }) => d)
  .handler(async ({ data, context }) => {
    const table = assertTable(data.table);
    await assertAdmin(context.supabase, context.userId);
    const sb = context.supabase as any;
    const { data: before } = await sb.from(table).select("*").eq("id", data.id).single();
    const { data: row, error } = await sb.from(table).update(data.values).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);
    await writeAudit(sb, { module: data.module, record_type: table, record_id: data.id, action: "update", previous: before, next: row, reason: data.reason });
    return row;
  });

export const adminSetStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { table: string; id: string; status: "active" | "inactive"; module: string; reason?: string }) => d)
  .handler(async ({ data, context }) => {
    const table = assertTable(data.table);
    await assertAdmin(context.supabase, context.userId);
    const sb = context.supabase as any;
    const { data: before } = await sb.from(table).select("*").eq("id", data.id).single();
    const { data: row, error } = await sb.from(table).update({ status: data.status }).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);
    await writeAudit(sb, {
      module: data.module, record_type: table, record_id: data.id,
      action: data.status === "inactive" ? "deactivate" : "reactivate",
      previous: before, next: row, reason: data.reason,
    });
    return row;
  });

export const adminDeleteRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { table: string; id: string; module: string }) => d)
  .handler(async ({ data, context }) => {
    const table = assertTable(data.table);
    await assertAdmin(context.supabase, context.userId);
    const sb = context.supabase as any;
    const { data: before } = await sb.from(table).select("*").eq("id", data.id).single();
    const { error } = await sb.from(table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await writeAudit(sb, { module: data.module, record_type: table, record_id: data.id, action: "delete", previous: before, next: null });
    return { ok: true };
  });
