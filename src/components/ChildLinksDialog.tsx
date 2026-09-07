import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link2, Loader2, Plus, X } from "lucide-react";
import {
  fetchChildLinks, fetchUsersByRole, linkChildUser, unlinkChildUser, type LinkKind,
} from "@/lib/admin-queries";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const KINDS: { kind: LinkKind; label: string }[] = [
  { kind: "parent", label: "أولياء الأمر" },
  { kind: "specialist", label: "الأخصائيون" },
  { kind: "teacher", label: "المعلمون" },
];

export function ChildLinksDialog({ childId, childName }: { childId: string; childName: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Record<string, string>>({});

  const links = useQuery({
    queryKey: ["admin", "child-links", childId],
    queryFn: () => fetchChildLinks(childId),
    enabled: open,
  });

  const users = {
    parent: useQuery({ queryKey: ["users", "parent"], queryFn: () => fetchUsersByRole("parent"), enabled: open }),
    specialist: useQuery({ queryKey: ["users", "specialist"], queryFn: () => fetchUsersByRole("specialist"), enabled: open }),
    teacher: useQuery({ queryKey: ["users", "teacher"], queryFn: () => fetchUsersByRole("teacher"), enabled: open }),
  };

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "child-links", childId] });
    qc.invalidateQueries({ queryKey: ["admin"] });
  };

  const addLink = useMutation({
    mutationFn: ({ kind, userId }: { kind: LinkKind; userId: string }) => linkChildUser(childId, kind, userId),
    onSuccess: (_d, v) => {
      toast.success("تم الربط بنجاح");
      setPicked((p) => ({ ...p, [v.kind]: "" }));
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "تعذر الربط"),
  });

  const removeLink = useMutation({
    mutationFn: ({ kind, userId }: { kind: LinkKind; userId: string }) => unlinkChildUser(childId, kind, userId),
    onSuccess: () => { toast.success("تم إلغاء الربط"); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "تعذر إلغاء الربط"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-3 w-full">
          <Link2 className="ms-2 h-4 w-4" />
          إدارة الروابط
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>روابط {childName}</DialogTitle>
          <DialogDescription>اربط الطفل بولي الأمر والأخصائي والمعلم المتابعين له.</DialogDescription>
        </DialogHeader>

        {links.isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-5">
            {KINDS.map(({ kind, label }) => {
              const current = (links.data ?? []).filter((l) => l.kind === kind);
              const options = (users[kind].data ?? []).filter(
                (u) => !current.some((c) => c.user_id === u.id),
              );
              return (
                <div key={kind} className="space-y-2 rounded-xl border border-border p-4">
                  <Label>{label}</Label>
                  <div className="flex flex-wrap gap-2">
                    {current.length === 0 && (
                      <span className="text-sm text-muted-foreground">لا يوجد ربط بعد</span>
                    )}
                    {current.map((l) => (
                      <Badge key={l.user_id} variant="secondary" className="gap-1 py-1">
                        {l.full_name}
                        <button
                          type="button"
                          aria-label={`إلغاء ربط ${l.full_name}`}
                          className="rounded-full p-0.5 hover:bg-destructive/15"
                          disabled={removeLink.isPending}
                          onClick={() => removeLink.mutate({ kind, userId: l.user_id })}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={picked[kind] ?? ""}
                      onValueChange={(v) => setPicked((p) => ({ ...p, [kind]: v }))}
                    >
                      <SelectTrigger className="flex-1"><SelectValue placeholder="اختر مستخدماً" /></SelectTrigger>
                      <SelectContent>
                        {options.length === 0 ? (
                          <SelectItem value="__none__" disabled>لا توجد خيارات متاحة</SelectItem>
                        ) : options.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      disabled={!picked[kind] || picked[kind] === "__none__" || addLink.isPending}
                      onClick={() => addLink.mutate({ kind, userId: picked[kind]! })}
                      className="gradient-primary border-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
