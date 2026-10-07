import { createServerFn } from "@/lib/server-fn";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "system_administrator" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: system administrator role required");
}

async function writeAudit(supabase: any, args: {
  record_type: string; record_id: string | null; action: string;
  previous: any; next: any; reason?: string;
}) {
  const params: any = {
    _module: "qr", _record_type: args.record_type, _record_id: args.record_id,
    _action: args.action, _previous: args.previous, _new: args.next,
  };
  if (args.reason) params._reason = args.reason;
  await supabase.rpc("write_audit", params);
}

const MAX_QRS = 10000;

function buildCode(prefix: string, start: number, i: number, pad: number) {
  return `${prefix}${String(start + i).padStart(pad, "0")}`;
}

export const qrCreateSeries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    name: string; code: string; prefix: string;
    start: number; count: number; pad?: number;
    printer_name?: string; comments?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const sb = context.supabase as any;
    const pad = data.pad ?? 6;

    if (!data.name || !data.code) throw new Error("Name and code are required");
    if (data.count < 1) throw new Error("Count must be at least 1");
    if (data.count > MAX_QRS) throw new Error(`Count exceeds max of ${MAX_QRS}`);
    if (data.start < 0) throw new Error("Start must be ≥ 0");

    // Uniqueness of series name/code
    const { data: dup } = await sb.from("qr_series").select("id,name,code").or(`name.eq.${data.name},code.eq.${data.code}`);
    if (dup && dup.length) throw new Error("A series with this name or code already exists");

    const initial_code = buildCode(data.prefix, data.start, 0, pad);
    const final_code = buildCode(data.prefix, data.start, data.count - 1, pad);

    // Overlap check: any existing qr_codes with codes we'd generate
    // Sample: check first, last, and mid
    const sample = [initial_code, final_code, buildCode(data.prefix, data.start, Math.floor(data.count / 2), pad)];
    const { data: overlap } = await sb.from("qr_codes").select("code").in("code", sample);
    if (overlap && overlap.length) throw new Error(`QR code range overlaps existing codes (e.g. ${overlap[0].code})`);

    // Create series
    const { data: series, error: sErr } = await sb.from("qr_series").insert({
      name: data.name, code: data.code,
      initial_code, final_code, total_qrs: data.count,
      printer_name: data.printer_name ?? null,
      comments: data.comments ?? null,
      created_by: context.userId,
      status: "generated",
    }).select().single();
    if (sErr) throw new Error(sErr.message);

    // Batch insert codes
    const BATCH = 500;
    for (let i = 0; i < data.count; i += BATCH) {
      const rows: { series_id: string; code: string; status: string }[] = [];
      for (let j = i; j < Math.min(i + BATCH, data.count); j++) {
        rows.push({ series_id: series.id, code: buildCode(data.prefix, data.start, j, pad), status: "generated" });
      }
      const { error: iErr } = await sb.from("qr_codes").insert(rows);
      if (iErr) {
        await sb.from("qr_series").delete().eq("id", series.id);
        throw new Error(`Insert failed at batch ${i}: ${iErr.message}`);
      }
    }

    await writeAudit(sb, { record_type: "qr_series", record_id: series.id, action: "create", previous: null, next: series });
    return series;
  });

const ALLOWED: Record<string, string[]> = {
  draft: ["sent_to_printer", "cancelled"],
  generated: ["sent_to_printer", "cancelled"],
  sent_to_printer: ["received", "cancelled"],
  received: ["active", "cancelled"],
  active: ["exhausted", "cancelled"],
  exhausted: [],
  cancelled: [],
};

export const qrTransitionSeries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; to: string; printer_name?: string; reason?: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const sb = context.supabase as any;
    const { data: before, error: bErr } = await sb.from("qr_series").select("*").eq("id", data.id).single();
    if (bErr) throw new Error(bErr.message);
    if (!ALLOWED[before.status]?.includes(data.to)) {
      throw new Error(`Cannot transition from ${before.status} to ${data.to}`);
    }
    const patch: any = { status: data.to };
    const now = new Date().toISOString();
    if (data.to === "sent_to_printer") { patch.sent_to_printer_at = now; if (data.printer_name) patch.printer_name = data.printer_name; }
    if (data.to === "received") patch.received_at = now;
    if (data.to === "active") patch.activated_at = now;

    const { data: row, error } = await sb.from("qr_series").update(patch).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);

    // Cascade qr_codes status where sensible
    if (data.to === "active") {
      await sb.from("qr_codes").update({ status: "available" }).eq("series_id", data.id).eq("status", "generated");
    } else if (data.to === "cancelled") {
      await sb.from("qr_codes").update({ status: "cancelled" }).eq("series_id", data.id).in("status", ["generated", "available"]);
    }

    await writeAudit(sb, { record_type: "qr_series", record_id: data.id, action: `transition_${data.to}`, previous: before, next: row, reason: data.reason });
    return row;
  });

export const qrUpdateSeries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; values: { name?: string; printer_name?: string; comments?: string } }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const sb = context.supabase as any;
    const { data: before } = await sb.from("qr_series").select("*").eq("id", data.id).single();
    const { data: row, error } = await sb.from("qr_series").update(data.values).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);
    await writeAudit(sb, { record_type: "qr_series", record_id: data.id, action: "update", previous: before, next: row });
    return row;
  });

export const qrGetSeriesCodes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { seriesId: string }) => d)
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const { data: rows, error } = await sb.from("qr_codes").select("code,status,created_at").eq("series_id", data.seriesId).order("code");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const qrSetCodeStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: string; reason?: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const sb = context.supabase as any;
    const { data: before } = await sb.from("qr_codes").select("*").eq("id", data.id).single();
    if (before?.status === "used") throw new Error("Cannot change status of a used QR");
    const { data: row, error } = await sb.from("qr_codes").update({ status: data.status }).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);
    await writeAudit(sb, { record_type: "qr_codes", record_id: data.id, action: `code_${data.status}`, previous: before, next: row, reason: data.reason });
    return row;
  });

export const qrInventoryStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { seriesId?: string }) => d)
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    let q = sb.from("qr_codes").select("status");
    if (data.seriesId) q = q.eq("series_id", data.seriesId);
    const { data: rows, error } = await q.limit(50000);
    if (error) throw new Error(error.message);
    const counts: Record<string, number> = {};
    for (const r of rows ?? []) counts[r.status] = (counts[r.status] ?? 0) + 1;
    return counts;
  });
