import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { BrandLogo } from "@/components/BrandLogo";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { lovable } from "@/integrations/lovable";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s) => searchSchema.parse(s),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(search.mode ?? "signup");
  const [resetSent, setResetSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<AppRole>("parent");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate({ to: "/dashboard" });
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setResetSent(true);
        toast.success("أرسلنا رابط إعادة التعيين إلى بريدك الإلكتروني.");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName.trim(), phone: phone.trim(), role },
          },
        });
        if (error) throw error;
        toast.success("تم إنشاء حسابك بنجاح! مرحباً بك في سند.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        toast.success("مرحباً بك مجدداً!");
      }
    } catch (err: any) {
      const msg = err?.message || "حدث خطأ";
      if (msg.includes("Invalid login")) toast.error("بيانات الدخول غير صحيحة");
      else if (msg.includes("already registered")) toast.error("هذا البريد مسجل مسبقاً");
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/dashboard`,
      });
      if (result.error) {
        toast.error("تعذر الدخول عبر Google");
        setLoading(false);
      }
    } catch {
      toast.error("تعذر الدخول عبر Google");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 gradient-soft">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <BrandLogo className="h-12 w-12" />
          <span className="text-2xl font-bold text-gradient">سند</span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-elegant">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              {mode === "signin" ? "تسجيل الدخول" : mode === "forgot" ? "استعادة كلمة السر" : "إنشاء حساب جديد"}
            </h1>
            {mode !== "forgot" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              >
                {mode === "signin" ? "إنشاء حساب" : "تسجيل الدخول"}
              </Button>
            )}
          </div>
          <p className="mb-6 text-sm text-muted-foreground">
            {mode === "signin"
              ? "أهلاً بعودتك إلى سند"
              : mode === "forgot"
                ? "أدخل بريدك الإلكتروني وسنرسل لك رابطاً لتعيين كلمة سر جديدة."
                : "ابدأ رحلتك مع منصة سند"}
          </p>

          {mode !== "forgot" && (
            <>
              <Button type="button" variant="outline" className="mb-4 w-full" onClick={handleGoogle} disabled={loading}>
                <svg className="ms-2 h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
                </svg>
                المتابعة باستخدام Google
              </Button>

              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">أو</span>
                <div className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          {mode === "forgot" && resetSent ? (
            <div className="space-y-4">
              <p className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                تحقّق من بريدك <span className="font-medium text-foreground">{email}</span> واتبع الرابط لتعيين كلمة سر جديدة.
                إن لم تجد الرسالة راجع مجلد البريد المزعج.
              </p>
              <Button type="button" variant="outline" className="w-full" onClick={() => { setResetSent(false); setMode("signin"); }}>
                عودة إلى تسجيل الدخول
              </Button>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <Label htmlFor="fullName">الاسم الكامل</Label>
                  <Input id="fullName" required maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="phone">رقم الهاتف (اختياري)</Label>
                  <Input id="phone" maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="role">نوع الحساب</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                    <SelectTrigger id="role"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">ولي أمر</SelectItem>
                      <SelectItem value="specialist">أخصائي نفسي</SelectItem>
                      <SelectItem value="teacher">معلم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" required maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {mode !== "forgot" && (
              <div>
                <Label htmlFor="password">كلمة المرور</Label>
                <Input id="password" type="password" required minLength={6} maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            )}
            <Button type="submit" className="w-full gradient-primary border-0 shadow-soft" disabled={loading}>
              {loading && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
              {mode === "signin" ? "تسجيل الدخول" : mode === "forgot" ? "إرسال رابط إعادة التعيين" : "إنشاء الحساب"}
            </Button>
            {mode === "signin" && (
              <p className="text-center">
                <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => setMode("forgot")}>
                  نسيت كلمة السر؟
                </button>
              </p>
            )}
          </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>ليس لديك حساب؟{" "}
                <button type="button" className="font-medium text-primary hover:underline" onClick={() => setMode("signup")}>
                  أنشئ حساباً
                </button>
              </>
            ) : (
              <>لديك حساب؟{" "}
                <button type="button" className="font-medium text-primary hover:underline" onClick={() => setMode("signin")}>
                  سجّل الدخول
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}