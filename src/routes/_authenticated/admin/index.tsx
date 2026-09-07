import { RequirePermission } from "@/components/RequirePermission";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminStats, fetchRecentActivity } from "@/lib/admin-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Baby, CalendarDays, FileText, ClipboardList, ArrowLeft, Loader2, UserCog, GraduationCap, Heart, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: GuardedAdminHome,
});

function AdminHome() {
  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: fetchAdminStats });
  const activity = useQuery({ queryKey: ["admin", "activity"], queryFn: fetchRecentActivity });
  const s = stats.data;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl gradient-hero p-8 text-primary-foreground shadow-elegant">
        <h1 className="text-3xl font-bold">لوحة التحكم المركزية</h1>
        <p className="mt-2 text-primary-foreground/90">ملخص شامل عن نشاط منصة سند والمستخدمين والخدمات.</p>
      </div>

      {stats.isLoading || !s ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} label="إجمالي المستخدمين" value={s.users} to="/admin/users" />
            <StatCard icon={Baby} label="الأطفال المسجلون" value={s.children} to="/admin/children" />
            <StatCard icon={CalendarDays} label="المواعيد" value={s.appointments} to="/admin/appointments" hint={`${s.appointmentsPending} قيد الانتظار`} />
            <StatCard icon={FileText} label="التقارير والخطط" value={s.reports + s.plans} to="/admin/statistics" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <RoleCard icon={Heart} label="أولياء الأمور" value={s.parents} tone="from-pink-500 to-rose-500" />
            <RoleCard icon={UserCog} label="الأخصائيون" value={s.specialists} tone="from-blue-500 to-indigo-500" />
            <RoleCard icon={GraduationCap} label="المعلمون" value={s.teachers} tone="from-emerald-500 to-teal-500" />
            <RoleCard icon={ShieldCheck} label="الإداريون" value={s.admins} tone="from-amber-500 to-orange-500" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <ActivityList
              title="أحدث التقارير"
              to="/admin/statistics"
              items={(activity.data?.reports ?? []).map((r: any) => ({ id: r.id, primary: r.title, secondary: r.child?.full_name, meta: fmt(r.created_at) }))}
              icon={FileText}
              loading={activity.isLoading}
            />
            <ActivityList
              title="أحدث الخطط الفردية"
              to="/admin/statistics"
              items={(activity.data?.plans ?? []).map((p: any) => ({ id: p.id, primary: p.title, secondary: p.child?.full_name, meta: fmt(p.created_at) }))}
              icon={ClipboardList}
              loading={activity.isLoading}
            />
            <ActivityList
              title="أحدث المواعيد"
              to="/admin/appointments"
              items={(activity.data?.appointments ?? []).map((a: any) => ({ id: a.id, primary: a.type, secondary: a.child?.full_name, meta: fmt(a.scheduled_at), badge: a.status }))}
              icon={CalendarDays}
              loading={activity.isLoading}
            />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base font-bold">مؤشرات الأداء</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <KPI label="متوسط الأطفال لكل ولي أمر" value={s.parents ? (s.children / s.parents).toFixed(1) : "—"} />
              <KPI label="متوسط الأطفال لكل أخصائي" value={s.specialists ? (s.children / s.specialists).toFixed(1) : "—"} />
              <KPI label="نسبة المواعيد المعلقة" value={s.appointments ? `${Math.round((s.appointmentsPending / s.appointments) * 100)}%` : "0%"} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function fmt(d: string) { try { return new Date(d).toLocaleDateString("ar-EG"); } catch { return d; } }

function StatCard({ icon: Icon, label, value, to, hint }: { icon: any; label: string; value: number; to: string; hint?: string }) {
  return (
    <Link to={to} className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elegant">
      <div className="flex items-center justify-between">
        <div className="gradient-primary flex h-10 w-10 items-center justify-center rounded-xl shadow-soft">
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <div className="mt-3 text-sm text-muted-foreground">{label}</div>
      {hint && <div className="mt-1 text-xs text-primary">{hint}</div>}
    </Link>
  );
}

function RoleCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-soft`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold text-primary">{value}</div>
    </div>
  );
}

function ActivityList({ title, to, items, icon: Icon, loading }: { title: string; to: string; items: any[]; icon: any; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold">{title}</CardTitle>
        <Button variant="ghost" size="sm" asChild><Link to={to}>الكل <ArrowLeft className="ms-1 h-4 w-4" /></Link></Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /> :
          items.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد بيانات.</p> :
          items.map((it) => (
            <div key={it.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{it.primary}</div>
                <div className="truncate text-xs text-muted-foreground">{it.secondary ?? "—"} · {it.meta}</div>
              </div>
              {it.badge && <Badge variant="secondary">{it.badge}</Badge>}
            </div>
          ))
        }
      </CardContent>
    </Card>
  );
}
function GuardedAdminHome() {
  return (
    <RequirePermission permission="admin.dashboard">
      <AdminHome />
    </RequirePermission>
  );
}
