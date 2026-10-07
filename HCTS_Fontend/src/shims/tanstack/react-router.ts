import * as rr from 'react-router-dom';
export const Link = rr.Link;
export function useNavigate() { return rr.useNavigate(); }
export function useRouterState() { return { location: rr.useLocation() }; }
export function createFileRoute() { return () => null; }
export function createRootRouteWithContext() { return () => ({
  head: () => ({}),
  shellComponent: (p: any) => null,
  component: (p: any) => null,
}); }
export default {};
