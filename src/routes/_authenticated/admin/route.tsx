import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell, type NavItem } from "@/components/AppShell";
import { LayoutDashboard, Users, Baby, CalendarDays, BarChart3, Shield, KeyRound, BadgeCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { roleCan, type Permission } from "@/lib/rbac";
import { RequirePermission } from "@/components/RequirePermission";

const nav: (NavItem & { permission: Permission })[] = [
  { to: "/admin", label: "لوحة التحكم", icon: LayoutDashboard, permission: "admin.dashboard" },
  { to: "/admin/users", label: "المستخدمون", icon: Users, permission: "admin.users" },
  { to: "/admin/children", label: "الأطفال", icon: Baby, permission: "admin.children" },
  { to: "/admin/verifications", label: "توثيق صلة القرابة", icon: BadgeCheck, permission: "admin.verifications" },
  { to: "/admin/appointments", label: "المواعيد", icon: CalendarDays, permission: "admin.appointments" },
  { to: "/admin/roles", label: "الأدوار والصلاحيات", icon: KeyRound, permission: "admin.roles" },
  { to: "/admin/statistics", label: "الإحصائيات", icon: BarChart3, permission: "admin.statistics" },
  { to: "/admin/security", label: "الأمان والصلاحيات", icon: Shield, permission: "admin.security" },
];

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { role } = useAuth();
  const allowedNav = nav.filter((item) => roleCan(role, item.permission));

  return (
    <AppShell title="الإدارة المركزية" subtitle="منصة سند" nav={allowedNav}>
      <RequirePermission permission="admin.dashboard">
        <Outlet />
      </RequirePermission>
    </AppShell>
  );
}