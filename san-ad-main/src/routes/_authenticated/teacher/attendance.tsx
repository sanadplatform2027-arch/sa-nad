import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { fetchTeacherChildren } from "@/lib/teacher-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/EmptyState";
import { CalendarCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Status = "present" | "absent" | "late" | "excused";
const STATUS_LABEL: Record<Status, string> = { present: "حاضر", absent: "غائب", late: "متأخر", excused: "بعذر" };

export const Route = createFileRoute("/_authenticated/teacher/attendance")({
  component: AttendancePage,
});

function AttendancePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const children = useQuery({
    queryKey: ["teacher", user?.id, "children"],
    queryFn: () => fetchTeacherChildren(user!.id),
    enabled: !!user,
  });
  const ids = (children.data ?? []).map((c: any) => c.id);

  const records = useQuery({
    queryKey: ["teacher", user?.id, "attendance", date, ids],
    queryFn: async () => {
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .in("child_id", ids)
        .eq("date", date);
      if (error) throw error;
      return data ?? [];
    },
    enabled: ids.length > 0,
  });

  const mark = useMutation({
    mutationFn: async ({ childId, status }: { childId: string; status: Status }) => {
      const existing = (records.data ?? []).find((r: any) => r.child_id === childId);
      if (existing) {
        const { error } = await supabase.from("attendance").update({ status }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("attendance").insert({
          child_id: childId,
          date,
          status,
          recorded_by: user!.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("تم تسجيل الحضور");
      qc.invalidateQueries({ queryKey: ["teacher", user?.id, "attendance"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">الحضور والغياب</h1>
          <p className="text-sm text-muted-foreground">سجل حضور التلاميذ يومياً</p>
        </div>
        <div className="w-44">
          <Label className="text-xs">التاريخ</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </header>

      {children.isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (children.data ?? []).length === 0 ? (
        <EmptyState icon={CalendarCheck} title="لا يوجد تلاميذ" description="أضف تلاميذ لقسمك لتسجيل حضورهم." />
      ) : (
        <div className="space-y-2">
          {(children.data ?? []).map((c: any) => {
            const rec = (records.data ?? []).find((r: any) => r.child_id === c.id);
            const current = rec?.status as Status | undefined;
            return (
              <Card key={c.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{c.full_name}</CardTitle>
                    {current && <span className="text-xs text-muted-foreground">{STATUS_LABEL[current]}</span>}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={current === s ? "default" : "outline"}
                        onClick={() => mark.mutate({ childId: c.id, status: s })}
                      >
                        {STATUS_LABEL[s]}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}