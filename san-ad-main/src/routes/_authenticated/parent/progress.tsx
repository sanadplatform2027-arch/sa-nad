import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyChildIds } from "@/lib/parent-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { TrendingUp, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/parent/progress")({
  component: ProgressPage,
});

function ProgressPage() {
  const { user } = useAuth();
  const uid = user?.id;

  const ids = useQuery({
    queryKey: ["parent", uid, "child-ids"],
    queryFn: () => fetchMyChildIds(uid!),
    enabled: !!uid,
  });

  const grades = useQuery({
    queryKey: ["parent", uid, "grades", ids.data],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grades")
        .select("*, child:children(full_name)")
        .in("child_id", ids.data!)
        .order("date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!ids.data && ids.data.length > 0,
  });

  const notes = useQuery({
    queryKey: ["parent", uid, "notes", ids.data],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("child_notes")
        .select("*, child:children(full_name)")
        .in("child_id", ids.data!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!ids.data && ids.data.length > 0,
  });

  // Group grades by child for chart
  const byChild = new Map<string, { name: string; rows: any[] }>();
  (grades.data ?? []).forEach((g: any) => {
    if (!byChild.has(g.child_id)) byChild.set(g.child_id, { name: g.child?.full_name ?? "—", rows: [] });
    byChild.get(g.child_id)!.rows.push({
      date: g.date,
      score: g.max_score ? Math.round((g.score / g.max_score) * 100) : g.score,
    });
  });

  const loading = ids.isLoading || grades.isLoading;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">متابعة التقدم</h1>
        <p className="text-sm text-muted-foreground">النقاط، الملاحظات، ونقاط القوة والصعوبات</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : byChild.size === 0 ? (
        <EmptyState icon={TrendingUp} title="لا توجد بيانات تقدم بعد" description="ستظهر هنا نقاط ومخططات تطور طفلك." />
      ) : (
        <div className="space-y-6">
          {Array.from(byChild.entries()).map(([cid, { name, rows }]) => (
            <Card key={cid}>
              <CardHeader>
                <CardTitle className="text-base">تطور النقاط — {name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={rows}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={12} />
                      <YAxis stroke="var(--color-muted-foreground)" fontSize={12} domain={[0, 100]} />
                      <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                      <Line type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(notes.data ?? []).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">آخر الملاحظات</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {notes.data!.map((n: any) => (
              <div key={n.id} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{n.child?.full_name} · {n.category ?? "ملاحظة"}</span>
                  <span>{new Date(n.created_at).toLocaleDateString("ar")}</span>
                </div>
                <p className="mt-1 text-sm">{n.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}