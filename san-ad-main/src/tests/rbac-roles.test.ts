import { describe, expect, it } from "vitest";
import type { AppRole } from "@/lib/auth-context";
import { ROLE_PERMISSIONS, permissionsFor, roleCan, type Permission } from "@/lib/rbac";

const ROLES: AppRole[] = ["parent", "specialist", "teacher", "admin"];

/** الصلاحيات التي تمنح إدارة/كتابة على بيانات الأطفال */
const CHILD_WRITE: Permission[] = ["admin.children.manage"];
/** الصلاحيات الإدارية الحساسة */
const SENSITIVE_ADMIN: Permission[] = [
  "admin.users",
  "admin.users.manage",
  "admin.roles",
  "admin.roles.manage",
  "admin.security",
  "admin.appointments.manage",
];

describe("مصفوفة صلاحيات الأدوار", () => {
  it("كل دور يملك مساحته الخاصة فقط", () => {
    expect(roleCan("parent", "parent.area")).toBe(true);
    expect(roleCan("teacher", "teacher.area")).toBe(true);
    expect(roleCan("specialist", "specialist.area")).toBe(true);
    // لا تسرّب بين المساحات (ما عدا الإدارة)
    expect(roleCan("parent", "specialist.area")).toBe(false);
    expect(roleCan("parent", "teacher.area")).toBe(false);
    expect(roleCan("teacher", "parent.area")).toBe(false);
    expect(roleCan("teacher", "specialist.area")).toBe(false);
    expect(roleCan("specialist", "teacher.area")).toBe(false);
    expect(roleCan("specialist", "parent.area")).toBe(false);
  });

  it("ولي الأمر والمعلم لا يملكان أي صلاحية إدارية", () => {
    for (const role of ["parent", "teacher"] as AppRole[]) {
      const adminPerms = permissionsFor(role).filter((p) => p.startsWith("admin."));
      expect(adminPerms).toEqual([]);
    }
  });

  it("لا دور غير الإدارة يملك صلاحيات إدارية حساسة", () => {
    for (const role of ROLES.filter((r) => r !== "admin")) {
      for (const perm of SENSITIVE_ADMIN) {
        expect(roleCan(role, perm), `${role} → ${perm}`).toBe(false);
      }
    }
  });

  it("صلاحيات الإدارة (بما فيها إدارة الأطفال) محصورة بدور الإدارة فقط", () => {
    for (const perm of CHILD_WRITE) {
      expect(roleCan("admin", perm)).toBe(true);
      expect(roleCan("specialist", perm)).toBe(false);
      expect(roleCan("parent", perm)).toBe(false);
      expect(roleCan("teacher", perm)).toBe(false);
    }
  });

  it("لا صلاحيات لمستخدم بدون دور", () => {
    expect(permissionsFor(null)).toEqual([]);
    expect(roleCan(null, "admin.children")).toBe(false);
    expect(roleCan(null, "parent.area")).toBe(false);
  });

  it("الإدارة تملك كل الصلاحيات المعرفة", () => {
    const all = new Set(Object.values(ROLE_PERMISSIONS).flat());
    for (const perm of all) {
      expect(roleCan("admin", perm), `admin → ${perm}`).toBe(true);
    }
  });
});
