import { supabase } from "@/integrations/supabase/client";

export async function fetchMyChildren(parentId: string) {
  const { data, error } = await supabase
    .from("parent_child")
    .select("status, rejection_reason, child:children(*)")
    .eq("parent_id", parentId);
  if (error) throw error;
  return (data ?? [])
    .filter((r: any) => r.child)
    .map((r: any) => ({ ...r.child, link_status: r.status, rejection_reason: r.rejection_reason }));
}

export interface ParentChildInput {
  full_name: string;
  date_of_birth?: string | null;
  gender?: string | null;
  grade_level?: string | null;
  institution?: string | null;
  disability_type?: string | null;
  notes?: string | null;
}

/**
 * ولي الأمر يسجّل ابنه بنفسه: يُنشأ ملف الطفل ثم تُسجّل صلة القرابة
 * بحالة "بانتظار المراجعة" حتى توثّقها الإدارة.
 */
export async function registerMyChild(input: ParentChildInput, parentId: string) {
  const { data, error } = await supabase
    .from("children")
    .insert({ ...input, created_by: parentId })
    .select("id")
    .single();
  if (error) throw error;

  const { error: linkError } = await supabase
    .from("parent_child")
    .insert({ parent_id: parentId, child_id: data.id, status: "pending" } as any);
  if (linkError) throw linkError;
  return data.id as string;
}

export async function fetchChildById(childId: string) {
  const { data, error } = await supabase.from("children").select("*").eq("id", childId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchMyChildIds(parentId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("parent_child")
    .select("child_id")
    .eq("parent_id", parentId)
    .eq("status", "approved");
  if (error) throw error;
  return (data ?? []).map((r: any) => r.child_id);
}