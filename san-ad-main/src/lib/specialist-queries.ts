import { supabase } from "@/integrations/supabase/client";

export async function fetchSpecialistChildren(specialistId: string) {
  const { data, error } = await supabase
    .from("specialist_child")
    .select("child:children(*)")
    .eq("specialist_id", specialistId);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.child).filter(Boolean);
}

export async function fetchSpecialistChildIds(specialistId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("specialist_child")
    .select("child_id")
    .eq("specialist_id", specialistId);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.child_id);
}