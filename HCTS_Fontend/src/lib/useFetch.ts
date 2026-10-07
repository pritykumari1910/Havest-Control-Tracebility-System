import { useState, useEffect, useRef, useMemo } from "react";

export function useQuery(keyOrOptions: any, fn?: () => Promise<any>) {
  const [data, setData] = useState<any>(undefined);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const options = useMemo(() => {
    return typeof keyOrOptions === "object" && fn == null
      ? keyOrOptions
      : { queryKey: keyOrOptions, queryFn: fn } as any;
  }, [keyOrOptions, fn]);

  const queryFn = options.queryFn ?? (() => Promise.resolve(undefined));
  const queryKeyString = useMemo(() => {
    const queryKey = options.queryKey ?? keyOrOptions;
    try {
      return typeof queryKey === "string" ? queryKey : JSON.stringify(queryKey ?? []);
    } catch {
      return String(queryKey);
    }
  }, [options.queryKey, keyOrOptions]);

  useEffect(() => {
    let mounted = true;
    if (options.enabled === false) return;

    setLoading(true);

    (async () => {
      try {
        const res = await queryFn();
        if (mounted) setData(res?.data ?? res);
      } catch (err) {
        if (mounted) setError(err as any);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [queryKeyString, options.enabled]);

  return { data, isLoading, error };
}

export function useMutation(fn: (...args:any[]) => Promise<any>) {
  const [isLoading, setLoading] = useState(false);
  const mutate = async (...args:any[]) => {
    setLoading(true);
    try {
      const res = await fn(...args);
      return res;
    } finally { setLoading(false); }
  };
  return { mutate, mutateAsync: mutate, isLoading };
}

export function useQueryClient() {
  const ref = useRef({
    invalidateQueries: () => {},
    getQueryData: () => undefined,
    setQueryData: () => {},
    cancelQueries: () => {},
    clear: () => {},
  });
  return ref.current;
}

export default {};
