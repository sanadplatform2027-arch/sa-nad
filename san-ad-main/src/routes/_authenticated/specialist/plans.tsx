import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { fetchSpecialistChildren } from "@/lib/specialist-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { ClipboardList, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/specialist/plans")({
  component: SpecialistPlans,
});

function SpecialistPlans() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const children = useQuery({
    queryKey: ["specialist", user?.id, "children"],
    queryFn: () => fetchSpecialistChildren(user!.id),
    enabled: !!user,
  });
  const ids = (children.data ?? []).map((c: any) => c.id);

  const plans = useQuery({
    queryKey: ["specialist", user?.id, "plans", ids],
    queryFn: async () => {
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("individual_plans")
        .select("*, child:children(full_name)")
        .in("child_id", ids)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: ids.length > 0,
  });

  const [form, setForm] = useState({
    child_id: "",
    short_term_goals: "",
    long_term_goals: "",
    activities: "",
    evaluation_indicators: "",
    start_date: "",
    end_date: "",
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("individual_plans").insert({
        ...form,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        author_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تمت إضافة الخطة");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["specialist", user?.id, "plans"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الخطط الفردية</h1>
          <p className="text-sm text-muted-foreground">صياغة الأهداف والأنشطة ومؤشرات التقييم</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="me-2 h-4 w-4" />خطة جديدة</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>إنشاء خطة فردية</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <div>
                <Label>الطفل</Label>
                <Select value={form.child_id} onValueChange={(v) => setForm({ ...form, child_id: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر الطفل" /></SelectTrigger>
                  <SelectContent>
                    {(children.data ?? []).map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>تاريخ البدء</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                <div><Label>تاريخ الانتهاء</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
              </div>
              <div><Label>أهداف قصيرة المدى</Label><Textarea rows={3} value={form.short_term_goals} onChange={(e) => setForm({ ...form, short_term_goals: e.target.value })} /></div>
              <div><Label>أهداف بعيدة المدى</Label><Textarea rows={3} value={form.long_term_goals} onChange={(e) => setForm({ ...form, long_term_goals: e.target.value })} /></div>
              <div><Label>الأنشطة المقترحة</Label><Textarea rows={3} value={form.activities} onChange={(e) => setForm({ ...form, activities: e.target.value })} /></div>
              <div><Label>مؤشرات التقييم</Label><Textarea rows={3} value={form.evaluation_indicators} onChange={(e) => setForm({ ...form, evaluation_indicators: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
              <Button onClick={() => create.mutate()} disabled={!form.child_id || create.isPending}>
                {create.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}حفظ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {plans.isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (plans.data ?? []).length === 0 ? (
        <EmptyState icon={ClipboardList} title="لا توجد خطط بعد" description="ابدأ بإنشاء خطة فردية." />
      ) : (
        <div className="space-y-3">
          {(plans.data ?? []).map((p: any) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle className="text-base">{p.child?.full_name ?? "—"}</CardTitle>
                <p className="text-xs text-muted-foreground">{p.start_date ?? "—"} → {p.end_date ?? "—"}</p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {p.short_term_goals && <Section label="أهداف قصيرة المدى" value={p.short_term_goals} />}
                {p.long_term_goals && <Section label="أهداف بعيدة المدى" value={p.long_term_goals} />}
                {p.activities && <Section label="الأنشطة" value={p.activities} />}
                {p.evaluation_indicators && <Section label="مؤشرات التقييم" value={p.evaluation_indicators} />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold text-primary">{label}</div>
      <p className="mt-1 whitespace-pre-line">{value}</p>
    </div>
  );
}