import { useEffect, useState } from "react";
import { resetPassword } from "@/apis/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";


function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // If your backend provides a way to validate the password recovery token
    // you can call it here. For now we assume presence of token in URL indicates readiness.
    const url = new URL(window.location.href);
    // Try query param first
    const qToken = url.searchParams.get("token");
    // Also try hash params (e.g. #token=... or #access_token=...)
    const hash = (url.hash || "").replace(/^#/, "");
    const hashParams = new URLSearchParams(hash);
    const hToken = hashParams.get("token") || hashParams.get("access_token");
    const finalToken = qToken || hToken;
    if (finalToken) {
      setToken(finalToken);
      setReady(true);
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      if (!token) throw new Error("Reset token not found in URL");
      await resetPassword({ token, newPassword: password });
      toast.success("Password updated. Please sign in.");
    } catch (e:any) {
      toast.error(e?.message || "Failed to update password");
    } finally {
      setLoading(false);
      // clear local tokens
      localStorage.removeItem("accesstoken");
      localStorage.removeItem("refreshtoken");
      window.dispatchEvent(new CustomEvent("hcts-auth-changed"));
    }
    navigate("/", { replace: true });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#eaf3f1] px-4 py-12">
      {/* Concentric circle backdrop (same as login) */}
      {/* <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[140vmax] w-[140vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#dfebe8]/60" />
        <div className="absolute left-1/2 top-1/2 h-[100vmax] w-[100vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d3e4e0]/70" />
        <div className="absolute left-1/2 top-1/2 h-[60vmax] w-[60vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c6dcd6]/60" />
      </div> */}

      {/* Logo */}
      <Link to="/" className="absolute left-6 top-6 z-10 flex items-center gap-2">
        <img src="/qultiva-logo.png" alt="Qultiva Farms" className="" />
      </Link>

      <div className="w-full max-w-md">
        <Card className="border-border/60 shadow-elegant">
          <CardHeader>
            <CardTitle>Set a new password</CardTitle>
            <CardDescription>
              {ready
                ? "Choose a new password for your account."
                : "Verifying your reset link…"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pw">New password</Label>
                <Input id="pw" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} disabled={!ready} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw2">Confirm password</Label>
                <Input id="pw2" type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={!ready} />
              </div>
              <Button className="w-full" disabled={loading || !ready} type="submit">Update password</Button>
            </form>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">← Back to sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ResetPasswordPage;