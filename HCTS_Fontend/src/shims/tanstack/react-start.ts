export function useServerFn(fn:any) {
  // Return a simple wrapper that calls the function directly in the client.
  return { mutateAsync: async (...args:any[]) => await fn(...args), isLoading: false };
}

export default {};
