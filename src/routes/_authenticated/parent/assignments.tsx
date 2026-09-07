import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyChildIds } from "@/lib/parent-queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { ClipboardList, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/parent/assignments")({
  component: AssignmentsPage,
});

const STATUS: Record<string, string> = {
  pending: "قيد التنفيذ",
  submitted: "مُسلَّم",
  graded: "تم التقييم",
  overdue: "متأخر",
};

function AssignmentsPage() {
  const { user } = useAuth();
  const uid = user?.id;
  const ids = useQuery({ queryKey: ["parent", uid, "child-ids"], queryFn: () => fetchMyChildIds(uid!), enabled: !!uid });
  const q = useQuery({
    queryKey: ["parent", uid, "assignments", ids.data],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("*, child:children(full_name)")
        .in("child_id", ids.data!)
        .order("due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!ids.data && ids.data.length > 0,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">الواجبات والأنشطة</h1>
        <p className="text-sm text-muted-foreground">المهام المطلوبة من طفلك ونتائج التقييم</p>
      </header>

      {q.isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (q.data ?? []).length === 0 ? (
        <EmptyState icon={ClipboardList} title="لا توجد واجبات بعد" />
      ) : (
        <div className="space-y-3">
          {q.data!.map((a: any) => (
            <Card key={a.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-bold">{a.title}</h3>
                    <div className="text-xs text-muted-foreground">{a.child?.full_name} · {a.due_date ? `بحلول ${a.due_date}` : "بدون موعد محدد"}</div>
                    {a.description && <p className="mt-2 text-sm">{a.description}</p>}
                    {a.feedback && <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm"><span className="font-bold">تعليق المعلم: </span>{a.feedback}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary">{STATUS[a.status] ?? a.status}</Badge>
                    {a.grade != null && <div className="text-lg font-bold text-primary">{a.grade}</div>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}