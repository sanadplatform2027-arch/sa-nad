import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { registerMyChild, type ParentChildInput } from "@/lib/parent-queries";
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
  notes: z.string().trim().max(1000).optional(),
});

const empty = {
  full_name: "", date_of_birth: "", gender: NONE, grade_level: "",
  institution: "", disability_type: "", notes: "",
};

/** نموذج يسمح لولي الأمر بتسجيل ابنه — تبقى الصلة بانتظار توثيق الإدارة */
export function ParentChildForm() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });

  const set = (k: keyof typeof empty) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const v = parsed.data;
      const payload: ParentChildInput = {
        full_name: v.full_name,
        date_of_birth: v.date_of_birth || null,
        gender: v.gender && v.gender !== NONE ? v.gender : null,
        grade_level: v.grade_level || null,
        institution: v.institution || null,
        disability_type: v.disability_type || null,
        notes: v.notes || null,
      };
      return registerMyChild(payload, user!.id);
    },
    onSuccess: () => {
      toast.success("تم إرسال طلب التسجيل — بانتظار توثيق الإدارة لصلة القرابة");
      qc.invalidateQueries({ queryKey: ["parent"] });
      setForm({ ...empty });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e?.message || "تعذر تسجيل الطفل"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary border-0 shadow-soft">
          <UserPlus className="ms-2 h-4 w-4" />
          تسجيل ابني
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>تسجيل ابني</DialogTitle>
          <DialogDescription>
            أدخل بيانات طفلك. سيراجع فريق الإدارة الطلب للتأكد من صلة القرابة قبل تفعيل الملف.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
          <div>
            <Label htmlFor="p_full_name">الاسم الكامل *</Label>
            <Input id="p_full_name" required maxLength={100} value={form.full_name} onChange={(e) => set("full_name")(e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="p_dob">تاريخ الميلاد</Label>
              <Input id="p_dob" type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth")(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="p_gender">الجنس</Label>
              <Select value={form.gender} onValueChange={set("gender")}>
                <SelectTrigger id="p_gender"><SelectValue placeholder="غير محدد" /></SelectTrigger>
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
              <Label htmlFor="p_grade">المستوى الدراسي</Label>
              <Input id="p_grade" maxLength={60} value={form.grade_level} onChange={(e) => set("grade_level")(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="p_institution">المؤسسة التعليمية</Label>
              <Input id="p_institution" maxLength={120} value={form.institution} onChange={(e) => set("institution")(e.target.value)} />
            </div>
          </div>

          <div>
            <Label htmlFor="p_disability">نوع الإعاقة / الاحتياج</Label>
            <Input id="p_disability" maxLength={120} value={form.disability_type} onChange={(e) => set("disability_type")(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="p_notes">ملاحظات</Label>
            <Textarea id="p_notes" maxLength={1000} rows={3} value={form.notes} onChange={(e) => set("notes")(e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending} className="gradient-primary border-0">
              {mutation.isPending && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
              إرسال الطلب
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
