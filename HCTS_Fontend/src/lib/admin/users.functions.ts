import { createServerFn } from "@/lib/server-fn";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const APP_ROLES = [
  "system_administrator","operations_director","field_engineer","farm_manager",
  "manijero","collection_team","loading_team","administrative_team","reporting_user","read_only",
] as const;

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "system_administrator" });
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

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/lib/db");
    const sb = supabaseAdmin as any;
    const { data: profiles, error } = await sb
      .from("profiles").select("id, full_name, email, phone, status, created_at").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const { data: roles } = await sb.from("user_roles").select("user_id, role");
    const { data: authList } = await sb.auth.admin.listUsers({ perPage: 1000 });
    const authMap = new Map<string, any>((authList?.users ?? []).map((u: any) => [u.id, u]));
    return (profiles ?? []).map((p: any) => {
      const au = authMap.get(p.id);
      return {
        ...p,
        roles: (roles ?? []).filter((r: any) => r.user_id === p.id).map((r: any) => r.role),
        email_confirmed: !!au?.email_confirmed_at,
        last_sign_in_at: au?.last_sign_in_at ?? null,
      };
    });
  });

export const setUserRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; roles: string[] }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    for (const r of data.roles) if (!(APP_ROLES as readonly string[]).includes(r)) throw new Error(`Invalid role: ${r}`);
    const { supabaseAdmin } = await import("@/lib/db");
    const sb = supabaseAdmin as any;

    const { data: current } = await sb.from("user_roles").select("user_id, role");
    const admins = new Set((current ?? []).filter((r: any) => r.role === "system_administrator").map((r: any) => r.user_id));
    const willBeAdmin = data.roles.includes("system_administrator");
    if (admins.has(data.userId) && !willBeAdmin && admins.size === 1) {
      throw new Error("Cannot remove the last System Administrator.");
    }

    const { data: before } = await sb.from("user_roles").select("*").eq("user_id", data.userId);
    await sb.from("user_roles").delete().eq("user_id", data.userId);
    if (data.roles.length) {
      const rows = data.roles.map((role) => ({ user_id: data.userId, role, assigned_by: context.userId }));
      const { error } = await sb.from("user_roles").insert(rows);
      if (error) throw new Error(error.message);
    }
    await writeAudit(context.supabase as any, {
      module: "users", record_type: "user_roles", record_id: data.userId,
      action: "role_change",
      previous: (before ?? []).map((r: any) => r.role),
      next: data.roles,
    });
    return { ok: true };
  });

export const setUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; status: "active" | "inactive" }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/lib/db");
    const sb = supabaseAdmin as any;
    const { data: before } = await sb.from("profiles").select("*").eq("id", data.userId).single();
    const { error } = await sb.from("profiles").update({ status: data.status }).eq("id", data.userId);
    if (error) throw new Error(error.message);
    if (data.status === "inactive") {
      await sb.auth.admin.updateUserById(data.userId, { ban_duration: "876000h" });
    } else {
      await sb.auth.admin.updateUserById(data.userId, { ban_duration: "none" });
    }
    await writeAudit(context.supabase as any, {
      module: "users", record_type: "profiles", record_id: data.userId,
      action: data.status === "inactive" ? "deactivate" : "reactivate",
      previous: before, next: { ...before, status: data.status },
    });
    return { ok: true };
  });

export const sendPasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/lib/db");
    const sb = supabaseAdmin as any;
    const { error } = await sb.auth.admin.generateLink({ type: "recovery", email: data.email });
    if (error) throw new Error(error.message);
    await writeAudit(context.supabase as any, {
      module: "users", record_type: "auth", record_id: null,
      action: "password_reset_sent", previous: null, next: { email: data.email },
    });
    return { ok: true };
  });

export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; full_name?: string; roles: string[]; password?: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/lib/db");
    const sb = supabaseAdmin as any;

    let uid: string | undefined;
    let action = "invite";

    if (data.password && data.password.length > 0) {
      if (data.password.length < 8) throw new Error("Password must be at least 8 characters");
      const { data: created, error } = await sb.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: data.full_name },
      });
      if (error) throw new Error(error.message);
      uid = created.user?.id;
      action = "create_with_password";
    } else {
      const { data: created, error } = await sb.auth.admin.inviteUserByEmail(data.email, {
        data: { full_name: data.full_name },
      });
      if (error) throw new Error(error.message);
      uid = created.user?.id;
    }

    if (uid && data.roles.length) {
      await sb.from("user_roles").delete().eq("user_id", uid);
      await sb.from("user_roles").insert(data.roles.map((role) => ({ user_id: uid, role, assigned_by: context.userId })));
    }
    await writeAudit(context.supabase as any, {
      module: "users", record_type: "auth", record_id: uid ?? null,
      action, previous: null, next: { email: data.email, roles: data.roles },
    });
    return { ok: true, userId: uid };
  });

export const setUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; password: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (!data.password || data.password.length < 8) throw new Error("Password must be at least 8 characters");
    const { supabaseAdmin } = await import("@/lib/db");
    const sb = supabaseAdmin as any;
    const { error } = await sb.auth.admin.updateUserById(data.userId, {
      password: data.password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    await writeAudit(context.supabase as any, {
      module: "users", record_type: "auth", record_id: data.userId,
      action: "password_set_by_admin", previous: null, next: null,
    });
    return { ok: true };
  });

export const revokeUserSessions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/lib/db");
    const sb = supabaseAdmin as any;
    const { error } = await sb.auth.admin.signOut(data.userId, "global");
    if (error) throw new Error(error.message);
    await writeAudit(context.supabase as any, {
      module: "users", record_type: "auth", record_id: data.userId,
      action: "revoke_sessions", previous: null, next: null,
    });
    return { ok: true };
  });
