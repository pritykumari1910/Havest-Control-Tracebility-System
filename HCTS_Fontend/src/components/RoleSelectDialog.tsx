import { useState } from "react";
import { useDispatch } from "react-redux";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { set_active_role } from "@/redux/slices/authSlice";
import { getDashboardDataAction, resolveDashboardUserRole } from "@/redux/actions/dashboardActions";
import type { AppDispatch } from "@/redux";
import { ROLE_LABELS, ROLE_DESCRIPTIONS, isWebRole } from "@/lib/roles";
import { ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Shown immediately after login when a user holds more than one role. The user
 * must pick the role to use for this session before continuing — the dialog
 * cannot be dismissed without choosing. The chosen role drives permissions
 * everywhere via useAuth().roles.
 */
export function RoleSelectDialog() {
  const { needsRoleSelection, allRoles } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const [selected, setSelected] = useState<AppRole | null>(null);
  const navigate = useNavigate();

  // The web portal only exposes web-portal roles here; a user may also hold
  // app-portal roles, which are hidden so only web roles can access the web app.
  const webRoles = allRoles.filter((role) => isWebRole(String(role)));

  const confirm = () => {
    if (!selected) return;
    dispatch(set_active_role(selected));
    // Kick off the dashboard fetch for the newly selected role (the backend
    // expects the role label, not the canonical key).
    dispatch(getDashboardDataAction({ userRoleId: resolveDashboardUserRole([String(selected)]) }));
    navigate("/dashboard");
  };

  return (
    <Dialog open={needsRoleSelection}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden  max-h-[95vh] overflow-y-auto"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Select your role
          </DialogTitle>
          <DialogDescription>
            You have access to multiple roles. Choose the role to use for this
            session — your permissions will be based on the role you pick.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-2">
          {webRoles.map((role:any) => {
            const isActive = selected === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => setSelected(role)}
                className={`w-full rounded-md border p-3 text-left transition-colors ${
                  isActive
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <div className="text-sm font-medium">
                  {ROLE_LABELS[role] ?? role}
                </div>
                {ROLE_DESCRIPTIONS[role] && (
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {ROLE_DESCRIPTIONS[role]}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <Button className="w-full" disabled={!selected} onClick={confirm}>
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
