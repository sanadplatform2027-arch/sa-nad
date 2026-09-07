import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { MessageCircle, Loader2, Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/teacher/messages")({
  component: MessagesPage,
});

function MessagesPage() {
  const { user } = useAuth();

  const notifications = useQuery({
    queryKey: ["teacher", user?.id, "notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const messages = useQuery({
    queryKey: ["teacher", user?.id, "messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, child:children(full_name)")
        .or(`sender_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">التواصل</h1>
        <p className="text-sm text-muted-foreground">مراسلة أولياء الأمور والأخصائي النفسي</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" />الإشعارات</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {notifications.isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> :
              (notifications.data ?? []).length === 0 ? (
                <EmptyState icon={Bell} title="لا توجد إشعارات" />
              ) : (
                (notifications.data ?? []).map((n: any) => (
                  <div key={n.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{n.title}</span>
                      {!n.read_at && <Badge variant="secondary" className="text-[10px]">جديد</Badge>}
                    </div>
                    {n.body && <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>}
                  </div>
                ))
              )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageCircle className="h-4 w-4" />الرسائل</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {messages.isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> :
              (messages.data ?? []).length === 0 ? (
                <EmptyState icon={MessageCircle} title="لا توجد رسائل" />
              ) : (
                (messages.data ?? []).map((m: any) => (
                  <div key={m.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{m.sender_id === user?.id ? "أنت" : "وارد"}</span>
                      <span>{new Date(m.created_at).toLocaleString("ar")}</span>
                    </div>
                    <p className="mt-1 text-sm">{m.content}</p>
                    {m.child?.full_name && <p className="mt-1 text-xs text-muted-foreground">بخصوص: {m.child.full_name}</p>}
                  </div>
                ))
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}