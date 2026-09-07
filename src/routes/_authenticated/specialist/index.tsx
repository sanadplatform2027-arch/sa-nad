import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { fetchSpecialistChildren, fetchSpecialistChildIds } from "@/lib/specialist-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, FileText, ClipboardList, ArrowLeft, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/specialist/")({
  component: SpecialistHome,
});

function SpecialistHome() {
  const { user, profile } = useAuth();
  const uid = user?.id;

  const children = useQuery({
    queryKey: ["specialist", uid, "children"],
    queryFn: () => fetchSpecialistChildren(uid!),
    enabled: !!uid,
  });

  const ids = useQuery({
    queryKey: ["specialist", uid, "child-ids"],
    queryFn: () => fetchSpecialistChildIds(uid!),
    enabled: !!uid,
  });

  const appointments = useQuery({
    queryKey: ["specialist", uid, "appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, child:children(full_name)")
        .eq("specialist_id", uid!)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!uid,
  });

  const diagnoses = useQuery({
    queryKey: ["specialist", uid, "recent-diagnoses", ids.data],
    queryFn: async () => {
      const list = ids.data ?? [];
      if (list.length === 0) return [];
      const { data, error } = await supabase
        .from("diagnoses")
        .select("*, child:children(full_name)")
        .in("child_id", list)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!ids.data,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl gradient-hero p-8 text-primary-foreground shadow-elegant">
        <h1 className="text-3xl font-bold">مرحباً د. {profile?.full_name ?? "الأخصائي"} 👋</h1>
        <p className="mt-2 text-primary-foreground/90">نظرة عامة على الأطفال المتابعين والمواعيد القادمة.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="الأطفال المتابعين" value={children.data?.length ?? 0} to="/specialist/children" />
        <StatCard icon={Calendar} label="مواعيد قادمة" value={appointments.data?.length ?? 0} to="/specialist/appointments" />
        <StatCard icon={FileText} label="تشخيصات حديثة" value={diagnoses.data?.length ?? 0} to="/specialist/diagnoses" />
        <StatCard icon={ClipboardList} label="خطط فردية" value={0} to="/specialist/plans" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold">الأطفال المتابعين</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/specialist/children">عرض الكل <ArrowLeft className="ms-1 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {children.isLoading ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
            ) : (children.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">لم يتم تخصيص أطفال للمتابعة بعد.</p>
            ) : (
              (children.data ?? []).slice(0, 5).map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <Avatar><AvatarFallback className="bg-primary/10 text-primary font-bold">{c.full_name?.[0] ?? "?"}</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{c.full_name}</div>
                    <div className="text-xs text-muted-foreground">{c.grade_level ?? "—"} · {c.disability_type ?? "—"}</div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold">المواعيد القادمة</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/specialist/appointments">عرض الكل <ArrowLeft className="ms-1 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointments.isLoading ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
            ) : (appointments.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد مواعيد قادمة.</p>
            ) : (
              (appointments.data ?? []).map((a: any) => (
                <div key={a.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{a.child?.full_name ?? "—"}</span>
                    <Badge variant="secondary">{a.status}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{new Date(a.scheduled_at).toLocaleString("ar")}</div>
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