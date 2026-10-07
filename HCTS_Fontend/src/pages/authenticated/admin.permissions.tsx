import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { getAllRolesAction } from "@/redux/actions/roleActions";
import type { AppDispatch, RootState } from "@/redux";
import { getAllPermissions, updateRolePermissions } from "@/apis/roles";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Check, Minus, Pencil, Search, ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Permission = {
  _id: string;
  permissionName: string;
  permissionIdentifier: string;
};

type Role = {
  _id: string;
  name: string;
  permissions?: Permission[];
  roleType?: string;
  isActive?: boolean;
};

function PermissionsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { roles, isLoading } = useSelector((state: RootState) => state.roles) as {
    roles: Role[];
    isLoading: boolean;
  };

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const refreshRoles = () => dispatch(getAllRolesAction());

  useEffect(() => {
    refreshRoles();
    (async () => {
      try {
        const res = await getAllPermissions();
        const list = res?.responseObject ?? res?.data ?? res ?? [];
        setAllPermissions(Array.isArray(list) ? list : []);
      } catch (e: any) {
        toast.error(e?.message || "Unable to load permissions");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Columns: every role, or a single role when filtered.
  const columns = useMemo<Role[]>(
    () => (roleFilter ? roles.filter((r) => r._id === roleFilter) : roles),
    [roles, roleFilter],
  );

  // Rows: the full permission catalog when available, otherwise the union of
  // permissions actually assigned across roles. Filtered by the search term.
  const permissions = useMemo(() => {
    let list: Permission[];
    if (allPermissions.length > 0) {
      list = allPermissions;
    } else {
      const map = new Map<string, Permission>();
      for (const role of roles) {
        for (const p of role.permissions ?? []) {
          if (p?.permissionIdentifier) map.set(p.permissionIdentifier, p);
        }
      }
      list = Array.from(map.values());
    }
    const term = search.trim().toLowerCase();
    return list
      .filter((p) => !term || p.permissionName?.toLowerCase().includes(term))
      .sort((a, b) => a.permissionName.localeCompare(b.permissionName));
  }, [allPermissions, roles, search]);

  const roleHas = (role: Role, perm: Permission) =>
    (role.permissions ?? []).some(
      (p) =>
        p._id === perm._id ||
        p.permissionIdentifier === perm.permissionIdentifier,
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Roles & Permissions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Permissions granted to each role. Use the edit action on a role to
            change its permissions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search permissions…"
              className="w-56 pl-8"
            />
          </div>
          <div className="w-56">
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role._id} value={role._id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Check className="h-3.5 w-3.5 text-primary" /> Granted
        </span>
        <span className="flex items-center gap-1">
          <Minus className="h-3.5 w-3.5 text-muted-foreground/40" /> Not granted
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="sticky left-0 z-10 min-w-64 bg-card px-4 py-3 text-left font-medium">
                    Permission
                  </th>
                  {columns.map((role) => (
                    <th
                      key={role._id}
                      className="px-3 py-3 text-center align-bottom font-medium"
                    >
                      <div className="mx-auto flex max-w-32 flex-col items-center gap-1 text-xs leading-tight">
                        <span>{role.name}</span>
                        {role.roleType && (
                          <Badge variant="outline" className="text-[9px] uppercase">
                            {role.roleType}
                          </Badge>
                        )}
                        <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => setEditingRole(role)}
                            aria-label={`Edit ${role.name} permissions`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit permissions</p>
                        </TooltipContent>
                      </Tooltip>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={columns.length + 1}
                      className="p-8 text-center text-muted-foreground"
                    >
                      Loading…
                    </td>
                  </tr>
                ) : permissions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + 1}
                      className="p-8 text-center text-muted-foreground"
                    >
                      {roles.length === 0
                        ? "No roles found"
                        : "No permissions match your search"}
                    </td>
                  </tr>
                ) : (
                  permissions.map((perm) => (
                    <tr
                      key={perm.permissionIdentifier}
                      className="border-b border-border/60 hover:bg-muted/30"
                    >
                      <td className="sticky left-0 z-10 bg-card px-4 py-2.5 font-medium">
                        {perm.permissionName}
                      </td>
                      {columns.map((role) => (
                        <td key={role._id} className="px-3 py-2.5 text-center">
                          {roleHas(role, perm) ? (
                            <Check
                              className="mx-auto h-4 w-4 text-primary"
                              aria-label="Granted"
                            />
                          ) : (
                            <Minus
                              className="mx-auto h-4 w-4 text-muted-foreground/40"
                              aria-label="Not granted"
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
              {!isLoading && permissions.length > 0 && (
                <tfoot>
                  <tr className="border-t border-border bg-muted/40">
                    <td className="sticky left-0 z-10 bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Total permissions
                    </td>
                    {columns.map((role) => (
                      <td key={role._id} className="px-3 py-3 text-center">
                        <Badge variant="secondary">
                          {(role.permissions ?? []).length}
                        </Badge>
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      <EditPermissionsSheet
        role={editingRole}
        allPermissions={allPermissions}
        onClose={() => setEditingRole(null)}
        onSaved={() => {
          setEditingRole(null);
          refreshRoles();
        }}
      />
    </div>
  );
}

function EditPermissionsSheet({
  role,
  allPermissions,
  onClose,
  onSaved,
}: {
  role: Role | null;
  allPermissions: Permission[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const open = !!role;
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (role) {
      setSelected((role.permissions ?? []).map((p) => p._id).filter(Boolean));
    }
  }, [role]);

  const sortedPermissions = useMemo(
    () => [...allPermissions].sort((a, b) => a.permissionName.localeCompare(b.permissionName)),
    [allPermissions],
  );

  const toggle = (id: string, checked: boolean) =>
    setSelected((current) =>
      checked ? [...current, id] : current.filter((x) => x !== id),
    );

  const save = async () => {
    if (!role) return;
    setSaving(true);
    try {
      await updateRolePermissions(role._id, selected);
      toast.success("Permissions updated");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || "Unable to update permissions");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit permissions — {role?.name}</SheetTitle>
          <div className="flex items-center gap-3 pt-1">
            <p className="text-sm text-muted-foreground">
              {selected.length} of {sortedPermissions.length} selected
            </p>
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline"
              onClick={() => setSelected(sortedPermissions.map((p) => p._id))}
            >
              Select all
            </button>
            <button
              type="button"
              className="text-xs font-medium text-muted-foreground hover:underline"
              onClick={() => setSelected([])}
            >
              Clear
            </button>
          </div>
        </SheetHeader>

        <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
          {sortedPermissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No permissions available.</p>
          ) : (
            sortedPermissions.map((perm) => (
              <label
                key={perm._id}
                className="flex items-center gap-3 rounded-md border border-border p-3 cursor-pointer hover:bg-muted/50"
              >
                <Checkbox
                  checked={selected.includes(perm._id)}
                  onCheckedChange={(checked) => toggle(perm._id, checked === true)}
                />
                <div>
                  <div className="text-sm font-medium">{perm.permissionName}</div>
                  <div className="text-xs text-muted-foreground">
                    {perm.permissionIdentifier}
                  </div>
                </div>
              </label>
            ))
          )}
        </div>

        <SheetFooter className="mt-4">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default PermissionsPage;
