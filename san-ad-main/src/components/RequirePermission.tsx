import { Link } from "@tanstack/react-router";
import { Loader2, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { homeFor, roleCan, ROLE_LABELS, type Permission } from "@/lib/rbac";
import { Button } from "@/components/ui/button";

export function usePermission(permission: Permission) {
  const { role, loading } = useAuth();
  return { allowed: roleCan(role, permission), loading, role };
}

export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!roleCan(role, permission)) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold">لا تملك صلاحية الوصول</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          هذه الشاشة متاحة لأدوار محددة فقط. دورك الحالي: {role ? ROLE_LABELS[role] : "بدون دور"}.
        </p>
        <Button asChild className="mt-5">
          <Link to={homeFor(role)}>العودة إلى مساحتي</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}