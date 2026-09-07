import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Search, KeyRound, Check, X } from "lucide-react";
import { RequirePermission } from "@/components/RequirePermission";
import { addUserRole, fetchAllUsers, removeUserRole, type AppRoleName } from "@/lib/admin-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS, ROLE_PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/admin/roles")({
  head: () => ({
    meta: [
      { title: "الأدوار والصلاحيات | منصة سند" },
      { name: "description", content: "إدارة أدوار المستخدمين وصلاحياتهم في منصة سند: ولي أمر، أخصائي، معلم، إدارة." },
      { property: "og:title", content: "الأدوار والصلاحيات | منصة سند" },
      { property: "og:description", content: "إدارة أدوار المستخدمين وصلاحياتهم داخل الإدارة المركزية لمنصة سند." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GuardedRolesPage,
});

const ALL_ROLES: AppRoleName[] = ["parent", "specialist", "teacher", "admin"];

function RolesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const users = useQuery({ queryKey: ["admin", "users"], queryFn: fetchAllUsers });

  const toggle = useMutation({
    mutationFn: async (v: { userId: string; role: AppRoleName; has: boolean }) =>
      v.has ? removeUserRole(v.userId, v.role) : addUserRole(v.userId, v.role),
    onSuccess: (_d, v) => {
      toast.success(v.has ? `تم سحب دور "${ROLE_LABELS[v.role]}"` : `تم منح دور "${ROLE_LABELS[v.role]}"`);
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "تعذّر تحديث الدور"),
  });

  const filtered = (users.data ?? []).filter(
    (u: any) => !q || u.full_name?.toLowerCase().includes(q.toLowerCase()) || u.phone?.includes(q),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">الأدوار والصلاحيات</h1>
        <p className="text-sm text-muted-foreground">
          امنح أو اسحب الأدوار من المستخدمين. تتغيّر الصلاحيات والشاشات المتاحة تلقائياً حسب الدور.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ALL_ROLES.map((r) => (
          <Card key={r}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <KeyRound className="h-4 w-4 text-primary" />
                {ROLE_LABELS[r]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {ROLE_PERMISSIONS[r].map((p) => (
                  <Badge key={p} variant="outline" className="font-mono text-[10px]">
                    {p}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">أدوار المستخدمين ({filtered.length})</CardTitle>
          <div className="relative mt-3">
            <Search className="absolute top-2.5 h-4 w-4 text-muted-foreground rtl:right-3 ltr:left-3" />
            <Input
              placeholder="بحث بالاسم أو الهاتف..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="rtl:pr-9 ltr:pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {users.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">لا توجد نتائج.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((u: any) => (
                <div
                  key={u.id}
                  className="flex flex-col gap-3 rounded-xl border border-border p-3 transition hover:bg-muted/30 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 font-bold text-primary">
                        {u.full_name?.[0] ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {u.full_name ?? "—"}
                        {u.id === user?.id && (
                          <span className="text-xs text-muted-foreground"> (أنت)</span>
                        )}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{u.phone ?? "—"}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ALL_ROLES.map((r) => {
                      const has = u.roles.includes(r);
                      const selfAdmin = u.id === user?.id && r === "admin";
                      const busy =
                        toggle.isPending &&
                        toggle.variables?.userId === u.id &&
                        toggle.variables?.role === r;
                      return (
                        <Button
                          key={r}
                          size="sm"
                          variant={has ? "default" : "outline"}
                          disabled={busy || (selfAdmin && has)}
                          title={selfAdmin && has ? "لا يمكنك سحب دور الإدارة من نفسك" : undefined}
                          onClick={() => toggle.mutate({ userId: u.id, role: r, has })}
                        >
                          {busy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : has ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <X className="h-3.5 w-3.5 opacity-50" />
                          )}
                          {ROLE_LABELS[r]}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function GuardedRolesPage() {
  return (
    <RequirePermission permission="admin.roles.manage">
      <RolesPage />
    </RequirePermission>
  );
}