import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { createChild, fetchUsersByRole, type ChildInput } from "@/lib/admin-queries";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NONE = "__none__";

const schema = z.object({
  full_name: z.string().trim().min(2, "الاسم قصير جداً").max(100, "الاسم طويل جداً"),
  date_of_birth: z.string().trim().max(10).optional(),
  gender: z.string().optional(),
  grade_level: z.string().trim().max(60).optional(),
  institution: z.string().trim().max(120).optional(),
  disability_type: z.string().trim().max(120).optional(),
  contact_info: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(1000).optional(),
});

const empty = {
  full_name: "", date_of_birth: "", gender: NONE, grade_level: "",
  institution: "", disability_type: "", contact_info: "", notes: "",
};

export function ChildForm() {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [parentId, setParentId] = useState(NONE);
  const [specialistId, setSpecialistId] = useState(
    role === "specialist" && user ? user.id : NONE,
  );
  const [teacherId, setTeacherId] = useState(NONE);

  const parents = useQuery({ queryKey: ["users", "parent"], queryFn: () => fetchUsersByRole("parent"), enabled: open });
  const specialists = useQuery({ queryKey: ["users", "specialist"], queryFn: () => fetchUsersByRole("specialist"), enabled: open });
  const teachers = useQuery({ queryKey: ["users", "teacher"], queryFn: () => fetchUsersByRole("teacher"), enabled: open });

  const set = (k: keyof typeof empty) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const v = parsed.data;
      const payload: ChildInput = {
        full_name: v.full_name,
        date_of_birth: v.date_of_birth || null,
        gender: v.gender && v.gender !== NONE ? v.gender : null,
        grade_level: v.grade_level || null,
        institution: v.institution || null,
        disability_type: v.disability_type || null,
        contact_info: v.contact_info || null,
        notes: v.notes || null,
      };
      return createChild(
        payload,
        {
          parentId: parentId !== NONE ? parentId : null,
          specialistId: specialistId !== NONE ? specialistId : null,
          teacherId: teacherId !== NONE ? teacherId : null,
        },
        user!.id,
      );
    },
    onSuccess: () => {
      toast.success("تم تسجيل الطفل بنجاح");
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: ["specialist"] });
      setForm({ ...empty });
      setParentId(NONE);
      setSpecialistId(role === "specialist" && user ? user.id : NONE);
      setTeacherId(NONE);
      setOpen(false);
    },
    onError: (e: any) => toast.error(e?.message || "تعذر تسجيل الطفل"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary border-0 shadow-soft">
          <UserPlus className="ms-2 h-4 w-4" />
          تسجيل طفل جديد
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>تسجيل طفل جديد</DialogTitle>
          <DialogDescription>أدخل بيانات الطفل وقم بربطه بولي الأمر والفريق المتابع.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
        >
          <div>
            <Label htmlFor="full_name">الاسم الكامل *</Label>
            <Input id="full_name" required maxLength={100} value={form.full_name} onChange={(e) => set("full_name")(e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="dob">تاريخ الميلاد</Label>
              <Input id="dob" type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth")(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="gender">الجنس</Label>
              <Select value={form.gender} onValueChange={set("gender")}>
                <SelectTrigger id="gender"><SelectValue placeholder="غير محدد" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>غير محدد</SelectItem>
                  <SelectItem value="male">ذكر</SelectItem>
                  <SelectItem value="female">أنثى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="grade">المستوى الدراسي</Label>
              <Input id="grade" maxLength={60} value={form.grade_level} onChange={(e) => set("grade_level")(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="institution">المؤسسة</Label>
              <Input id="institution" maxLength={120} value={form.institution} onChange={(e) => set("institution")(e.target.value)} />
            </div>
          </div>

          <div>
            <Label htmlFor="disability">نوع الإعاقة / الاحتياج</Label>
            <Input id="disability" maxLength={120} value={form.disability_type} onChange={(e) => set("disability_type")(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="contact">بيانات التواصل</Label>
            <Input id="contact" maxLength={200} value={form.contact_info} onChange={(e) => set("contact_info")(e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>ولي الأمر</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>بدون</SelectItem>
                  {(parents.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الأخصائي</Label>
              <Select value={specialistId} onValueChange={setSpecialistId}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>بدون</SelectItem>
                  {(specialists.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>المعلم</Label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>بدون</SelectItem>
                  {(teachers.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea id="notes" maxLength={1000} rows={3} value={form.notes} onChange={(e) => set("notes")(e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending} className="gradient-primary border-0">
              {mutation.isPending && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
              تسجيل الطفل
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
