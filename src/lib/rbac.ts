import type { AppRole } from "@/lib/auth-context";

/** كل صلاحية تمثل شاشة أو إجراءً محدداً داخل المنصة */
export type Permission =
  | "admin.dashboard"
  | "admin.users"
  | "admin.users.manage"
  | "admin.children"
  | "admin.children.manage"
  | "admin.verifications"
  | "admin.appointments"
  | "admin.appointments.manage"
  | "admin.roles"
  | "admin.roles.manage"
  | "admin.statistics"
  | "admin.security"
  | "parent.area"
  | "specialist.area"
  | "teacher.area";

export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  admin: [
    "admin.dashboard",
    "admin.users",
    "admin.users.manage",
    "admin.children",
    "admin.children.manage",
    "admin.verifications",
    "admin.appointments",
    "admin.appointments.manage",
    "admin.roles",
    "admin.roles.manage",
    "admin.statistics",
    "admin.security",
    // الإدارة تملك وصولاً كاملاً لجميع مساحات الأدوار الأخرى
    "parent.area",
    "specialist.area",
    "teacher.area",
  ],
  // واجهة الإدارة المركزية حصرية بدور الإدارة فقط — لا تظهر لأي دور آخر
  specialist: ["specialist.area"],
  teacher: ["teacher.area"],
  parent: ["parent.area"],
};

export const ROLE_LABELS: Record<AppRole, string> = {
  parent: "ولي أمر",
  specialist: "أخصائي نفسي",
  teacher: "معلم",
  admin: "إدارة",
};

export function permissionsFor(role: AppRole | null): Permission[] {
  return role ? ROLE_PERMISSIONS[role] ?? [] : [];
}

export function roleCan(role: AppRole | null, permission: Permission): boolean {
  return permissionsFor(role).includes(permission);
}

/** المسار الافتراضي لكل دور */
export function homeFor(role: AppRole | null): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "specialist":
      return "/specialist";
    case "teacher":
      return "/teacher";
    default:
      return "/parent";
  }
}