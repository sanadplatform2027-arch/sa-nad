import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { fetchTeacherChildren } from "@/lib/teacher-queries";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { Users, Loader2, Calendar, GraduationCap, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/teacher/children")({
  component: TeacherChildren,
});

function TeacherChildren() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["teacher", user?.id, "children"],
    queryFn: () => fetchTeacherChildren(user!.id),
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">التلاميذ</h1>
        <p className="text-sm text-muted-foreground">قائمة التلاميذ في قسمك</p>
      </header>

      {q.isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (q.data ?? []).length === 0 ? (
        <EmptyState icon={Users} title="لا يوجد تلاميذ بعد" description="ستظهر هنا قائمة تلاميذك بمجرد إضافتهم." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(q.data ?? []).map((c: any) => (
            <Card key={c.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="gradient-primary text-primary-foreground text-xl font-bold">
                      {c.full_name?.[0] ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{c.full_name}</h3>
                    {c.disability_type && <Badge variant="secondary" className="mt-1">{c.disability_type}</Badge>}
                    <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                      {c.date_of_birth && <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />{c.date_of_birth}</div>}
                      {c.grade_level && <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4" />{c.grade_level}</div>}
                      {c.institution && <div className="flex items-center gap-2"><Building2 className="h-4 w-4" />{c.institution}</div>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}