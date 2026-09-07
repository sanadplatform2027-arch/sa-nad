import { RequirePermission } from "@/components/RequirePermission";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Lock, KeyRound, FileCheck2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/security")({
  component: GuardedSecurityPage,
});

const items = [
  { icon: Lock, title: "سياسات الوصول (RLS)", desc: "جميع الجداول محمية بسياسات صارمة تعتمد على الأدوار وربط ولي الأمر/الأخصائي/المعلم بالطفل." },
  { icon: KeyRound, title: "المصادقة", desc: "نظام مصادقة موحّد مع دعم Google والبريد الإلكتروني." },
  { icon: ShieldCheck, title: "الأدوار", desc: "أربعة أدوار: ولي أمر، أخصائي، معلم، إدارة. الأدوار مخزنة في جدول منفصل ومحمي." },
  { icon: FileCheck2, title: "سجل النشاط", desc: "جميع البيانات الحساسة مسجّلة بمن أنشأها وتاريخ الإنشاء." },
];

function SecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">الأمان والصلاحيات</h1>
        <p className="text-sm text-muted-foreground">نظرة عامة على منظومة الحماية في منصة سند.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((it) => (
          <Card key={it.title}>
            <CardHeader className="flex flex-row items-start gap-3">
              <div className="gradient-primary flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground shadow-soft">
                <it.icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-bold">{it.title}</CardTitle>
            </CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{it.desc}</p></CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base font-bold">توصيات</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• قم بمراجعة قائمة المستخدمين دورياً وحذف الحسابات غير النشطة.</p>
          <p>• تأكد من تفعيل التحقق بخطوتين لجميع الحسابات الإدارية.</p>
          <p>• راجع سجل المواعيد والتقارير أسبوعياً للتحقق من صحة البيانات.</p>
        </CardContent>
      </Card>
    </div>
  );
}
function GuardedSecurityPage() {
  return (
    <RequirePermission permission="admin.security">
      <SecurityPage />
    </RequirePermission>
  );
}
