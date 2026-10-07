export function useQuery() { return { data: undefined, isLoading: false, error: null }; }
export function useMutation() { return () => ({ mutate: () => {}, mutateAsync: async () => {}, isLoading: false }); }
export function useQueryClient() { return { invalidateQueries: () => {}, getQueryData: () => undefined, setQueryData: () => {} }; }
export default {};
