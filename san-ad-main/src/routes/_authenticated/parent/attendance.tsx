import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyChildIds } from "@/lib/parent-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { CalendarCheck, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/parent/attendance")({
  component: AttendancePage,
});

const STATUS: Record<string, { label: string; cls: string }> = {
  present: { label: "حاضر", cls: "bg-success/15 text-success border-success/30" },
  absent: { label: "غائب", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  late: { label: "متأخر", cls: "bg-warning/15 text-warning-foreground border-warning/30" },
  excused: { label: "بعذر", cls: "bg-info/15 text-info border-info/30" },
};

function AttendancePage() {
  const { user } = useAuth();
  const uid = user?.id;
  const ids = useQuery({ queryKey: ["parent", uid, "child-ids"], queryFn: () => fetchMyChildIds(uid!), enabled: !!uid });
  const att = useQuery({
    queryKey: ["parent", uid, "attendance", ids.data],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*, child:children(full_name)")
        .in("child_id", ids.data!)
        .order("date", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!ids.data && ids.data.length > 0,
  });

  const total = att.data?.length ?? 0;
  const present = (att.data ?? []).filter((a: any) => a.status === "present").length;
  const rate = total ? Math.round((present / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">الحضور والغياب</h1>
        <p className="text-sm text-muted-foreground">سجل آخر 60 يوماً مع نسبة الحضور</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">إجمالي الأيام</div><div className="text-2xl font-bold">{total}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">أيام الحضور</div><div className="text-2xl font-bold text-success">{present}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">نسبة الحضور</div><div className="text-2xl font-bold text-primary">{rate}%</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">السجل</CardTitle></CardHeader>
        <CardContent>
          {att.isLoading ? (
            <Loader2 className="mx-auto my-6 h-5 w-5 animate-spin text-muted-foreground" />
          ) : total === 0 ? (
            <EmptyState icon={CalendarCheck} title="لا توجد سجلات حضور بعد" />
          ) : (
            <div className="divide-y divide-border">
              {att.data!.map((a: any) => {
                const s = STATUS[a.status] ?? { label: a.status, cls: "" };
                return (
                  <div key={a.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium">{a.child?.full_name}</div>
                      <div className="text-xs text-muted-foreground">{a.date}{a.reason ? ` · ${a.reason}` : ""}</div>
                    </div>
                    <Badge variant="outline" className={s.cls}>{s.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}