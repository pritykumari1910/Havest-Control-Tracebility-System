import { Link as RRLink, useNavigate as useRRNavigate, useLocation } from "react-router-dom";

export function createFileRoute(_path: string) {
  return (opts: any) => opts || {};
}

export const Link = RRLink;

export function useNavigate() {
  return useRRNavigate();
}

export function useRouterState<T = any>(opts?: { select?: (state: { location: ReturnType<typeof useLocation>; pathname: string }) => T }) {
  const loc = useLocation();
  const state = { location: loc, pathname: loc.pathname };
  return opts?.select ? opts.select(state) : (state as any);
}

export default {};

