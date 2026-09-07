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
import { ClipboardList, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/teacher/assignments")({
  component: AssignmentsPage,
});

function AssignmentsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const children = useQuery({
    queryKey: ["teacher", user?.id, "children"],
    queryFn: () => fetchTeacherChildren(user!.id),
    enabled: !!user,
  });
  const ids = (children.data ?? []).map((c: any) => c.id);

  const items = useQuery({
    queryKey: ["teacher", user?.id, "assignments", ids],
    queryFn: async () => {
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("assignments")
        .select("*, child:children(full_name)")
        .in("child_id", ids)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: ids.length > 0,
  });

  const [form, setForm] = useState({ child_id: "", title: "", description: "", due_date: "" });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("assignments").insert({
        child_id: form.child_id,
        title: form.title,
        description: form.description || null,
        due_date: form.due_date || null,
        status: "pending",
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم إنشاء الواجب");
      setOpen(false);
      setForm({ child_id: "", title: "", description: "", due_date: "" });
      qc.invalidateQueries({ queryKey: ["teacher", user?.id, "assignments"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const grade = useMutation({
    mutationFn: async ({ id, grade, feedback }: { id: string; grade: number; feedback: string }) => {
      const { error } = await supabase.from("assignments").update({ grade, feedback, status: "graded" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تقييم الواجب");
      qc.invalidateQueries({ queryKey: ["teacher", user?.id, "assignments"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الواجبات والأنشطة</h1>
          <p className="text-sm text-muted-foreground">إنشاء وتقييم الواجبات</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="me-2 h-4 w-4" />واجب جديد</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>إنشاء واجب</DialogTitle></DialogHeader>
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
              <div><Label>العنوان</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>الوصف</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>تاريخ الاستحقاق</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
              <Button onClick={() => create.mutate()} disabled={!form.child_id || !form.title || create.isPending}>
                {create.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}حفظ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {items.isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (items.data ?? []).length === 0 ? (
        <EmptyState icon={ClipboardList} title="لا توجد واجبات بعد" description="ابدأ بإنشاء أول واجب." />
      ) : (
        <div className="space-y-3">
          {(items.data ?? []).map((a: any) => <AssignmentItem key={a.id} a={a} onGrade={grade.mutate} pending={grade.isPending} />)}
        </div>
      )}
    </div>
  );
}

function AssignmentItem({ a, onGrade, pending }: { a: any; onGrade: (v: { id: string; grade: number; feedback: string }) => void; pending: boolean }) {
  const [g, setG] = useState<number>(a.grade ?? 0);
  const [fb, setFb] = useState<string>(a.feedback ?? "");
  const [show, setShow] = useState(false);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{a.title}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{a.child?.full_name} {a.due_date ? `· ${a.due_date}` : ""}</p>
          </div>
          <Badge variant={a.status === "graded" ? "default" : "secondary"}>{a.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {a.description && <p className="text-sm">{a.description}</p>}
        {a.feedback && <p className="text-sm text-muted-foreground">ملاحظة: {a.feedback}</p>}
        {a.grade != null && <Badge>الدرجة: {a.grade}</Badge>}
        {a.status !== "graded" && (
          show ? (
            <div className="space-y-2 rounded-xl border border-border p-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>الدرجة</Label><Input type="number" value={g} onChange={(e) => setG(Number(e.target.value))} /></div>
              </div>
              <div><Label>ملاحظة</Label><Textarea rows={2} value={fb} onChange={(e) => setFb(e.target.value)} /></div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onGrade({ id: a.id, grade: g, feedback: fb })} disabled={pending}>حفظ التقييم</Button>
                <Button size="sm" variant="outline" onClick={() => setShow(false)}>إلغاء</Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setShow(true)}>تقييم</Button>
          )
        )}
      </CardContent>
    </Card>
  );
}