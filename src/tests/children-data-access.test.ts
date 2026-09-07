import { createClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * اختبارات حماية بيانات الأطفال على مستوى قاعدة البيانات (RLS):
 * زائر غير مصادق يجب ألّا يقرأ أو يكتب أي بيانات خاصة بالأطفال.
 */
const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? "";

const CHILD_TABLES = [
  "children",
  "child_notes",
  "diagnoses",
  "individual_plans",
  "reports",
  "grades",
  "attendance",
  "assignments",
  "appointments",
  "parent_child",
  "specialist_child",
  "teacher_child",
  "user_roles",
  "profiles",
  "messages",
] as const;

const anon = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
});

describe("منع الوصول غير المصرح به لبيانات الأطفال", () => {
  beforeAll(() => {
    expect(url, "VITE_SUPABASE_URL مفقود").not.toBe("");
    expect(key, "VITE_SUPABASE_PUBLISHABLE_KEY مفقود").not.toBe("");
  });

  it.each(CHILD_TABLES)("زائر غير مصادق لا يقرأ %s", async (table) => {
    const { data, error } = await anon.from(table).select("*").limit(1);
    // إما خطأ صلاحيات أو نتيجة فارغة بفعل RLS
    if (!error) expect(data ?? []).toHaveLength(0);
  });

  it("زائر غير مصادق لا يستطيع إنشاء طفل", async () => {
    const { error } = await anon.from("children").insert({ full_name: "اختبار غير مصرح" });
    expect(error).not.toBeNull();
  });

  it("زائر غير مصادق لا يستطيع منح نفسه دوراً", async () => {
    const { error } = await anon
      .from("user_roles")
      .insert({ user_id: "00000000-0000-0000-0000-000000000000", role: "admin" });
    expect(error).not.toBeNull();
  });

  it("زائر غير مصادق لا يستطيع حذف بيانات طفل", async () => {
    const { data, error } = await anon
      .from("children")
      .delete()
      .neq("full_name", "__none__")
      .select("id");
    if (!error) expect(data ?? []).toHaveLength(0);
  });
});
