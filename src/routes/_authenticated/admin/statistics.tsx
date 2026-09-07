import { RequirePermission } from "@/components/RequirePermission";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminStats } from "@/lib/admin-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

export const Route = createFileRoute("/_authenticated/admin/statistics")({
  component: GuardedStatsPage,
});

const COLORS = ["#6366F1", "#A78BFA", "#EC4899", "#F59E0B", "#10B981"];

function StatsPage() {
  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: fetchAdminStats });
  const s = stats.data;

  if (stats.isLoading || !s) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const roleData = [
    { name: "أولياء الأمور", value: s.parents },
    { name: "الأخصائيون", value: s.specialists },
    { name: "المعلمون", value: s.teachers },
    { name: "الإداريون", value: s.admins },
  ];

  const contentData = [
    { name: "التقارير", value: s.reports },
    { name: "الخطط الفردية", value: s.plans },
    { name: "الواجبات", value: s.assignments },
    { name: "المواعيد", value: s.appointments },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">الإحصائيات العامة</h1>
        <p className="text-sm text-muted-foreground">تحليل شامل لأداء المنصة والمحتوى.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base font-bold">توزيع المستخدمين حسب الدور</CardTitle></CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={110} label>
                  {roleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base font-bold">نشاط المحتوى</CardTitle></CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contentData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366F1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="إجمالي المستخدمين" value={s.users} />
        <Metric label="إجمالي الأطفال" value={s.children} />
        <Metric label="إجمالي المواعيد" value={s.appointments} />
        <Metric label="التقارير + الخطط" value={s.reports + s.plans} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-bold text-primary">{value}</div>
    </div>
  );
}
function GuardedStatsPage() {
  return (
    <RequirePermission permission="admin.statistics">
      <StatsPage />
    </RequirePermission>
  );
}
