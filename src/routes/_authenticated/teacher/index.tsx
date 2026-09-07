import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { fetchTeacherChildren, fetchTeacherChildIds } from "@/lib/teacher-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, ClipboardList, CalendarCheck, BarChart3, ArrowLeft, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/teacher/")({
  component: TeacherHome,
});

function TeacherHome() {
  const { user, profile } = useAuth();
  const uid = user?.id;

  const children = useQuery({
    queryKey: ["teacher", uid, "children"],
    queryFn: () => fetchTeacherChildren(uid!),
    enabled: !!uid,
  });

  const ids = useQuery({
    queryKey: ["teacher", uid, "child-ids"],
    queryFn: () => fetchTeacherChildIds(uid!),
    enabled: !!uid,
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayAttendance = useQuery({
    queryKey: ["teacher", uid, "attendance-today", ids.data],
    queryFn: async () => {
      const list = ids.data ?? [];
      if (list.length === 0) return [];
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .in("child_id", list)
        .eq("date", today);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!ids.data,
  });

  const pendingAssignments = useQuery({
    queryKey: ["teacher", uid, "assignments-pending", ids.data],
    queryFn: async () => {
      const list = ids.data ?? [];
      if (list.length === 0) return [];
      const { data, error } = await supabase
        .from("assignments")
        .select("*, child:children(full_name)")
        .in("child_id", list)
        .in("status", ["pending", "submitted"])
        .order("due_date", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!ids.data,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl gradient-hero p-8 text-primary-foreground shadow-elegant">
        <h1 className="text-3xl font-bold">مرحباً {profile?.full_name ?? "أستاذ"} 👋</h1>
        <p className="mt-2 text-primary-foreground/90">نظرة عامة على التلاميذ والمهام التربوية.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="عدد التلاميذ" value={children.data?.length ?? 0} to="/teacher/children" />
        <StatCard icon={CalendarCheck} label="تسجيلات اليوم" value={todayAttendance.data?.length ?? 0} to="/teacher/attendance" />
        <StatCard icon={ClipboardList} label="واجبات قيد الانتظار" value={pendingAssignments.data?.length ?? 0} to="/teacher/assignments" />
        <StatCard icon={BarChart3} label="التقييمات" value={0} to="/teacher/grades" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold">التلاميذ</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/teacher/children">عرض الكل <ArrowLeft className="ms-1 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {children.isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /> :
              (children.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">لم يتم تخصيص تلاميذ بعد.</p>
              ) : (
                (children.data ?? []).slice(0, 5).map((c: any) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <Avatar><AvatarFallback className="bg-primary/10 text-primary font-bold">{c.full_name?.[0] ?? "?"}</AvatarFallback></Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{c.full_name}</div>
                      <div className="text-xs text-muted-foreground">{c.grade_level ?? "—"}</div>
                    </div>
                  </div>
                ))
              )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold">واجبات قيد المتابعة</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/teacher/assignments">عرض الكل <ArrowLeft className="ms-1 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingAssignments.isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /> :
              (pendingAssignments.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد واجبات حالياً.</p>
              ) : (
                (pendingAssignments.data ?? []).map((a: any) => (
                  <div key={a.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{a.title}</span>
                      <Badge variant="secondary">{a.status}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{a.child?.full_name} {a.due_date ? `· ${a.due_date}` : ""}</div>
                  </div>
                ))
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, to }: { icon: any; label: string; value: number; to: string }) {
  return (
    <Link to={to} className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elegant">
      <div className="flex items-center justify-between">
        <div className="gradient-primary flex h-10 w-10 items-center justify-center rounded-xl shadow-soft">
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <div className="mt-3 text-sm text-muted-foreground">{label}</div>
    </Link>
  );
}