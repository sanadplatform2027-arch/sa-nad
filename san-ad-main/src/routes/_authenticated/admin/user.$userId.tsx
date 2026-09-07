import { RequirePermission } from "@/components/RequirePermission";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchUserDetail, fetchUserChildLinks, fetchUserActivity } from "@/lib/admin-queries";
import { getUserAccountInfo } from "@/lib/api/admin-users.functions";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Mail, Clock, Phone, CalendarDays, Users, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/user/$userId")({
  component: GuardedUserDetail,
});

const roleLabel: Record<string, string> = {
  parent: "ولي أمر",
  specialist: "أخصائي نفسي",
  teacher: "معلم",
  admin: "إدارة",
};

const linkLabel: Record<string, string> = {
  parent: "ولي أمر لـ",
  specialist: "أخصائي لـ",
  teacher: "معلم لـ",
};

function fmt(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("ar", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return value;
  }
}

function UserDetailPage() {
  const { userId } = Route.useParams();
  const accountFn = useServerFn(getUserAccountInfo);

  const user = useQuery({ queryKey: ["admin", "user", userId], queryFn: () => fetchUserDetail(userId) });
  const account = useQuery({
    queryKey: ["admin", "user", userId, "account"],
    queryFn: () => accountFn({ data: { userId } }),
  });
  const links = useQuery({ queryKey: ["admin", "user", userId, "links"], queryFn: () => fetchUserChildLinks(userId) });
  const activity = useQuery({ queryKey: ["admin", "user", userId, "activity"], queryFn: () => fetchUserActivity(userId) });

  if (user.isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!user.data) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">لم يتم العثور على هذا المستخدم.</p>
        <Button asChild variant="outline"><Link to="/admin/users">عودة إلى المستخدمين</Link></Button>
      </div>
    );
  }

  const u = user.data as any;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link to="/admin/users"><ArrowRight className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">تفاصيل المستخدم</h1>
          <p className="text-sm text-muted-foreground">البيانات الكاملة والروابط وسجل النشاط.</p>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">{u.full_name?.[0] ?? "?"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="text-lg font-bold">{u.full_name ?? "—"}</div>
            <div className="flex flex-wrap gap-1">
              {u.roles.length === 0 ? (
                <Badge variant="outline">بدون دور</Badge>
              ) : (
                u.roles.map((r: string) => <Badge key={r} variant="secondary">{roleLabel[r] ?? r}</Badge>)
              )}
            </div>
            {u.bio ? <p className="text-sm text-muted-foreground">{u.bio}</p> : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base font-bold">بيانات الحساب</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">البريد الإلكتروني:</span>
              <span className="min-w-0 truncate font-medium">
                {account.isLoading ? "..." : account.isError ? "غير متاح" : account.data?.email ?? "—"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">آخر تسجيل دخول:</span>
              <span className="font-medium">
                {account.isLoading ? "..." : account.isError ? "غير متاح" : fmt(account.data?.last_sign_in_at)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">الهاتف:</span>
              <span className="font-medium">{u.phone ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">تاريخ التسجيل:</span>
              <span className="font-medium">{fmt(u.created_at)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Users className="h-4 w-4 text-primary" /> الأطفال المرتبطون ({links.data?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {links.isLoading ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
            ) : (links.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد روابط بأطفال.</p>
            ) : (
              <ul className="space-y-2">
                {(links.data ?? []).map((l) => (
                  <li key={`${l.kind}-${l.child_id}`} className="flex items-center justify-between rounded-lg border border-border p-2 text-sm">
                    <span className="font-medium">{l.full_name}</span>
                    <Badge variant="outline">{linkLabel[l.kind]?.replace(" لـ", "") ?? l.kind}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Activity className="h-4 w-4 text-primary" /> سجل النشاط
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activity.isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : (activity.data ?? []).length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">لا يوجد نشاط مسجّل لهذا المستخدم.</p>
          ) : (
            <ul className="space-y-2">
              {(activity.data ?? []).map((e) => (
                <li key={e.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary">{e.label}</Badge>
                    <span className="text-xs text-muted-foreground">{fmt(e.created_at)}</span>
                  </div>
                  <div className="mt-1 truncate text-sm font-medium">{e.title}</div>
                  {e.child ? <div className="text-xs text-muted-foreground">الطفل: {e.child}</div> : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function GuardedUserDetail() {
  return (
    <RequirePermission permission="admin.users">
      <UserDetailPage />
    </RequirePermission>
  );
}
