import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyChildren } from "@/lib/parent-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Bell, MessageCircle, ArrowLeft, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/parent/")({
  component: ParentHome,
});

function ParentHome() {
  const { user, profile } = useAuth();
  const uid = user?.id;

  const children = useQuery({
    queryKey: ["parent", uid, "children"],
    queryFn: () => fetchMyChildren(uid!),
    enabled: !!uid,
  });

  const notifications = useQuery({
    queryKey: ["parent", uid, "notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", uid!)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!uid,
  });

  const appointments = useQuery({
    queryKey: ["parent", uid, "upcoming-appointments"],
    queryFn: async () => {
      const ids = (children.data ?? []).map((c: any) => c.id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("*, child:children(full_name)")
        .in("child_id", ids)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!uid && !!children.data,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl gradient-hero p-8 text-primary-foreground shadow-elegant">
        <h1 className="text-3xl font-bold">أهلاً، {profile?.full_name ?? "ولي الأمر"} 👋</h1>
        <p className="mt-2 text-primary-foreground/90">إليك ملخصاً سريعاً عن أطفالك ومواعيدك القادمة.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="أطفالي" value={children.data?.length ?? 0} to="/parent/children" />
        <StatCard icon={Calendar} label="مواعيد قادمة" value={appointments.data?.length ?? 0} to="/parent/appointments" />
        <StatCard icon={Bell} label="إشعارات جديدة" value={(notifications.data ?? []).filter((n: any) => !n.read_at).length} to="/parent/messages" />
        <StatCard icon={MessageCircle} label="رسائل" value={0} to="/parent/messages" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold">أطفالي</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/parent/children">عرض الكل <ArrowLeft className="ms-1 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {children.isLoading ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
            ) : (children.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">لم تتم إضافة أي طفل بعد. تواصل مع الإدارة لربط طفلك بحسابك.</p>
            ) : (
              (children.data ?? []).map((c: any) => (
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
            <CardTitle className="text-base font-bold">أحدث الإشعارات</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/parent/messages">عرض الكل <ArrowLeft className="ms-1 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.isLoading ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
            ) : (notifications.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد إشعارات بعد.</p>
            ) : (
              (notifications.data ?? []).map((n: any) => (
                <div key={n.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{n.title}</span>
                    {!n.read_at && <Badge variant="secondary" className="text-[10px]">جديد</Badge>}
                  </div>
                  {n.body && <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>}
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