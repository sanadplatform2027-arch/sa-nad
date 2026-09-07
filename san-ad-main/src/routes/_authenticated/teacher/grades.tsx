import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { fetchTeacherChildren } from "@/lib/teacher-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { BarChart3, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/teacher/grades")({
  component: GradesPage,
});

function GradesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const children = useQuery({
    queryKey: ["teacher", user?.id, "children"],
    queryFn: () => fetchTeacherChildren(user!.id),
    enabled: !!user,
  });
  const ids = (children.data ?? []).map((c: any) => c.id);

  const grades = useQuery({
    queryKey: ["teacher", user?.id, "grades", ids],
    queryFn: async () => {
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("grades")
        .select("*, child:children(full_name)")
        .in("child_id", ids)
        .order("date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: ids.length > 0,
  });

  const [form, setForm] = useState({ child_id: "", subject: "", type: "quiz", score: 0, max_score: 100, notes: "", date: new Date().toISOString().slice(0, 10) });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("grades").insert({
        child_id: form.child_id,
        subject: form.subject,
        type: form.type as any,
        score: Number(form.score),
        max_score: Number(form.max_score),
        notes: form.notes || null,
        date: form.date,
        recorded_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تسجيل النقطة");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["teacher", user?.id, "grades"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">النقاط والتقييمات</h1>
          <p className="text-sm text-muted-foreground">سجل الاختبارات والمشاركة والواجبات</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="me-2 h-4 w-4" />نقطة جديدة</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>تسجيل نقطة</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>التلميذ</Label>
                <Select value={form.child_id} onValueChange={(v) => setForm({ ...form, child_id: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر التلميذ" /></SelectTrigger>
                  <SelectContent>
                    {(children.data ?? []).map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>المادة</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
                <div>
                  <Label>النوع</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quiz">اختبار قصير</SelectItem>
                      <SelectItem value="exam">اختبار</SelectItem>
                      <SelectItem value="homework">واجب</SelectItem>
                      <SelectItem value="participation">مشاركة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>الدرجة</Label><Input type="number" value={form.score} onChange={(e) => setForm({ ...form, score: Number(e.target.value) })} /></div>
                <div><Label>من</Label><Input type="number" value={form.max_score} onChange={(e) => setForm({ ...form, max_score: Number(e.target.value) })} /></div>
                <div><Label>التاريخ</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              </div>
              <div><Label>ملاحظات</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
              <Button onClick={() => create.mutate()} disabled={!form.child_id || !form.subject || create.isPending}>
                {create.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}حفظ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {grades.isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (grades.data ?? []).length === 0 ? (
        <EmptyState icon={BarChart3} title="لا توجد نقاط بعد" description="ابدأ بتسجيل أول نقطة." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {(grades.data ?? []).map((g: any) => {
            const pct = Math.round((g.score / g.max_score) * 100);
            return (
              <Card key={g.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{g.subject}</CardTitle>
                      <p className="text-xs text-muted-foreground">{g.child?.full_name} · {g.date}</p>
                    </div>
                    <Badge variant={pct >= 70 ? "default" : "secondary"}>{g.score}/{g.max_score}</Badge>
                  </div>
                </CardHeader>
                {g.notes && <CardContent><p className="text-sm">{g.notes}</p></CardContent>}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}