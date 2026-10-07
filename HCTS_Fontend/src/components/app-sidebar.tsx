import { Link, useRouterState } from "@/lib/router-compat";
import {
  LayoutDashboard, Users, MapPin, Wheat, Package, Truck, QrCode,
  ClipboardList, Activity, Building2, Settings, LineChart, FileText, Shield, Warehouse,
  Radio, GitCompareArrows, Boxes, Send, ScanSearch, BarChart3, TrendingUp,
  Sprout, UserCheck, PieChart, ClipboardCheck, History, DollarSign, Coins, Award, BellRing, UserCircle,
  Wrench, Replace, Scale, MapPinned, Handshake, Receipt, FileBarChart,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { useLang } from "@/i18n";

type Item = { title: string; url: string; icon: React.ComponentType<{ className?: string }>; roles?: AppRole[] };
type Group = [string, Item[]];

// ---------- Admin / default nav (unchanged) ----------
const overview: Item[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["system_administrator","operations_director","field_engineer","farm_manager","manijero","collection_team","loading_team","administrative_team","reporting_user","read_only"] },
];

const admin: Item[] = [
  { title: "Users & Roles", url: "/admin/users", icon: Users, roles: ["system_administrator"] },
  { title: "Roles & Permissions", url: "/admin/permissions", icon: Shield, roles: ["system_administrator"] },
  { title: "Campaigns", url: "/admin/campaigns", icon: Shield, roles: ["system_administrator","operations_director","field_engineer"] },
  { title: "Farms & Geography", url: "/admin/geography", icon: MapPin, roles: ["system_administrator","operations_director","field_engineer"] },
  { title: "Varieties", url: "/admin/varieties", icon: Wheat, roles: ["system_administrator","operations_director","field_engineer"] },
  { title: "Companies & Workers", url: "/admin/workers", icon: Building2, roles: ["system_administrator","operations_director","field_engineer"] },
  { title: "Machines & Operators", url: "/admin/machines", icon: Warehouse, roles: ["system_administrator","operations_director","field_engineer"] },
  { title: "Buyers & Transport", url: "/admin/commercial", icon: Truck, roles: ["system_administrator","operations_director","field_engineer"] },
  { title: "System Parameters", url: "/admin/parameters", icon: Settings, roles: ["system_administrator","operations_director","field_engineer"] },
];

const qr: Item[] = [
  { title: "QR Series", url: "/qr/series", icon: QrCode, roles: ["system_administrator","operations_director","field_engineer"] },
  { title: "QR Inventory", url: "/qr/inventory", icon: Package, roles: ["system_administrator","operations_director","field_engineer"] },
];

const operations: Item[] = [
  { title: "Daily Crews", url: "/ops/crews", icon: Users, roles: ["system_administrator","farm_manager","manijero","operations_director","field_engineer"] },
  { title: "Harvest Assignments", url: "/ops/assignments", icon: ClipboardList, roles: ["system_administrator","farm_manager","manijero","operations_director","field_engineer"] },
  // { title: "Reception & Pallets", url: "/ops/reception", icon: Activity, roles: ["system_administrator","collection_team","operations_director","field_engineer"] },
  // { title: "Dispatch Notes", url: "/ops/dispatch", icon: FileText, roles: ["system_administrator","loading_team","operations_director","field_engineer"] },
  // { title: "Transfer Orders", url: "/ops/transfers", icon: Truck, roles: ["system_administrator","loading_team","operations_director","field_engineer"] },
  // { title: "Unassigned Bins", url: "/ops/unassigned", icon: Package, roles: ["system_administrator","field_engineer","farm_manager"] },
];

const insights: Item[] = [
  // { title: "Harvest Progress", url: "/reports/progress", icon: LineChart, roles: ["system_administrator","operations_director","field_engineer","reporting_user","read_only","administrative_team"] },
  // { title: "Dispatch Reports", url: "/reports/dispatch", icon: Truck, roles: ["system_administrator","operations_director","field_engineer","reporting_user","loading_team","administrative_team","read_only"] },
  // { title: "Pallet Traceability", url: "/reports/traceability", icon: QrCode, roles: ["system_administrator","operations_director","field_engineer","reporting_user","read_only","administrative_team"] },
  { title: "Satellite Staff", url: "/reports/satellite", icon: Users, roles: ["system_administrator","operations_director","field_engineer","reporting_user","read_only","administrative_team"] },
  { title: "Forecasts", url: "/reports/forecasts", icon: LineChart, roles: ["system_administrator","operations_director","field_engineer","reporting_user","read_only","administrative_team"] },
  // { title: "Forecast Approvals", url: "/reports/forecasts/approvals", icon: Shield, roles: ["operations_director"] },
  // { title: "Economic Dashboard", url: "/reports/economic", icon: LineChart, roles: ["operations_director","administrative_team"] },
  { title: "Audit Log", url: "/reports/audit", icon: Shield, roles: ["system_administrator","operations_director","field_engineer","reporting_user"] },
];

// ---------- Operations Director nav ----------
const odGroups: Group[] = [
  // ["Overview", [
  //   { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  // ]],
  // ["Operations", [
  //   { title: "Live Operations", url: "/ops/live", icon: Radio },
  //   { title: "Harvest Progress", url: "/reports/progress", icon: LineChart },
  //   { title: "Forecast vs Actual", url: "/reports/forecast-vs-actual", icon: GitCompareArrows },
  //   { title: "Collection Point Status", url: "/ops/collection-points", icon: Boxes },
  //   { title: "Dispatch Status", url: "/reports/dispatch-status", icon: Send },
  // ]],
  // ["Traceability", [
  //   { title: "Pallet Bin Traceability", url: "/reports/traceability", icon: QrCode },
  //   { title: "QR Search", url: "/reports/qr-search", icon: ScanSearch },
  // ]],
  // ["Reports", [
  //   { title: "Harvest Reports", url: "/reports/harvest-report", icon: BarChart3 },
  //   { title: "Farm Performance", url: "/reports/farm-performance", icon: TrendingUp },
  //   { title: "Variety Performance", url: "/reports/variety-performance", icon: Sprout },
  //   { title: "Crew Performance", url: "/reports/crew-performance", icon: ClipboardList },
  //   { title: "Worker Productivity", url: "/reports/worker-productivity", icon: UserCheck },
  //   { title: "Satellite Staff Report", url: "/reports/satellite", icon: Users },
  //   { title: "Dispatch Reports", url: "/reports/dispatch", icon: Truck },
  // ]],
  // ["Forecast", [
  //   { title: "Forecast Review", url: "/reports/forecasts", icon: PieChart },
  //   { title: "Forecast Approval", url: "/reports/forecasts/approvals", icon: ClipboardCheck },
  //   { title: "Forecast History", url: "/reports/forecasts/history", icon: History },
  // ]],
  // ["Economics", [
  //   { title: "Price Dashboard", url: "/reports/price-dashboard", icon: DollarSign },
  //   { title: "Liquidation Summary", url: "/reports/liquidation-summary", icon: Coins },
  //   { title: "Incentive Dashboard", url: "/reports/incentive-dashboard", icon: Award },
  // ]],
  // ["Audit & Compliance", [
  //   { title: "Audit Trail", url: "/reports/audit", icon: Shield },
  //   { title: "Operational Changes", url: "/reports/operational-changes", icon: FileText },
  // ]],

  // ["Personal", [
  //   { title: "Notifications", url: "/notifications", icon: BellRing },
  //   { title: "Profile", url: "/profile", icon: UserCircle },
  // ]],
];

// ---------- Field Engineer nav ----------
const feGroups: Group[] = [
  // ["Overview", [
  //   { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  // ]],
  // ["Operations", [
  //   { title: "Live Operations", url: "/ops/live", icon: Radio },
  //   { title: "Harvest Progress", url: "/reports/progress", icon: LineChart },
  //   { title: "Collection Point Status", url: "/ops/collection-points", icon: Boxes },
  //   { title: "Dispatch Status", url: "/reports/dispatch-status", icon: Send },
  // ]],
  // ["Operational Review", [
  //   { title: "Closed Record Corrections", url: "/ops/corrections", icon: Wrench },
  //   { title: "Unassigned Bin Queue", url: "/ops/unassigned", icon: Package },
  //   { title: "Variety Change Review", url: "/ops/variety-changes", icon: Replace },
  // ]],
  // ["Traceability", [
  //   { title: "Pallet Bin Traceability", url: "/reports/traceability", icon: QrCode },
  //   { title: "QR Search", url: "/reports/qr-search", icon: ScanSearch },
  // ]],
  // ["Reports", [
  //   { title: "Harvest Reports", url: "/reports/harvest-report", icon: BarChart3 },
  //   { title: "Worker Productivity", url: "/reports/worker-productivity", icon: UserCheck },
  //   { title: "Crew Performance", url: "/reports/crew-performance", icon: ClipboardList },
  //   { title: "Farm Performance", url: "/reports/farm-performance", icon: TrendingUp },
  //   { title: "Variety Performance", url: "/reports/variety-performance", icon: Sprout },
  // ]],
  // ["Audit", [
  //   { title: "Audit History", url: "/reports/audit", icon: Shield },
  //   { title: "Operational Corrections", url: "/reports/operational-changes", icon: History },
  // ]],
  // ["Personal", [
  //   { title: "Notifications", url: "/notifications", icon: BellRing },
  //   { title: "Profile", url: "/profile", icon: UserCircle },
  // ]],
];

// ---------- Reporting User nav (read-only) ----------
const ruGroups: Group[] = [
  // ["Overview", [
  //   { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  // ]],
  // ["Operations", [
  //   { title: "Harvest Progress", url: "/reports/progress", icon: LineChart },
  //   { title: "Live Operations", url: "/ops/live", icon: Radio },
  //   { title: "Collection Point Status", url: "/ops/collection-points", icon: Boxes },
  //   { title: "Dispatch Status", url: "/reports/dispatch-status", icon: Send },
  // ]],
  // ["Traceability", [
  //   { title: "Pallet Bin Traceability", url: "/reports/traceability", icon: QrCode },
  //   { title: "QR Search", url: "/reports/qr-search", icon: ScanSearch },
  // ]],
  // ["Reports", [
  //   { title: "Harvest Reports", url: "/reports/harvest-report", icon: BarChart3 },
  //   { title: "Crew Performance", url: "/reports/crew-performance", icon: ClipboardList },
  //   { title: "Worker Productivity", url: "/reports/worker-productivity", icon: UserCheck },
  //   { title: "Farm Performance", url: "/reports/farm-performance", icon: TrendingUp },
  //   { title: "Variety Performance", url: "/reports/variety-performance", icon: Sprout },
  //   { title: "Satellite Staff Report", url: "/reports/satellite", icon: Users },
  //   { title: "Dispatch Summary", url: "/reports/dispatch", icon: Truck },
  // ]],
  // ["Personal", [
  //   { title: "Notifications", url: "/notifications", icon: BellRing },
  //   { title: "Profile", url: "/profile", icon: UserCircle },
  // ]],
];

// ---------- Administrative Team nav (commercial) ----------
const atGroups: Group[] = [
  // ["Overview", [
  //   { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  // ]],
  // ["Commercial Operations", [
  //   { title: "Buyer Delivery Notes", url: "/commercial/buyer-delivery-notes", icon: FileText },
  //   { title: "Weight Reconciliation", url: "/commercial/weight-reconciliation", icon: Scale },
  //   { title: "Commercial Classification", url: "/commercial/classification", icon: ClipboardCheck },
  //   { title: "Liquidation Management", url: "/commercial/liquidation", icon: Coins },
  //   { title: "Settlement Summary", url: "/commercial/settlement", icon: Handshake },
  // ]],
  // ["Dispatch", [
  //   { title: "Dispatch Notes", url: "/commercial/dispatch-notes", icon: Send },
  //   { title: "Shipment Tracking", url: "/commercial/shipment-tracking", icon: MapPinned },
  //   { title: "Buyer Deliveries", url: "/commercial/buyer-deliveries", icon: Truck },
  // ]],
  // ["Reports", [
  //   { title: "Buyer Reports", url: "/commercial/reports-buyer", icon: Users },
  //   { title: "Weight Difference Report", url: "/commercial/reports-weight-difference", icon: Scale },
  //   { title: "Classification Report", url: "/commercial/reports-classification", icon: FileBarChart },
  //   { title: "Liquidation Report", url: "/commercial/reports-liquidation", icon: Receipt },
  //   { title: "Settlement Report", url: "/commercial/reports-settlement", icon: BarChart3 },
  // ]],
  // ["Personal", [
  //   { title: "Notifications", url: "/notifications", icon: BellRing },
  //   { title: "Profile", url: "/profile", icon: UserCircle },
  // ]],
];

// ---------- Read-Only User nav (view-only, flat list, no create/edit/delete) ----------
const roGroups: Group[] = [
  // ["Overview", [
  //   { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  // ]],
  // ["Operations", [
  //   { title: "Harvest Progress", url: "/reports/progress", icon: LineChart },
  //   { title: "Live Operations", url: "/ops/live", icon: Radio },
  //   { title: "Collection Point Status", url: "/ops/collection-points", icon: Boxes },
  //   { title: "Dispatch Status", url: "/reports/dispatch-status", icon: Send },
  // ]],
  // ["Traceability", [
  //   { title: "Pallet Bin Traceability", url: "/reports/traceability", icon: QrCode },
  //   { title: "QR Search", url: "/reports/qr-search", icon: ScanSearch },
  // ]],
  // ["Reports", [
  //   { title: "Harvest Reports", url: "/reports/harvest-report", icon: BarChart3 },
  //   { title: "Crew Performance", url: "/reports/crew-performance", icon: ClipboardList },
  //   { title: "Worker Productivity", url: "/reports/worker-productivity", icon: UserCheck },
  //   { title: "Farm Performance", url: "/reports/farm-performance", icon: TrendingUp },
  //   { title: "Variety Performance", url: "/reports/variety-performance", icon: Sprout },
  //   { title: "Satellite Staff Report", url: "/reports/satellite", icon: Users },
  // ]],
  // ["Personal", [
  //   { title: "Notifications", url: "/notifications", icon: BellRing },
  //   { title: "Profile", url: "/profile", icon: UserCircle },
  // ]],
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { roles } = useAuth();
  const { t } = useLang();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const isAdmin = roles.includes("system_administrator");
  const isOD = roles.includes("operations_director") && !isAdmin;
  const isFE = roles.includes("field_engineer") && !isAdmin && !isOD;
  const isAT = roles.includes("administrative_team") && !isAdmin && !isOD && !isFE;
  const isRU = roles.includes("reporting_user") && !isAdmin && !isOD && !isFE && !isAT;
  const isRO = !isAdmin && !isOD && !isFE && !isAT && !isRU &&
    (roles.includes("read_only") || roles.length === 0);

  let groups: Group[];
  // if (isOD) {
  //   groups = odGroups;
  // } else if (isFE) {
  //   groups = feGroups;
  // } else if (isAT) {
  //   groups = atGroups;
  // } else if (isRU) {
  //   groups = ruGroups;
  // } else if (isRO) {
  //   groups = roGroups;
  // } else {
    const filterByRole = (items: Item[]) =>
      items.filter((i) => !i.roles || i.roles.some((r) => roles.includes(r)));
    groups = [
      ["Overview", filterByRole(overview)],
      ["Administration", filterByRole(admin)],
      ["QR Management", filterByRole(qr)],
      ["Operations", filterByRole(operations)],
      // ["Insights & Audit", filterByRole(insights)],
      ["Reports & Audit", filterByRole(insights)],

    ];
  // }

  const roleKey = isOD ? "Operations Director" : isFE ? "Field Engineer" : isAT ? "Administrative" : isRU ? "Reporting" : isRO ? "Viewer" : "Farms";
  const footerKey = isOD ? "Executive Workspace" : isFE ? "Field Operations" : isAT ? "Commercial Workspace" : isRU ? "Monitoring Portal" : isRO ? "Read-Only Access" : "Harvest Traceability";
  const roleLabel = t(`role.${roleKey}`, roleKey);
  const footerLabel = t(`footer.${footerKey}`, footerKey);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-3 px-2 py-1">
          <img src="/qultiva-logo.png" alt="Qultiva Farms" className="h-8 w-8 shrink-0" />
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-display text-sm font-semibold tracking-wide text-sidebar-foreground">QULTIVA</div>
              <div className="text-[9px] uppercase tracking-[0.25em] text-sidebar-foreground/60">
                {roleLabel}
              </div>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {groups.map(([label, items]) => items.length === 0 ? null : (
          <SidebarGroup key={label}>
            <SidebarGroupLabel>{t(`sb.${label}`, label)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const active = pathname === item.url || pathname.startsWith(item.url + "/");
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={active}>
                        <Link to={item.url} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{t(`nav.${item.title}`, item.title)}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && (
          <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-sidebar-foreground font-bold">
            {footerLabel}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
