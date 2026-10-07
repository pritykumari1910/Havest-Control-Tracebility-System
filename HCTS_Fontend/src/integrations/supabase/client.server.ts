export const supabaseAdmin = {
  from: () => ({ select: async () => ({ data: [], error: null }) }),
  rpc: async () => ({ data: null, error: null }),
};

export default supabaseAdmin;
