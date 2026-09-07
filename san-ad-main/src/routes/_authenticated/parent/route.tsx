import { RequirePermission } from "@/components/RequirePermission";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell, type NavItem } from "@/components/AppShell";
import { Home, User, FileText, TrendingUp, CalendarCheck, ClipboardList, Calendar, MessageCircle } from "lucide-react";

const nav: NavItem[] = [
  { to: "/parent", label: "الرئيسية", icon: Home },
  { to: "/parent/children", label: "أطفالي", icon: User },
  { to: "/parent/diagnosis", label: "التشخيص والتقارير", icon: FileText },
  { to: "/parent/progress", label: "متابعة التقدم", icon: TrendingUp },
  { to: "/parent/attendance", label: "الحضور والغياب", icon: CalendarCheck },
  { to: "/parent/assignments", label: "الواجبات والأنشطة", icon: ClipboardList },
  { to: "/parent/appointments", label: "المواعيد", icon: Calendar },
  { to: "/parent/messages", label: "الرسائل والإشعارات", icon: MessageCircle },
];

export const Route = createFileRoute("/_authenticated/parent")({
  component: ParentLayout,
});

function ParentLayout() {
  return (
    <AppShell title="ولي أمر" subtitle="منصة سند" nav={nav}>
      <RequirePermission permission="parent.area">
        <Outlet />
      </RequirePermission>
    </AppShell>
  );
}