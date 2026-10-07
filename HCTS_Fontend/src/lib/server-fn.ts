// Minimal client-side replacement for @tanstack/react-start's useServerFn and createServerFn
export function useServerFn(fn: (...args:any[]) => Promise<any>) {
  return { mutateAsync: async (...args:any[]) => await fn(...args), isLoading: false };
}

export function createServerFn(_: any) {
  const wrapper: any = {
    middleware() {
      return wrapper;
    },
    inputValidator() {
      return wrapper;
    },
    handler(fn: (...args:any[]) => any) {
      return fn;
    },
  };
  return wrapper;
}

export default {};
