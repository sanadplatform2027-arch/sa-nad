import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { MessageCircle, Bell, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/parent/messages")({
  component: MessagesPage,
});

function MessagesPage() {
  const { user } = useAuth();
  const uid = user?.id;

  const notifications = useQuery({
    queryKey: ["parent", uid, "notifications-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", uid!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!uid,
  });

  const messages = useQuery({
    queryKey: ["parent", uid, "messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, sender:profiles!messages_sender_id_fkey(full_name)")
        .or(`recipient_id.eq.${uid},sender_id.eq.${uid}`)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!uid,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">الرسائل والإشعارات</h1>
        <p className="text-sm text-muted-foreground">جميع التنبيهات والمراسلات مع الفريق</p>
      </header>

      <Tabs defaultValue="notifications">
        <TabsList>
          <TabsTrigger value="notifications"><Bell className="me-1 h-4 w-4" />الإشعارات</TabsTrigger>
          <TabsTrigger value="messages"><MessageCircle className="me-1 h-4 w-4" />الرسائل</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-base">الإشعارات</CardTitle></CardHeader>
            <CardContent>
              {notifications.isLoading ? (
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
              ) : (notifications.data ?? []).length === 0 ? (
                <EmptyState icon={Bell} title="لا توجد إشعارات" />
              ) : (
                <div className="divide-y divide-border">
                  {notifications.data!.map((n: any) => (
                    <div key={n.id} className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{n.title}</span>
                        {!n.read_at && <Badge variant="secondary" className="text-[10px]">جديد</Badge>}
                      </div>
                      {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                      <div className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("ar")}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-base">المراسلات</CardTitle></CardHeader>
            <CardContent>
              {messages.isLoading ? (
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
              ) : (messages.data ?? []).length === 0 ? (
                <EmptyState icon={MessageCircle} title="لا توجد رسائل" description="ستظهر هنا المراسلات مع الأخصائي والمعلم." />
              ) : (
                <div className="space-y-3">
                  {messages.data!.map((m: any) => {
                    const mine = m.sender_id === uid;
                    return (
                      <div key={m.id} className={`rounded-2xl p-4 ${mine ? "bg-primary/10 ms-auto max-w-[80%]" : "bg-muted me-auto max-w-[80%]"}`}>
                        <div className="mb-1 text-xs text-muted-foreground">{mine ? "أنت" : m.sender?.full_name ?? "—"} · {new Date(m.created_at).toLocaleString("ar")}</div>
                        <p className="text-sm">{m.content}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}