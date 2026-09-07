import { RequirePermission } from "@/components/RequirePermission";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchAllAppointments } from "@/lib/admin-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/appointments")({
  component: GuardedAppointmentsPage,
});

const statusLabel: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  cancelled: "ملغى",
  completed: "مكتمل",
  rejected: "مرفوض",
};

function AppointmentsPage() {
  const [filter, setFilter] = useState<string>("all");
  const appts = useQuery({ queryKey: ["admin", "appointments"], queryFn: fetchAllAppointments });
  const filtered = (appts.data ?? []).filter((a: any) => filter === "all" || a.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">جميع المواعيد</h1>
        <p className="text-sm text-muted-foreground">مواعيد المنصة عبر جميع الأخصائيين وأولياء الأمور.</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-bold">القائمة ({filtered.length})</CardTitle>
            <div className="flex flex-wrap gap-2">
              {["all", "pending", "confirmed", "completed", "cancelled"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    filter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {s === "all" ? "الكل" : statusLabel[s]}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {appts.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">لا توجد مواعيد.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{a.type ?? "موعد"} — {a.child?.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.scheduled_at ? new Date(a.scheduled_at).toLocaleString("ar-EG") : "—"}
                    </div>
                  </div>
                  <Badge variant="secondary">{statusLabel[a.status] ?? a.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
function GuardedAppointmentsPage() {
  return (
    <RequirePermission permission="admin.appointments">
      <AppointmentsPage />
    </RequirePermission>
  );
}
