import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BrandLogo } from "@/components/BrandLogo";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "إعادة تعيين كلمة السر | سند" },
      { name: "description", content: "اختر كلمة سر جديدة لحسابك في منصة سند لمتابعة أطفال ذوي الاحتياجات الخاصة." },
      { property: "og:title", content: "إعادة تعيين كلمة السر | سند" },
      { property: "og:description", content: "اختر كلمة سر جديدة لحسابك في منصة سند." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("كلمتا السر غير متطابقتين");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("تم تحديث كلمة السر بنجاح");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err?.message || "تعذر تحديث كلمة السر");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gradient-soft flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <BrandLogo className="h-12 w-12" />
          <span className="text-2xl font-bold text-gradient">سند</span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-elegant">
          <h1 className="mb-2 text-2xl font-bold">كلمة سر جديدة</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            {ready
              ? "اختر كلمة سر جديدة لحسابك."
              : "افتح هذه الصفحة من رابط إعادة التعيين المُرسل إلى بريدك الإلكتروني."}
          </p>

          {ready ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="new-password">كلمة السر الجديدة</Label>
                <Input
                  id="new-password"
                  type="password"
                  required
                  minLength={6}
                  maxLength={72}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">تأكيد كلمة السر</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  minLength={6}
                  maxLength={72}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full gradient-primary border-0 shadow-soft" disabled={loading}>
                {loading && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
                تحديث كلمة السر
              </Button>
            </form>
          ) : (
            <Button asChild variant="outline" className="w-full">
              <Link to="/auth" search={{ mode: "signin" }}>عودة إلى تسجيل الدخول</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
