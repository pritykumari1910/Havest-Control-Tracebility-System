import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ROLE_LABELS } from "@/lib/roles";
import { useDispatch, useSelector } from "react-redux";
import { getAllUsersAction } from "@/redux/actions/userActions";
import type { AppDispatch, RootState } from "@/redux";
import { useMutation } from "@/lib/useFetch";
import { activateUser, addUser, deactivateUser, updateUser } from "@/apis/users";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserPlus, MoreHorizontal, Search } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis, } from "@/components/ui/pagination";
import buildPageItems from "@/utils/paginationCount";

const ALL_ROLES = Object.keys(ROLE_LABELS);

function UsersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [inviting, setInviting] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const dispatch = useDispatch<AppDispatch>();

  const { users, isLoading, pagination } = useSelector((state: RootState) => state.users);
  const { roles } = useSelector((state: RootState) => state.roles);

  const refreshUsers = () => {
    const params: Record<string, any> = {
      page,
      limit: PAGE_SIZE,
    };
    if (search.trim()) params.search = search.trim();
    if (roleFilter) params.roleId = roleFilter;
    if (statusFilter) params.isActive = statusFilter;
    dispatch(getAllUsersAction(params));
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
    }, 450);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    refreshUsers();
  }, [dispatch, page, search, roleFilter, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    if (pagination && page > pagination.totalPages) {
      setPage(pagination.totalPages || 1);
    }
  }, [pagination, page]);

  const setRolesMut = useMutation(
    async (v: { userId: string; roles: string[] }) => {
      const result = await updateUser(v.userId, { roleIds: v.roles });
      toast.success("Roles updated");
      setEditing(null);
      refreshUsers();
      return result;
    },
  );
  const totalItems = pagination?.total ?? 0;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const pageStart = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(totalItems, page * PAGE_SIZE);

    const setStatusMut = useMutation(
    async (v: { userId: string; status: "active" | "inactive" }) => {
      let result: any;
      if (v.status === "active") {
        result = await activateUser(v.userId);
      } else {
        result = await deactivateUser(v.userId);
      }
      toast.success("Status updated");
      refreshUsers();
      return result;
    },
  );
  

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Users & Roles
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite, assign roles, edit, activate and deactivate accounts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search users…"
              className="pl-8 w-64"
            />
          </div>
          <div className="w-56">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All roles</SelectItem>
                {roles.map((role: any) => (
                  <SelectItem key={role._id} value={role._id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-44">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setInviting(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add user
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last sign-in</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="p-8 text-center text-muted-foreground"
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No users
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">
                        {u?.firstName + " " + u?.lastName}
                      </div>
                      {/* {!u.email_confirmed && <div className="text-xs text-muted-foreground">Email not confirmed</div>} */}
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {!Array.isArray(u.roles) || u.roles.length === 0 ? (
                          <Badge variant="outline">no role</Badge>
                        ) : (
                          u.roles.map((r: any) => {
                            const label =
                              typeof r === "string"
                                ? (ROLE_LABELS[r] ?? r)
                                : (r?.name ?? r?.id ?? JSON.stringify(r));
                            const key =
                              typeof r === "string" ? r : (r?.id ?? label);
                            return (
                              <Badge key={key} variant="secondary">
                                {label}
                              </Badge>
                            );
                          })
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{u.phoneNumber ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={u.isActive === true ? "secondary" : "outline"}
                      >
                        {u.isActive === true ? "active" : "inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {/* {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "never"} */}
                      {u.lastLoginAt
                        ? new Date(u.lastLoginAt).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setEditing(u)}>
                            Manage role
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setEditingUser(u)}>
                            Edit user
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={() =>

                                  setStatusMut.mutateAsync({
                                userId: u._id ?? u.id,
                                status: u.isActive === true ? "inactive" : "active",
                              })
                             
                              
                            }
                          >
                            {u.isActive === true
                              ? "Deactivate"
                              : "Reactivate"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {totalItems > PAGE_SIZE && (
            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {pageStart}–{pageEnd} of {totalItems} users
              </p>
              <Pagination aria-label="User list pagination">
                <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious
                                    onClick={(event) => {
                                      event.preventDefault();
                                      setPage((value) => Math.max(1, value - 1));
                                    }}
                                    aria-disabled={page === 1}
                                    className={page === 1 ? "pointer-events-none opacity-50" : ""}
                                    href="#"
                                  />
                                </PaginationItem>
                                {buildPageItems(page, totalPages).map((value, index) =>
                                  value === "ellipsis" ? (
                                    <PaginationItem key={`ellipsis-${index}`}>
                                      <PaginationEllipsis />
                                    </PaginationItem>
                                  ) : (
                                    <PaginationItem key={value}>
                                      <PaginationLink
                                        href="#"
                                        isActive={value === page}
                                        onClick={(event) => {
                                          event.preventDefault();
                                          setPage(value);
                                        }}
                                      >
                                        {value}
                                      </PaginationLink>
                                    </PaginationItem>
                                  )
                                )}
                                <PaginationItem>
                                  <PaginationNext
                                    onClick={(event) => {
                                      event.preventDefault();
                                      setPage((value) => Math.min(totalPages, value + 1));
                                    }}
                                    aria-disabled={page === totalPages}
                                    className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                                    href="#"
                                  />
                                </PaginationItem>
                              </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <RolesSheet
        user={editing}
        onClose={() => setEditing(null)}
        onSave={(roles) =>{

         return setRolesMut.mutateAsync({ userId: editing?._id, roles })
        }
        }
        saving={setRolesMut.isLoading}
        allRoles={roles}
      />
      <InviteSheet
        open={inviting || !!editingUser}
        user={editingUser}
        onClose={() => {
          setInviting(false);
          setEditingUser(null);
        }}
        onSaved={refreshUsers}
        allRoles={roles}
      />
    </div>
  );
}


function RolesSheet({
  user,
  onClose,
  onSave,
  saving,
  allRoles,
}: {
  user: any;
  onClose: () => void;
  onSave: (r: string[]) => Promise<any>;
  saving: boolean;
  allRoles: any[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const open = !!user;

  const normalizeRoleValue = (role: any) => {
    if (!role) return "";
    if (typeof role === "string") return role;
    return role._id ?? role.id ?? role.name ?? "";
  };

  const normalizeRoleLabel = (role: any) => {
    if (!role) return "";
    if (typeof role === "string") return ROLE_LABELS[role] ?? role;
    return role.name ?? role._id ?? JSON.stringify(role);
  };

  const currentRoleLabel = Array.isArray(user?.roles)
    ? user.roles
        .map((role: any) => normalizeRoleLabel(role))
        .filter(Boolean)
        .join(", ")
    : "None";

  useEffect(() => {
    if (open) {
      const selectedRoles = Array.isArray(user?.roles)
        ? user.roles.map(normalizeRoleValue).filter(Boolean)
        : [];
      setSelected(selectedRoles);
    }
  }, [open, user]);

  


  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      key={user?.id ?? "empty"}
    >
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            Manage roles — {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email}
          </SheetTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Current roles: {currentRoleLabel}
          </p>
        </SheetHeader>
        <div className="mt-6 space-y-2">
          <div className="space-y-2">
            {allRoles?.map((r) => (
              <label
                key={r._id}
                className="flex items-center gap-3 rounded-md border border-border p-3 cursor-pointer hover:bg-muted/50"
              >
                <Checkbox
                  checked={selected.includes(r._id)}
                  onCheckedChange={(checked) =>
                    setSelected((current) =>
                      checked
                        ? [...current, r._id]
                        : current.filter((id) => id !== r._id)
                    )
                  }
                />
                <div>
                  <div className="text-sm font-medium">{r.name} <span className="text-muted-foreground">({r.roleType})</span> </div>
                </div>
              </label>
            ))}
          </div>
        </div>
        <SheetFooter className="mt-6">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(selected)} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  roles: z.array(z.string()).min(1, "At least one role is required"),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

function InviteSheet({
  open,
  user,
  onClose,
  onSaved,
  allRoles,
}: {
  open: boolean;
  user?: any | null;
  onClose: () => void;
  onSaved?: () => void;
  allRoles: any[];
}) {
  const roleOptions = allRoles?.length > 0 ? allRoles : ALL_ROLES;
  const dispatch = useDispatch<AppDispatch>();

  const isEdit = !!user;
  const defaultRole = roleOptions?.[0]?._id ?? "";

  const normalizeRoleId = (role: any) => {
    if (!role) return "";
    if (typeof role === "string") return role;
    return role._id ?? role.id ?? "";
  };

  const buildDefaults = (): InviteFormValues => {
    if (user) {
      const userRoles = Array.isArray(user.roles)
        ? user.roles.map(normalizeRoleId).filter(Boolean)
        : [];
      return {
        email: user.email ?? "",
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        phoneNumber: user.phoneNumber ?? "",
        roles: userRoles,
      };
    }
    return {
      email: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      roles: defaultRole ? [defaultRole] : [],
    };
  };

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    mode: "onTouched",
    defaultValues: buildDefaults(),
  });

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = form;

  useEffect(() => {
    if (open) {
      reset(buildDefaults());
    }
  }, [open, reset, defaultRole, user]);

  const onSubmit = async (values: InviteFormValues) => {
    // Derive the portal from the selected roles' roleType. A user may now hold
    // roles across both portals (web and app), so mixed portals are allowed.
    // const selectedRoleObjects = roleOptions.filter(
    //   (r: any) => typeof r !== "string" && values.roles.includes(r._id),
    // );
    // const roleTypes = Array.from(
    //   new Set(
    //     selectedRoleObjects.map((r: any) => r.roleType).filter(Boolean),
    //   ),
    // );

    // Only send a single userportal when the roles are unambiguously one portal.
    // const userportal = roleTypes.length === 1 ? (roleTypes[0] as string) : undefined;

    try {
      const payload = {
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNumber: values.phoneNumber,
        roleIds: values.roles,
        // ...(userportal ? { userportal } : {}),
      };
      if (isEdit) {
        const { email, ...updatePayload } = payload;
        const result = await updateUser(user._id ?? user.id, updatePayload);
        if (result) {
          toast.success("User updated successfully");
          onSaved ? onSaved() : dispatch(getAllUsersAction({}));
          onClose();
        }
      } else {
        const result = await addUser(payload);
        if (result) {
          toast.success("User created successfully");
          onSaved ? onSaved() : dispatch(getAllUsersAction({}));
          onClose();
        }
      }
    } catch (e: any) {
      toast.error(
        e?.message || (isEdit ? "Unable to update user" : "Unable to create user"),
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit user" : "Add user"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="inv-email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="email"
              control={control}
              disabled={isEdit}
              render={({ field }) => (
                <Input id="inv-email" type="email" {...field} />
              )}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inv-first-name">
              First name <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => <Input id="inv-first-name" {...field} />}
            />
            {errors.firstName && (
              <p className="text-xs text-destructive">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inv-last-name">
              Last name <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="lastName"
              control={control}
              render={({ field }) => <Input id="inv-last-name" {...field} />}
            />
            {errors.lastName && (
              <p className="text-xs text-destructive">
                {errors.lastName.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inv-mobile">
              Mobile <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="phoneNumber"
              control={control}
              render={({ field }) => (
                <Input
                  id="inv-mobile"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  {...field}
                />
              )}
            />
            {errors.phoneNumber && (
              <p className="text-xs text-destructive">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Roles <span className="text-destructive">*</span>
            </Label>
            {/* <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select a role" /></SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((r: any) => {
                      const optionValue = normalizeRole(r);
                      return (
                        <SelectItem key={optionValue} value={optionValue}>
                          {renderRoleLabel(r)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            /> */}
            <Controller
              name="roles"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  {roleOptions.map((role: any) => {
                    const roleId = role._id;
                    const checked = Array.isArray(field.value) && field.value.includes(roleId);
                    return (
                      <label
                        key={roleId}
                        className="flex items-center gap-3 rounded-md border border-border p-3 cursor-pointer hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => {
                            const nextRoles = value
                              ? [...(field.value || []), roleId]
                              : (field.value || []).filter((id: string) => id !== roleId);
                            field.onChange(nextRoles);
                          }}
                        />
                        <div>
                          <div className="text-sm font-medium">{role.name} <span className="text-muted-foreground">({role.roleType})</span></div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            />
            {errors.roles && (
              <p className="text-xs text-destructive">{errors.roles.message}</p>
            )}
          </div>

          <SheetFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={ !isValid || isSubmitting}>
              {isSubmitting
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Send invitation"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default UsersPage;
