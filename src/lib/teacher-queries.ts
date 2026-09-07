import { supabase } from "@/integrations/supabase/client";

export async function fetchTeacherChildren(teacherId: string) {
  const { data, error } = await supabase
    .from("teacher_child")
    .select("child:children(*)")
    .eq("teacher_id", teacherId);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.child).filter(Boolean);
}

export async function fetchTeacherChildIds(teacherId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("teacher_child")
    .select("child_id")
    .eq("teacher_id", teacherId);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.child_id);
}