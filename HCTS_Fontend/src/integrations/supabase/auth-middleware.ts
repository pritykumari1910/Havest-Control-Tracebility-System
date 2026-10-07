export function requireSupabaseAuth(handler?: any) {
  // Return a middleware-compatible function or passthrough.
  // If used as `.middleware([requireSupabaseAuth])`, frameworks expecting a function will receive this.
  return handler ?? ((h:any) => h);
}

export default requireSupabaseAuth;
