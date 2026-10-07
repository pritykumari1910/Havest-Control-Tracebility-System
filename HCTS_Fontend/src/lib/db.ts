// Simple adapter to replace Supabase client usage. Returns empty data by default.
export function from(_table: string) {
  return {
    select: async (..._args:any[]) => ({ data: [], error: null }),
    order() { return this; },
    eq() { return this; },
    in() { return this; },
    limit() { return this; },
    maybeSingle: async () => ({ data: null, error: null }),
    upsert: async (_payload?: any) => ({ data: null, error: null }),
  };
}

export const db = { from, auth: {
  signInWithPassword: async () => ({ data: null, error: null }),
  resetPasswordForEmail: async () => ({ data: null, error: null }),
  updateUser: async () => ({ data: null, error: null }),
  signOut: async () => ({ error: null }),
  getUser: async () => ({ data: null, error: null }),
}};

export const supabaseAdmin = db;

export default db;
