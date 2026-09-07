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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { FileText, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/specialist/diagnoses")({
  component: SpecialistDiagnoses,
});

function SpecialistDiagnoses() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const children = useQuery({
    queryKey: ["specialist", user?.id, "children"],
    queryFn: () => fetchSpecialistChildren(user!.id),
    enabled: !!user,
  });

  const childIds = (children.data ?? []).map((c: any) => c.id);

  const diagnoses = useQuery({
    queryKey: ["specialist", user?.id, "diagnoses", childIds],
    queryFn: async () => {
      if (childIds.length === 0) return [];
      const { data, error } = await supabase
        .from("diagnoses")
        .select("*, child:children(full_name)")
        .in("child_id", childIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: childIds.length > 0,
  });

  const [form, setForm] = useState({ child_id: "", type: "psychological", title: "", content: "", diagnosed_at: "" });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("diagnoses").insert({
        child_id: form.child_id,
        type: form.type as any,
        title: form.title,
        content: form.content || null,
        diagnosed_at: form.diagnosed_at || null,
        author_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تمت إضافة التشخيص");
      setOpen(false);
      setForm({ child_id: "", type: "psychological", title: "", content: "", diagnosed_at: "" });
      qc.invalidateQueries({ queryKey: ["specialist", user?.id, "diagnoses"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">التشخيصات والتقارير</h1>
          <p className="text-sm text-muted-foreground">إدارة التشخيصات النفسية والتربوية للأطفال</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="me-2 h-4 w-4" />تشخيص جديد</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>إضافة تشخيص</DialogTitle></DialogHeader>
            <div className="space-y-3">
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
              <div>
                <Label>النوع</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="psychological">نفسي</SelectItem>
                    <SelectItem value="medical">طبي</SelectItem>
                    <SelectItem value="educational">تربوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>العنوان</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>تاريخ التشخيص</Label>
                <Input type="date" value={form.diagnosed_at} onChange={(e) => setForm({ ...form, diagnosed_at: e.target.value })} />
              </div>
              <div>
                <Label>التفاصيل</Label>
                <Textarea rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
              </div>
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

      {diagnoses.isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (diagnoses.data ?? []).length === 0 ? (
        <EmptyState icon={FileText} title="لا توجد تشخيصات بعد" description="ابدأ بإضافة أول تشخيص." />
      ) : (
        <div className="space-y-3">
          {(diagnoses.data ?? []).map((d: any) => (
            <Card key={d.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{d.title}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">{d.child?.full_name} · {d.diagnosed_at ?? d.created_at?.slice(0, 10)}</p>
                  </div>
                  <Badge variant="secondary">{d.type}</Badge>
                </div>
              </CardHeader>
              {d.content && <CardContent><p className="text-sm whitespace-pre-line">{d.content}</p></CardContent>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}