import { RequirePermission } from "@/components/RequirePermission";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { fetchAllUsers } from "@/lib/admin-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Search, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { deleteUserAccount } from "@/lib/api/admin-users.functions";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: GuardedUsersPage,
});

const roleLabel: Record<string, string> = {
  parent: "ولي أمر",
  specialist: "أخصائي نفسي",
  teacher: "معلم",
  admin: "إدارة",
};

function UsersPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const users = useQuery({ queryKey: ["admin", "users"], queryFn: fetchAllUsers });
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const removeUser = useServerFn(deleteUserAccount);
  const [target, setTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!target) return;
    setDeleting(true);
    try {
      await removeUser({ data: { userId: target.id } });
      toast.success("تم حذف الحساب نهائياً");
      setTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    } catch (e: any) {
      toast.error(e?.message ?? "تعذر حذف الحساب");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = (users.data ?? []).filter((u: any) => {
    const matchQ = !q || u.full_name?.toLowerCase().includes(q.toLowerCase()) || u.phone?.includes(q);
    const matchR = filter === "all" || u.roles.includes(filter);
    return matchQ && matchR;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
        <p className="text-sm text-muted-foreground">جميع المستخدمين في المنصة مع أدوارهم.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-bold">قائمة المستخدمين ({filtered.length})</CardTitle>
            <div className="flex flex-wrap gap-2">
              {["all", "parent", "specialist", "teacher", "admin"].map((r) => (
                <button
                  key={r}
                  onClick={() => setFilter(r)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    filter === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {r === "all" ? "الكل" : roleLabel[r]}
                </button>
              ))}
            </div>
          </div>
          <div className="relative mt-3">
            <Search className="absolute top-2.5 h-4 w-4 text-muted-foreground rtl:right-3 ltr:left-3" />
            <Input placeholder="بحث بالاسم أو الهاتف..." value={q} onChange={(e) => setQ(e.target.value)} className="rtl:pr-9 ltr:pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {users.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">لا توجد نتائج.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((u: any) => (
                <div key={u.id} className="flex items-center gap-2 rounded-xl border border-border p-3 transition hover:bg-muted/30">
                <Link
                  to="/admin/user/$userId"
                  params={{ userId: u.id }}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {u.full_name?.[0] ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{u.full_name ?? "—"}</div>
                    <div className="truncate text-xs text-muted-foreground">{u.phone ?? "—"}</div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {u.roles.length === 0 ? (
                      <Badge variant="outline">بدون دور</Badge>
                    ) : (
                      u.roles.map((r: string) => (
                        <Badge key={r} variant="secondary">{roleLabel[r] ?? r}</Badge>
                      ))
                    )}
                  </div>
                </Link>
                {u.id !== user?.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="حذف الحساب"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setTarget({ id: u.id, name: u.full_name ?? "هذا المستخدم" })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الحساب نهائياً؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف حساب «{target?.name}» وكل بياناته المرتبطة نهائياً، ولا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void handleDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "جارٍ الحذف..." : "حذف نهائي"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
function GuardedUsersPage() {
  return (
    <RequirePermission permission="admin.users">
      <UsersPage />
    </RequirePermission>
  );
}
