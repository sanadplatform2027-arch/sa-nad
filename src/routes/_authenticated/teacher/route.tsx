import { RequirePermission } from "@/components/RequirePermission";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell, type NavItem } from "@/components/AppShell";
import { Home, Users, CalendarCheck, ClipboardList, BarChart3, StickyNote, MessageCircle } from "lucide-react";

const nav: NavItem[] = [
  { to: "/teacher", label: "الرئيسية", icon: Home },
  { to: "/teacher/children", label: "التلاميذ", icon: Users },
  { to: "/teacher/attendance", label: "الحضور والغياب", icon: CalendarCheck },
  { to: "/teacher/assignments", label: "الواجبات والأنشطة", icon: ClipboardList },
  { to: "/teacher/grades", label: "النقاط والتقييمات", icon: BarChart3 },
  { to: "/teacher/notes", label: "الملاحظات التربوية", icon: StickyNote },
  { to: "/teacher/messages", label: "التواصل", icon: MessageCircle },
];

export const Route = createFileRoute("/_authenticated/teacher")({
  component: TeacherLayout,
});

function TeacherLayout() {
  return (
    <AppShell title="المعلم" subtitle="منصة سند" nav={nav}>
      <RequirePermission permission="teacher.area">
        <Outlet />
      </RequirePermission>
    </AppShell>
  );
}