import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyChildIds } from "@/lib/parent-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { FileText, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/parent/diagnosis")({
  component: DiagnosisPage,
});

function DiagnosisPage() {
  const { user } = useAuth();
  const uid = user?.id;

  const ids = useQuery({
    queryKey: ["parent", uid, "child-ids"],
    queryFn: () => fetchMyChildIds(uid!),
    enabled: !!uid,
  });

  const diagnoses = useQuery({
    queryKey: ["parent", uid, "diagnoses", ids.data],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnoses")
        .select("*, child:children(full_name)")
        .in("child_id", ids.data!)
        .order("diagnosed_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!ids.data && ids.data.length > 0,
  });

  const reports = useQuery({
    queryKey: ["parent", uid, "reports", ids.data],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*, child:children(full_name)")
        .in("child_id", ids.data!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!ids.data && ids.data.length > 0,
  });

  const plans = useQuery({
    queryKey: ["parent", uid, "plans", ids.data],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("individual_plans")
        .select("*, child:children(full_name)")
        .in("child_id", ids.data!)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!ids.data && ids.data.length > 0,
  });

  const loading = ids.isLoading || diagnoses.isLoading || reports.isLoading || plans.isLoading;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">التشخيص والتقارير</h1>
        <p className="text-sm text-muted-foreground">جميع تشخيصات وتقارير وخطط أطفالك</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <Tabs defaultValue="diagnoses" className="w-full">
          <TabsList>
            <TabsTrigger value="diagnoses">التشخيصات</TabsTrigger>
            <TabsTrigger value="reports">التقارير</TabsTrigger>
            <TabsTrigger value="plans">الخطط الفردية</TabsTrigger>
          </TabsList>

          <TabsContent value="diagnoses" className="mt-6 space-y-4">
            {(diagnoses.data ?? []).length === 0 ? (
              <EmptyState icon={FileText} title="لا توجد تشخيصات بعد" />
            ) : diagnoses.data!.map((d: any) => (
              <Card key={d.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{d.title}</CardTitle>
                    <Badge>{d.type ?? "—"}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{d.child?.full_name} · {d.diagnosed_at}</div>
                </CardHeader>
                <CardContent><p className="text-sm leading-relaxed">{d.content}</p></CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="reports" className="mt-6 space-y-4">
            {(reports.data ?? []).length === 0 ? (
              <EmptyState icon={FileText} title="لا توجد تقارير بعد" />
            ) : reports.data!.map((r: any) => (
              <Card key={r.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{r.title}</CardTitle>
                    {r.period && <Badge variant="secondary">{r.period}</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">{r.child?.full_name} · {new Date(r.created_at).toLocaleDateString("ar")}</div>
                </CardHeader>
                <CardContent><p className="text-sm leading-relaxed">{r.content}</p></CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="plans" className="mt-6 space-y-4">
            {(plans.data ?? []).length === 0 ? (
              <EmptyState icon={FileText} title="لا توجد خطط فردية بعد" />
            ) : plans.data!.map((p: any) => (
              <Card key={p.id}>
                <CardHeader>
                  <CardTitle className="text-base">خطة فردية — {p.child?.full_name}</CardTitle>
                  <div className="text-xs text-muted-foreground">{p.start_date} → {p.end_date ?? "مستمر"}</div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {p.short_term_goals && <div><div className="font-bold text-primary">أهداف قصيرة المدى</div><p>{p.short_term_goals}</p></div>}
                  {p.long_term_goals && <div><div className="font-bold text-primary">أهداف طويلة المدى</div><p>{p.long_term_goals}</p></div>}
                  {p.activities && <div><div className="font-bold text-primary">الأنشطة</div><p>{p.activities}</p></div>}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}