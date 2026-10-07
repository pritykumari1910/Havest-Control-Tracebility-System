import { useEffect, useState } from "react";
// import { useNavigate, Link } from "@/lib/router-compat";
import { useQuery, useQueryClient } from "@/lib/useFetch";
import { axiosInstance } from "@/utils/axios/axiosInstance";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { ROLE_LABELS } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Bell, LogOut, Search, User as UserIcon, Calendar, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { LanguageToggle } from "@/components/language-toggle";
import { useLang } from "@/i18n";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clear_user_info, set_active_role } from "@/redux/slices/authSlice";
import { signOut as apiSignOut } from "@/apis/auth";
import { getAllCampaigns, ACTIVE_CAMPAIGN_REFRESH_EVENT } from "@/apis/campaigns";
import { useDashboardRealtime } from "@/hooks/useDashboardRealtime";

export function AppHeader() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, roles, allRoles } = useAuth();
  useRoles();
  useDashboardRealtime()
  const { t } = useLang();
  const dispatch=useDispatch();

  // Bumped whenever a campaign is created/updated elsewhere so the query key
  // changes and the active-campaign lookup re-runs (this useQuery only refetches
  // on key change — it has no cache/invalidation).
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [campaignRefreshKey, setCampaignRefreshKey] = useState(0);
  useEffect(() => {
    const handler = () => setCampaignRefreshKey((k) => k + 1);
    window.addEventListener(ACTIVE_CAMPAIGN_REFRESH_EVENT, handler);
    return () => window.removeEventListener(ACTIVE_CAMPAIGN_REFRESH_EVENT, handler);
  }, []);

  const { data: activeCampaign } = useQuery({
    queryKey: ["active-campaign", campaignRefreshKey],
    queryFn: async () => {
      const res = await getAllCampaigns({ status: "active", limit: 1 });
      const list = res?.responseObject?.campaigns ?? res?.responseObject ?? res?.data ?? [];
      const campaign = Array.isArray(list) ? list[0] : list;
      return campaign ?? null;
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
    staleTime: 0,
  });

  // Notification count: pending forecasts + open dispatches (proxy).
  const { data: alerts } = useQuery({
    queryKey: ["header-alerts"],
    enabled: !!user,
    refetchInterval: 30000,
    queryFn: async () => {
      // const [pendingRes, incidentsRes] = await Promise.all([
      //   axiosInstance.get("/counts/forecasts?status=draft"),
      //   axiosInstance.get("/counts/pallet_incidents"),
      // ]);
      // return {
      //   pending: pendingRes?.data?.data?.count ?? 0,
      //   incidents: incidentsRes?.data?.data?.count ?? 0,
      // };
      return {
        pending: 0,
        incidents: 0,
      };
    },
  });

  useEffect(() => {
    if (!user) return;
    // If the backend supports server-sent events / websockets for campaign updates,
    // replace below with a subscription. For now, fall back to polling via react-query.
    return undefined;
  }, [user, qc]);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    try {
      // attempt server-side logout
      await apiSignOut();
    } catch (e) {
      // ignore API errors but continue clearing local state
      console.warn("signOut API failed", e);
    }

    // // Clear local tokens and notify listeners
    // localStorage.removeItem("accesstoken");
    // localStorage.removeItem("refreshtoken");
    // window.dispatchEvent(new CustomEvent("hcts-auth-changed"));

    // Clear react-query cache and reset redux auth slice
    qc.clear();
    toast.success(t("header.signed.out"));
    dispatch(clear_user_info());
    // trigger global redux reset handled by rootReducerWithClear
    dispatch({ type: "hcts/clearReduxState" });

    navigate("/");
  }

  const primaryRole = roles[0];
  const notificationTotal = (alerts?.pending ?? 0) + (alerts?.incidents ?? 0);
  const today = new Date().toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
      {/* Campaign chip */}
      <div className="hidden min-w-0 items-center gap-2 text-sm md:flex">
        {activeCampaign ? (
          <>
            <span className="shrink-0 text-muted-foreground">{t("header.campaign")}</span>
            <Badge variant="secondary" className="max-w-[220px] truncate font-medium">
              {[ activeCampaign.campaignName].filter(Boolean).join(" · ")}
            </Badge>
          </>
        ) : (
          <Badge variant="outline">{t("header.no.campaign")}</Badge>
        )}
      </div>

      {/* Date */}
      <div className="hidden items-center gap-1.5 rounded-md border border-border/60 px-2.5 py-1 text-xs text-muted-foreground lg:flex">
        <Calendar className="h-3.5 w-3.5" />
        <span className="tabular-nums">{today}</span>
      </div>

      {/* Global search */}
      <div className="relative ml-auto hidden max-w-sm flex-1 md:block">
        {/* <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t("header.search")}
          className="h-9 pl-8"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.currentTarget as HTMLInputElement).value.trim()) {
              navigate({ to: "/reports/traceability" });
            }
          }}
        /> */}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
        <LanguageToggle className="hidden sm:inline-flex" />
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label={t("header.notifications")}>
              <Bell className="h-4 w-4" />
              {notificationTotal > 0 && (
                <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                  {notificationTotal > 9 ? "9+" : notificationTotal}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>{t("header.notifications")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {alerts && alerts.pending > 0 && (
              <DropdownMenuItem asChild>
                <Link to="/reports/forecasts/approvals" className="flex justify-between">
                  <span>{t("header.notifications.forecasts")}</span>
                  <Badge variant="secondary">{alerts.pending}</Badge>
                </Link>
              </DropdownMenuItem>
            )}
            {alerts && alerts.incidents > 0 && (
              <DropdownMenuItem asChild>
                <Link to="/ops/reception" className="flex justify-between">
                  <span>{t("header.notifications.incidents")}</span>
                  <Badge variant="secondary">{alerts.incidents}</Badge>
                </Link>
              </DropdownMenuItem>
            )}
            {notificationTotal === 0 && (
              <div className="px-2 py-6 text-center text-xs text-muted-foreground">{t("header.notifications.none")}</div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/notifications">{t("header.notifications.viewall")}</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}




        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 pl-1.5 pr-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/10 text-[11px] font-medium text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left text-xs leading-tight sm:block">
                <div className="max-w-[140px] truncate font-medium">{user?.email}</div>
                <div className="text-muted-foreground">{primaryRole ? ROLE_LABELS[primaryRole] : t("header.no.role")}</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="text-sm font-medium">{user?.email}</div>
              <div className="text-xs font-normal text-muted-foreground">
                {primaryRole ? ROLE_LABELS[primaryRole] : t("header.no.role.assigned")}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">
                <UserIcon className="mr-2 h-4 w-4" /> {t("header.profile")}
              </Link>
            </DropdownMenuItem>
            {allRoles.length > 1 && (
              <DropdownMenuItem onSelect={() => dispatch(set_active_role(null))}>
                <RefreshCw className="mr-2 h-4 w-4" /> {t("header.switch.role", "Switch role")}
              </DropdownMenuItem>
            )}
            {/* <DropdownMenuItem asChild>
              <Link to="/notifications">
                <Bell className="mr-2 h-4 w-4" /> {t("header.notifications")}
              </Link>
            </DropdownMenuItem> */}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setConfirmSignOut(true);
              }}
              className="text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" /> {t("header.signout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={confirmSignOut} onOpenChange={setConfirmSignOut}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("header.signout.confirm.title", "Sign out?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("header.signout.confirm.desc", "You will need to sign in again to access your account.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("header.cancel", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={signOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("header.signout", "Sign out")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
