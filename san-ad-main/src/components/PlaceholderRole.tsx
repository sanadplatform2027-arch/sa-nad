import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { Sparkles, LogOut } from "lucide-react";
import { toast } from "sonner";

export function PlaceholderRole({ role }: { role: string }) {
  const { profile, signOut } = useAuth();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background gradient-soft px-4">
      <div className="max-w-lg rounded-3xl border border-border bg-card p-10 text-center shadow-elegant">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center">
          <BrandLogo className="h-14 w-14" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">أهلاً بك {profile?.full_name ?? ""}</h1>
        <p className="mb-1 text-muted-foreground">واجهة <span className="font-bold text-primary">{role}</span></p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
          <Sparkles className="h-4 w-4" />
          هذه الواجهة قيد التطوير في المرحلة القادمة
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          ستحتوي على جميع الأدوات الخاصة بك: إدارة الملفات، تسجيل البيانات، التقارير، والتواصل مع الفريق.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button variant="outline" asChild><Link to="/">الصفحة الرئيسية</Link></Button>
          <Button variant="ghost" onClick={async () => { await signOut(); toast.success("تم تسجيل الخروج"); }}>
            <LogOut className="me-2 h-4 w-4" /> تسجيل الخروج
          </Button>
        </div>
      </div>
    </div>
  );
}