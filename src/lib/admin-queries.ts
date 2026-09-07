import { supabase } from "@/integrations/supabase/client";

export async function fetchAdminStats() {
  const [children, profiles, roles, appts, reports, plans, assignments] = await Promise.all([
    supabase.from("children").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("user_roles").select("role"),
    supabase.from("appointments").select("id, status", { count: "exact" }),
    supabase.from("reports").select("id", { count: "exact", head: true }),
    supabase.from("individual_plans").select("id", { count: "exact", head: true }),
    supabase.from("assignments").select("id", { count: "exact", head: true }),
  ]);

  const roleCounts = { parent: 0, specialist: 0, teacher: 0, admin: 0 } as Record<string, number>;
  (roles.data ?? []).forEach((r: any) => { roleCounts[r.role] = (roleCounts[r.role] ?? 0) + 1; });

  return {
    children: children.count ?? 0,
    users: profiles.count ?? 0,
    parents: roleCounts.parent,
    specialists: roleCounts.specialist,
    teachers: roleCounts.teacher,
    admins: roleCounts.admin,
    appointments: appts.count ?? 0,
    appointmentsPending: (appts.data ?? []).filter((a: any) => a.status === "pending").length,
    reports: reports.count ?? 0,
    plans: plans.count ?? 0,
    assignments: assignments.count ?? 0,
  };
}

export async function fetchAllUsers() {
  const [{ data: profiles, error }, { data: roles }, { data: contacts }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role"),
    // مرئي للإدارة فقط بحسب سياسات الحماية
    supabase.from("profile_contacts").select("id, phone, bio"),
  ]);
  if (error) throw error;
  const roleMap = new Map<string, string[]>();
  (roles ?? []).forEach((r: any) => {
    const arr = roleMap.get(r.user_id) ?? [];
    arr.push(r.role);
    roleMap.set(r.user_id, arr);
  });
  const contactMap = new Map<string, { phone: string | null; bio: string | null }>();
  (contacts ?? []).forEach((c: any) => contactMap.set(c.id, { phone: c.phone, bio: c.bio }));
  return (profiles ?? []).map((p: any) => ({
    ...p,
    phone: contactMap.get(p.id)?.phone ?? null,
    bio: contactMap.get(p.id)?.bio ?? null,
    roles: roleMap.get(p.id) ?? [],
  }));
}

export async function fetchAllChildren() {
  const { data, error } = await supabase.from("children").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export type AppRoleName = "parent" | "specialist" | "teacher" | "admin";

/** إضافة دور لمستخدم */
export async function addUserRole(userId: string, role: AppRoleName) {
  const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
  if (error) throw error;
}

/** إزالة دور من مستخدم */
export async function removeUserRole(userId: string, role: AppRoleName) {
  const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
  if (error) throw error;
}

export async function fetchAllAppointments() {
  const { data, error } = await supabase
    .from("appointments")
    .select("*, child:children(full_name)")
    .order("scheduled_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function fetchRecentActivity() {
  const [reports, plans, appointments] = await Promise.all([
    supabase.from("reports").select("id, title, created_at, child:children(full_name)").order("created_at", { ascending: false }).limit(5),
    supabase.from("individual_plans").select("id, title, created_at, child:children(full_name)").order("created_at", { ascending: false }).limit(5),
    supabase.from("appointments").select("id, type, status, scheduled_at, child:children(full_name)").order("created_at", { ascending: false }).limit(5),
  ]);
  return {
    reports: reports.data ?? [],
    plans: plans.data ?? [],
    appointments: appointments.data ?? [],
  };
}
export interface ChildInput {
  full_name: string;
  date_of_birth?: string | null;
  gender?: string | null;
  grade_level?: string | null;
  institution?: string | null;
  disability_type?: string | null;
  contact_info?: string | null;
  notes?: string | null;
}

/** تسجيل طفل جديد + ربطه تلقائياً بمن سجّله (أخصائي) وبولي الأمر إن حُدّد */
export async function createChild(
  input: ChildInput,
  links: { parentId?: string | null; specialistId?: string | null; teacherId?: string | null },
  createdBy: string,
) {
  const { data, error } = await supabase
    .from("children")
    .insert({ ...input, created_by: createdBy })
    .select("id")
    .single();
  if (error) throw error;
  const childId = data.id;

  const tasks: Promise<any>[] = [];
  if (links.parentId) {
    tasks.push(
      supabase.from("parent_child").insert({ parent_id: links.parentId, child_id: childId }) as any,
    );
  }
  if (links.specialistId) {
    tasks.push(
      supabase.from("specialist_child").insert({ specialist_id: links.specialistId, child_id: childId }) as any,
    );
  }
  if (links.teacherId) {
    tasks.push(
      supabase.from("teacher_child").insert({ teacher_id: links.teacherId, child_id: childId }) as any,
    );
  }
  const results = await Promise.all(tasks);
  const failed = results.find((r: any) => r?.error);
  if (failed?.error) throw failed.error;
  return childId as string;
}

export async function updateChild(id: string, input: ChildInput) {
  const { error } = await supabase.from("children").update(input).eq("id", id);
  if (error) throw error;
}

/** المستخدمون حسب الدور — لاستخدامهم في قوائم الربط */
export async function fetchUsersByRole(role: "parent" | "specialist" | "teacher") {
  const { data: roles, error } = await supabase.from("user_roles").select("user_id").eq("role", role);
  if (error) throw error;
  const ids = (roles ?? []).map((r: any) => r.user_id);
  if (ids.length === 0) return [];
  const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ids);
  return (profiles ?? []) as { id: string; full_name: string }[];
}

export type LinkKind = "parent" | "specialist" | "teacher";

const LINK_TABLE = {
  parent: { table: "parent_child", col: "parent_id" },
  specialist: { table: "specialist_child", col: "specialist_id" },
  teacher: { table: "teacher_child", col: "teacher_id" },
} as const;

export interface ChildLink {
  kind: LinkKind;
  user_id: string;
  full_name: string;
}

/** جميع روابط الطفل مع ولي الأمر والأخصائي والمعلم */
export async function fetchChildLinks(childId: string): Promise<ChildLink[]> {
  const results = await Promise.all(
    (Object.keys(LINK_TABLE) as LinkKind[]).map(async (kind) => {
      const { table, col } = LINK_TABLE[kind];
      const { data, error } = await supabase.from(table).select(col).eq("child_id", childId);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({ kind, user_id: r[col] as string }));
    }),
  );
  const flat = results.flat();
  const ids = [...new Set(flat.map((l) => l.user_id))];
  if (ids.length === 0) return [];
  const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ids);
  const names = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name as string]));
  return flat.map((l) => ({ ...l, full_name: names.get(l.user_id) ?? "مستخدم" }));
}

/** ربط مستخدم بالطفل */
export async function linkChildUser(childId: string, kind: LinkKind, userId: string) {
  const { table, col } = LINK_TABLE[kind];
  const { error } = await supabase.from(table).insert({ child_id: childId, [col]: userId } as any);
  if (error) throw error;
}

/** إلغاء ربط مستخدم بالطفل */
export async function unlinkChildUser(childId: string, kind: LinkKind, userId: string) {
  const { table, col } = LINK_TABLE[kind];
  const { error } = await (supabase.from(table).delete().eq("child_id", childId) as any).eq(col, userId);
  if (error) throw error;
}

/** تفاصيل مستخدم واحد: ملفه الشخصي وبيانات الاتصال وأدواره */
export async function fetchUserDetail(userId: string) {
  const [{ data: profile, error }, { data: roles }, { data: contact }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.from("profile_contacts").select("phone, bio").eq("id", userId).maybeSingle(),
  ]);
  if (error) throw error;
  if (!profile) return null;
  return {
    ...(profile as any),
    phone: (contact as any)?.phone ?? null,
    bio: (contact as any)?.bio ?? null,
    roles: (roles ?? []).map((r: any) => r.role as AppRoleName),
  };
}

export interface UserChildLink {
  kind: LinkKind;
  child_id: string;
  full_name: string;
  created_at: string | null;
}

/** الأطفال المرتبطون بالمستخدم بصفته ولي أمر أو أخصائي أو معلم */
export async function fetchUserChildLinks(userId: string): Promise<UserChildLink[]> {
  const results = await Promise.all(
    (Object.keys(LINK_TABLE) as LinkKind[]).map(async (kind) => {
      const { table, col } = LINK_TABLE[kind];
      const { data, error } = await (supabase
        .from(table)
        .select("child_id, created_at, child:children(full_name)") as any).eq(col, userId);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        kind,
        child_id: r.child_id as string,
        created_at: r.created_at ?? null,
        full_name: r.child?.full_name ?? "طفل",
      }));
    }),
  );
  return results.flat();
}

export interface ActivityEntry {
  id: string;
  kind: string;
  label: string;
  title: string;
  child: string | null;
  created_at: string;
}

/** سجل نشاط المستخدم عبر ما أنشأه في المنصة */
export async function fetchUserActivity(userId: string): Promise<ActivityEntry[]> {
  const [reports, plans, notes, diagnoses, appointments, assignments] = await Promise.all([
    supabase.from("reports").select("id, title, created_at, child:children(full_name)").eq("author_id", userId).order("created_at", { ascending: false }).limit(10),
    supabase.from("individual_plans").select("id, created_at, child:children(full_name)").eq("author_id", userId).order("created_at", { ascending: false }).limit(10),
    supabase.from("child_notes").select("id, category, content, created_at, child:children(full_name)").eq("author_id", userId).order("created_at", { ascending: false }).limit(10),
    supabase.from("diagnoses").select("id, title, created_at, child:children(full_name)").eq("author_id", userId).order("created_at", { ascending: false }).limit(10),
    supabase.from("appointments").select("id, type, created_at, child:children(full_name)").eq("requested_by", userId).order("created_at", { ascending: false }).limit(10),
    supabase.from("assignments").select("id, title, created_at, child:children(full_name)").eq("created_by", userId).order("created_at", { ascending: false }).limit(10),
  ]);

  const map = (rows: any[] | null, kind: string, label: string, title: (r: any) => string): ActivityEntry[] =>
    (rows ?? []).map((r: any) => ({
      id: `${kind}-${r.id}`,
      kind,
      label,
      title: title(r),
      child: r.child?.full_name ?? null,
      created_at: r.created_at,
    }));

  return [
    ...map(reports.data, "report", "تقرير", (r) => r.title ?? "تقرير"),
    ...map(plans.data, "plan", "خطة فردية", () => "خطة تعليمية فردية"),
    ...map(notes.data, "note", "ملاحظة", (r) => (r.content ?? "").slice(0, 60) || "ملاحظة"),
    ...map(diagnoses.data, "diagnosis", "تشخيص", (r) => r.title ?? "تشخيص"),
    ...map(appointments.data, "appointment", "موعد", (r) => `طلب موعد (${r.type})`),
    ...map(assignments.data, "assignment", "واجب", (r) => r.title ?? "واجب"),
  ]
    .filter((e) => e.created_at)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 25);
}

/** صلات القرابة المعلّقة/الموثّقة لمراجعتها من الإدارة */
export async function fetchParentLinkRequests(status?: "pending" | "approved" | "rejected") {
  let query = supabase
    .from("parent_child")
    .select("id, status, relationship, rejection_reason, created_at, verified_at, parent_id, child_id")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as any[];

  const parentIds = [...new Set(rows.map((r) => r.parent_id))];
  const childIds = [...new Set(rows.map((r) => r.child_id))];

  const [{ data: parents }, { data: children }] = await Promise.all([
    parentIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", parentIds)
      : Promise.resolve({ data: [] as any[] }),
    childIds.length
      ? supabase.from("children").select("id, full_name, date_of_birth, institution").in("id", childIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const parentMap = new Map((parents ?? []).map((p: any) => [p.id, p]));
  const childMap = new Map((children ?? []).map((c: any) => [c.id, c]));

  return rows.map((r) => ({
    ...r,
    parent: parentMap.get(r.parent_id) ?? null,
    child: childMap.get(r.child_id) ?? null,
  }));
}

/** توثيق صلة القرابة أو رفضها — للإدارة فقط (تحميها سياسات القاعدة) */
export async function setParentLinkStatus(
  linkId: string,
  status: "approved" | "rejected",
  adminId: string,
  rejectionReason?: string | null,
) {
  const { error } = await supabase
    .from("parent_child")
    .update({
      status,
      verified_by: adminId,
      verified_at: new Date().toISOString(),
      rejection_reason: status === "rejected" ? rejectionReason ?? null : null,
    } as any)
    .eq("id", linkId);
  if (error) throw error;
}
