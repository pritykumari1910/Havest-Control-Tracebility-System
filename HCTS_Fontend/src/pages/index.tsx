import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
// import { LanguageToggle } from "@/components/language-toggle";
import { useLang } from "@/i18n";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { LanguageToggle } from "@/components/language-toggle";
import { loginAction } from "@/redux/actions/authActions";
import { forgotPassword } from "@/apis/auth";


function AuthPage() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // useEffect(() => {
  //   supabase.auth.getSession().then(({ data }) => {
  //     if (data.session) navigate({ to: "/dashboard", replace: true });
  //   });
  // }, [navigate]);

  const dispatch = useDispatch();

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const resultAction = await dispatch(loginAction({ email, password }));
      setLoading(false);

      if (loginAction.rejected.match(resultAction)) {
        const error = (resultAction.payload as any) || (resultAction.error?.message ?? "Unable to sign in");
        return toast.error(typeof error === "string" ? error : error.message || "Unable to sign in");
      }

      toast.success(t("auth.welcome"));
      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      setLoading(false);
      toast.error(error?.message || "Unable to sign in");
    }
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail) return toast.error(t("auth.email.required") || "Please enter your email");
    setForgotLoading(true);

    try {
      // API expects an object; forgotPassword will attach userportal
        await forgotPassword({ email: forgotEmail });
      // optionally inspect result for success flag
      toast.success(t("auth.reset.sent"));
      setForgotOpen(false);
      setForgotEmail("");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Unable to request password reset");
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#eaf3f1] px-4 py-12">
      {/* Concentric circle backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[140vmax] w-[140vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#dfebe8]/60" />
        <div className="absolute left-1/2 top-1/2 h-[100vmax] w-[100vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d3e4e0]/70" />
        <div className="absolute left-1/2 top-1/2 h-[60vmax] w-[60vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c6dcd6]/60" />
      </div>

      {/* Logo */}
      <Link to="/" className="absolute left-6 top-6 z-10 flex items-center gap-2">
        <img src="/qultiva-logo.png" alt="Qultiva Farms" className="" />
      </Link>

      {/* Language toggle */}
      <div className="absolute right-6 top-6 z-10">
        <LanguageToggle />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-xl">
        <div className="rounded-2xl bg-white px-6 py-10 shadow-[0_20px_60px_-20px_rgba(20,80,72,0.25)] sm:px-14 sm:py-14">
          <h1 className="text-center font-display text-4xl font-bold tracking-tight text-[#2f8f83] sm:text-[42px]">
            {t("auth.welcome")}
          </h1>
          <p className="mt-3 text-center text-sm text-slate-700">
            {t("auth.signin.subtitle")}
          </p>

          <form onSubmit={signIn} className="mt-10 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[13px] font-semibold text-slate-900">
                {t("auth.email")}
              </Label>
              <Input
                id="email"
                type="email"
                required
                placeholder={t("auth.email.placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-lg border-slate-200 bg-slate-50/70 px-4 text-[15px] placeholder:text-slate-400 focus-visible:ring-[#2f8f83]/40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pw" className="text-[13px] font-semibold text-slate-900">
                {t("auth.password")}
              </Label>
              <div className="relative">
                <Input
                  id="pw"
                  type={showPw ? "text" : "password"}
                  required
                  placeholder={t("auth.password.placeholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-lg border-slate-200 bg-slate-50/70 px-4 pr-11 text-[15px] placeholder:text-slate-400 focus-visible:ring-[#2f8f83]/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { setForgotEmail(email); setForgotOpen(true); }}
              className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#2f8f83] hover:text-[#256e64]"
            >
              {t("auth.forgot")}
            </button>

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-lg bg-[#2f8f83] text-[15px] font-bold uppercase tracking-[0.12em] text-white shadow-sm hover:bg-[#256e64]"
            >
              {t("auth.signin.button")}
            </Button>
          </form>
        </div>
        {/* <p className="mt-6 text-center text-xs text-slate-500">
          {t("auth.need.access")}
        </p> */}
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("auth.reset.title")}</DialogTitle>
            <DialogDescription>{t("auth.reset.desc")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={sendReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="femail">{t("auth.email")}</Label>
              <Input
                id="femail"
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setForgotOpen(false)} disabled={forgotLoading}>
                {t("auth.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={forgotLoading}
                className="bg-[#2f8f83] hover:bg-[#256e64]"
              >
                {t("auth.reset.send")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AuthPage;  