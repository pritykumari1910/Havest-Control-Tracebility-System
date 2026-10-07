import { createServerFn } from "@/lib/server-fn";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId, _role: "system_administrator",
    });
    return { isAdmin: !!data };
  });
