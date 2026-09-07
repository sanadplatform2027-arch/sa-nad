import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { Calendar, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/specialist/appointments")({
  component: AppointmentsPage,
});

function AppointmentsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const appts = useQuery({
    queryKey: ["specialist", user?.id, "appointments-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, child:children(full_name)")
        .or(`specialist_id.eq.${user!.id},requested_by.eq.${user!.id}`)
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("appointments").update({ status: status as any, specialist_id: user!.id }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تحديث الموعد");
      qc.invalidateQueries({ queryKey: ["specialist", user?.id, "appointments-all"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">المواعيد</h1>
        <p className="text-sm text-muted-foreground">إدارة الجلسات وطلبات الحجز</p>
      </header>

      {appts.isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (appts.data ?? []).length === 0 ? (
        <EmptyState icon={Calendar} title="لا توجد مواعيد" description="ستظهر هنا طلبات الحجز والجلسات." />
      ) : (
        <div className="space-y-3">
          {(appts.data ?? []).map((a: any) => (
            <Card key={a.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{a.child?.full_name ?? "—"}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(a.scheduled_at).toLocaleString("ar")} · {a.type}</p>
                  </div>
                  <Badge variant={a.status === "confirmed" ? "default" : "secondary"}>{a.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {a.notes && <p className="text-sm">{a.notes}</p>}
                {a.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => update.mutate({ id: a.id, status: "confirmed" })}>
                      <Check className="me-1 h-4 w-4" />تأكيد
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => update.mutate({ id: a.id, status: "cancelled" })}>
                      <X className="me-1 h-4 w-4" />رفض
                    </Button>
                  </div>
                )}
                {a.status === "confirmed" && (
                  <Button size="sm" variant="outline" onClick={() => update.mutate({ id: a.id, status: "completed" })}>
                    تمييز كمكتمل
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}