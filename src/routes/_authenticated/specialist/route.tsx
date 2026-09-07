import { RequirePermission } from "@/components/RequirePermission";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell, type NavItem } from "@/components/AppShell";
import { Home, Users, FileText, ClipboardList, Calendar, StickyNote, MessageCircle, BarChart3 } from "lucide-react";

const nav: NavItem[] = [
  { to: "/specialist", label: "الرئيسية", icon: Home },
  { to: "/specialist/children", label: "الأطفال المتابعين", icon: Users },
  { to: "/specialist/diagnoses", label: "التشخيصات والتقارير", icon: FileText },
  { to: "/specialist/plans", label: "الخطط الفردية", icon: ClipboardList },
  { to: "/specialist/notes", label: "الملاحظات النفسية", icon: StickyNote },
  { to: "/specialist/evaluations", label: "التقييمات", icon: BarChart3 },
  { to: "/specialist/appointments", label: "المواعيد", icon: Calendar },
  { to: "/specialist/messages", label: "الرسائل", icon: MessageCircle },
];

export const Route = createFileRoute("/_authenticated/specialist")({
  component: SpecialistLayout,
});

function SpecialistLayout() {
  return (
    <AppShell title="الأخصائي النفسي" subtitle="منصة سند" nav={nav}>
      <RequirePermission permission="specialist.area">
        <Outlet />
      </RequirePermission>
    </AppShell>
  );
}