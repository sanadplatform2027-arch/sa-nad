import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { fetchTeacherChildren } from "@/lib/teacher-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { StickyNote, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/teacher/notes")({
  component: NotesPage,
});

function NotesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const children = useQuery({
    queryKey: ["teacher", user?.id, "children"],
    queryFn: () => fetchTeacherChildren(user!.id),
    enabled: !!user,
  });
  const ids = (children.data ?? []).map((c: any) => c.id);

  const notes = useQuery({
    queryKey: ["teacher", user?.id, "notes", ids],
    queryFn: async () => {
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("child_notes")
        .select("*, child:children(full_name)")
        .in("child_id", ids)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: ids.length > 0,
  });

  const [form, setForm] = useState({ child_id: "", category: "behavior", content: "" });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("child_notes").insert({
        child_id: form.child_id,
        category: form.category as any,
        content: form.content,
        author_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تمت إضافة الملاحظة");
      setOpen(false);
      setForm({ child_id: "", category: "behavior", content: "" });
      qc.invalidateQueries({ queryKey: ["teacher", user?.id, "notes"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الملاحظات التربوية والسلوكية</h1>
          <p className="text-sm text-muted-foreground">السلوك، التفاعل، الصعوبات والتحسن</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="me-2 h-4 w-4" />ملاحظة جديدة</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>إضافة ملاحظة</DialogTitle></DialogHeader>
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
              <div>
                <Label>التصنيف</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="behavior">سلوكي</SelectItem>
                    <SelectItem value="social">اجتماعي</SelectItem>
                    <SelectItem value="academic">أكاديمي</SelectItem>
                    <SelectItem value="progress">تحسن</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>المحتوى</Label><Textarea rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
              <Button onClick={() => create.mutate()} disabled={!form.child_id || !form.content || create.isPending}>
                {create.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}حفظ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {notes.isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (notes.data ?? []).length === 0 ? (
        <EmptyState icon={StickyNote} title="لا توجد ملاحظات بعد" description="ابدأ بإضافة ملاحظتك الأولى." />
      ) : (
        <div className="space-y-3">
          {(notes.data ?? []).map((n: any) => (
            <Card key={n.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{n.child?.full_name}</CardTitle>
                  <Badge variant="secondary">{n.category}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("ar")}</p>
              </CardHeader>
              <CardContent><p className="text-sm whitespace-pre-line">{n.content}</p></CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}