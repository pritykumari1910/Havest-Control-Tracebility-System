export const supabase = {
  from: (table: string) => ({
    select: async (..._args: any[]) => ({ data: [], error: null }),
    order: function() { return this; },
    eq: function() { return this; },
    in: function() { return this; },
    limit: function() { return this; },
    maybeSingle: async function() { return { data: null, error: null }; },
  }),
  auth: {
    signInWithPassword: async () => ({ data: null, error: null }),
    resetPasswordForEmail: async () => ({ data: null, error: null }),
    updateUser: async () => ({ data: null, error: null }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ data: null, error: null }),
  },
  rpc: async () => ({ data: null, error: null }),
};

export default supabase;
