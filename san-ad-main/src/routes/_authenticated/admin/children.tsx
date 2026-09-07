import { RequirePermission } from "@/components/RequirePermission";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchAllChildren } from "@/lib/admin-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";
import { ChildForm } from "@/components/ChildForm";
import { ChildLinksDialog } from "@/components/ChildLinksDialog";
import { usePermission } from "@/components/RequirePermission";


export const Route = createFileRoute("/_authenticated/admin/children")({
  component: GuardedChildrenPage,
});

function ChildrenPage() {
  const [q, setQ] = useState("");
  const { allowed: canManage } = usePermission("admin.children.manage");
  const children = useQuery({ queryKey: ["admin", "children"], queryFn: fetchAllChildren });
  const filtered = (children.data ?? []).filter((c: any) =>
    !q || c.full_name?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">الأطفال المسجلون</h1>
          <p className="text-sm text-muted-foreground">قائمة كاملة بجميع الأطفال في المنصة.</p>
        </div>
        {canManage && <ChildForm />}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">القائمة ({filtered.length})</CardTitle>
          <div className="relative mt-3">
            <Search className="absolute top-2.5 h-4 w-4 text-muted-foreground rtl:right-3 ltr:left-3" />
            <Input placeholder="بحث بالاسم..." value={q} onChange={(e) => setQ(e.target.value)} className="rtl:pr-9 ltr:pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {children.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">لا يوجد أطفال.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c: any) => (
                <div key={c.id} className="rounded-xl border border-border p-4 transition hover:shadow-soft">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {c.full_name?.[0] ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{c.full_name}</div>
                      <div className="text-xs text-muted-foreground">{c.grade_level ?? "—"}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {c.gender && <Badge variant="outline">{c.gender === "male" ? "ذكر" : "أنثى"}</Badge>}
                    {c.date_of_birth && <Badge variant="secondary">{new Date(c.date_of_birth).toLocaleDateString("ar-EG")}</Badge>}
                  </div>
                  {canManage && <ChildLinksDialog childId={c.id} childName={c.full_name} />}
                </div>

              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
function GuardedChildrenPage() {
  return (
    <RequirePermission permission="admin.children">
      <ChildrenPage />
    </RequirePermission>
  );
}
