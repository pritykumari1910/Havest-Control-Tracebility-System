import {  useNavigate } from "@/lib/router-compat";
import { useEffect, useState } from "react";
import { db as supabase } from "@/lib/db";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/lib/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { KeyRound, LogOut, Mail, ShieldCheck, Clock,  Phone } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/enterprise/page-shell";
import { signOut as apiSignOut, updatePassword, updateProfile } from "@/apis/auth";
import { useLang } from "@/i18n";
import { useDispatch, useSelector } from "react-redux";
import { clear_user_info } from "@/redux/slices/authSlice";
import { getProfileAction } from "@/redux/actions/authActions";



function ProfilePage() {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
    const { t } = useLang();

    const {userInfo} = useSelector((state:any)=>state.auth);
  

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwOld, setPwOld] = useState("");
  const [saving, setSaving] = useState(false);
  const [changing, setChanging] = useState(false);

  const initials = ((user?.firstName ?? "") + (user?.lastName ?? "") ||  "?").slice(0, 2).toUpperCase();
  const lastSignIn = user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "—";
  const createdAt = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—";

  // initialize first/last from user when available
  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setPhone(user.phoneNumber ?? "");
  }, [user]);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    // require all fields
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setSaving(false);
      return toast.error("First name, last name and phone are required");
    }

    const payload: any = {};
    payload.firstName = firstName.trim();
    payload.lastName = lastName.trim();
    payload.phoneNumber = phone.trim();
try{
    const data= await updateProfile(payload);
    if(data){
     await dispatch(getProfileAction());
    }
    
    toast.success("Profile updated");
    setFirstName(""); setLastName(""); setPhone("");
}catch(e:any){
    toast.error(e?.response?.data?.message || e?.message || "Failed to update profile");  
}finally{
    setSaving(false);
} 
  }

  async function changePassword() {
    if (pwOld.length < 8) return toast.error("Current password must be at least 8 characters");
    if (pw1.length < 8) return toast.error("New password must be at least 8 characters");
    if (pw1 !== pw2) return toast.error("Passwords do not match");
    setChanging(true);
    try {
      await updatePassword({
        oldPassword: pwOld,
        newPassword: pw1,
      });

      toast.success("Password updated");
      setPwOld(""); setPw1(""); setPw2("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to update password");
    } finally {
      setChanging(false);
    }
  }

  async function signOut() {
    try {
      // attempt server-side logout
      await apiSignOut();
    } catch (e) {
      console.warn("signOut API failed", e);
    }

   
    toast.success(t("header.signed.out"));
    dispatch(clear_user_info());
    // trigger global redux reset handled by rootReducerWithClear
    dispatch({ type: "hcts/clearReduxState" });

    navigate("/");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Personal"
        title="Profile"
        description="Manage your account details, security and session."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary/10 text-lg font-medium text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-base font-semibold capitalize">{user?.firstName } {user?.lastName}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {roles.length === 0 ? (
                <Badge variant="outline">No role</Badge>
              ) : roles.map((r:any) => (
                <Badge key={r} variant="secondary" className="text-[10px]">{ROLE_LABELS[r] ?? r}</Badge>
              ))}
            </div>
            <Separator className="my-2" />
            <div className="w-full space-y-2 text-left text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> <span className="truncate">{user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> <span className="truncate">{user?.phoneNumber}</span>
              </div>
              {/* <div className="flex items-center gap-2 text-muted-foreground">
                <Fingerprint className="h-3.5 w-3.5" /> <span className="font-mono">{user?.id?.slice(0, 12)}…</span>
              </div> */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Last sign-in {lastSignIn}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> Member since {createdAt}
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="mt-3 w-full gap-2">
                  <LogOut className="h-4 w-4" /> Sign out
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will need to sign in again to access your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={signOut}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sign out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold uppercase tracking-wider">Personal details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3 items-end">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" placeholder={user?.firstName ?? "First name"} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" placeholder={user?.lastName ?? "Last name"} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" placeholder={user?.phoneNumber ?? "+00 000 000 000"} value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button size="sm" onClick={saveProfile} disabled={
                    saving || !firstName.trim() || !lastName.trim() || !phone.trim() ||
                    !(firstName !== (user?.firstName ?? "") || lastName !== (user?.lastName ?? "") || phone !== (user?.phoneNumber ?? ""))
                  }>
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2"><KeyRound className="h-4 w-4" /> Change password</CardTitle></CardHeader>
            <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="pwOld">Current password</Label>
                    <Input id="pwOld" type="password" value={pwOld} onChange={(e) => setPwOld(e.target.value)} placeholder="Your current password" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pw1">New password</Label>
                    <Input id="pw1" type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} placeholder="At least 8 characters" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pw2">Confirm password</Label>
                    <Input id="pw2" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Repeat new password" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button size="sm" onClick={changePassword} disabled={changing || !pwOld || !pw1 || !pw2}>
                    {changing ? "Updating…" : "Update password"}
                  </Button>
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold uppercase tracking-wider">Role &amp; permissions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {roles.length === 0 ? (
                <div className="text-sm text-muted-foreground">No roles assigned. Ask an administrator for access.</div>
              ) : roles.map((r:any) => (
                <div key={r} className="rounded-md border border-border/70 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{ROLE_LABELS[r] ?? r}</div>
                    <Badge variant="outline" className="text-[10px]">Active</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[r]}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
