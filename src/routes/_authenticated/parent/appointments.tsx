import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyChildren, fetchMyChildIds } from "@/lib/parent-queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { Calendar, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/parent/appointments")({
  component: AppointmentsPage,
});

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "بانتظار التأكيد", cls: "bg-warning/15 text-warning-foreground border-warning/30" },
  confirmed: { label: "مؤكد", cls: "bg-success/15 text-success border-success/30" },
  completed: { label: "تم", cls: "bg-muted text-muted-foreground" },
  cancelled: { label: "ملغى", cls: "bg-destructive/15 text-destructive border-destructive/30" },
};

function AppointmentsPage() {
  const { user } = useAuth();
  const uid = user?.id;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const ids = useQuery({ queryKey: ["parent", uid, "child-ids"], queryFn: () => fetchMyChildIds(uid!), enabled: !!uid });
  const children = useQuery({ queryKey: ["parent", uid, "children"], queryFn: () => fetchMyChildren(uid!), enabled: !!uid });

  const list = useQuery({
    queryKey: ["parent", uid, "appointments", ids.data],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, child:children(full_name)")
        .in("child_id", ids.data!)
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!ids.data && ids.data.length > 0,
  });

  const create = useMutation({
    mutationFn: async (payload: { child_id: string; type: any; scheduled_at: string; notes: string }) => {
      const { error } = await supabase.from("appointments").insert({
        ...payload,
        requested_by: uid!,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم إرسال طلب الموعد");
      qc.invalidateQueries({ queryKey: ["parent", uid, "appointments"] });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المواعيد</h1>
          <p className="text-sm text-muted-foreground">مواعيد المتابعة الطبية والنفسية والتربوية</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary border-0"><Plus className="me-1 h-4 w-4" />طلب موعد</Button>
          </DialogTrigger>
          <BookDialog children={children.data ?? []} onSubmit={(v) => create.mutate(v)} loading={create.isPending} />
        </Dialog>
      </header>

      {list.isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (list.data ?? []).length === 0 ? (
        <EmptyState icon={Calendar} title="لا توجد مواعيد بعد" description="اطلب موعداً جديداً مع المختص." />
      ) : (
        <div className="space-y-3">
          {list.data!.map((a: any) => {
            const s = STATUS[a.status] ?? { label: a.status, cls: "" };
            const dt = new Date(a.scheduled_at);
            return (
              <Card key={a.id}>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <div className="font-bold">{a.child?.full_name} · {a.type}</div>
                    <div className="text-xs text-muted-foreground">{dt.toLocaleString("ar")}</div>
                    {a.notes && <p className="mt-2 text-sm">{a.notes}</p>}
                  </div>
                  <Badge variant="outline" className={s.cls}>{s.label}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BookDialog({ children, onSubmit, loading }: { children: any[]; onSubmit: (v: any) => void; loading: boolean }) {
  const [childId, setChildId] = useState("");
  const [type, setType] = useState<string>("psychological");
  const [when, setWhen] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>طلب موعد جديد</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div>
          <Label>الطفل</Label>
          <Select value={childId} onValueChange={setChildId}>
            <SelectTrigger><SelectValue placeholder="اختر طفلاً" /></SelectTrigger>
            <SelectContent>{children.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>نوع الموعد</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="psychological">نفسي</SelectItem>
              <SelectItem value="medical">طبي</SelectItem>
              <SelectItem value="educational">تربوي</SelectItem>
              <SelectItem value="other">آخر</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>التاريخ والوقت</Label>
          <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        </div>
        <div>
          <Label>ملاحظات</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="سبب الزيارة أو أي توضيح" />
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={!childId || !when || loading}
          onClick={() => onSubmit({ child_id: childId, type, scheduled_at: new Date(when).toISOString(), notes })}
          className="gradient-primary border-0"
        >
          {loading && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}إرسال الطلب
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}