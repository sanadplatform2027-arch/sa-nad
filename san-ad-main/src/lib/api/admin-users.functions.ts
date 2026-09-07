import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * بيانات الحساب (البريد الإلكتروني وآخر تسجيل دخول) محفوظة في نظام المصادقة،
 * ولا يمكن قراءتها من المتصفح — تُقرأ هنا بعد التحقق من أن الطالب إداري.
 */
export const getUserAccountInfo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError) throw roleError;
    if (!isAdmin) throw new Error("غير مصرح");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (error) throw error;

    return {
      email: result.user?.email ?? null,
      last_sign_in_at: result.user?.last_sign_in_at ?? null,
      email_confirmed_at: result.user?.email_confirmed_at ?? null,
      created_at: result.user?.created_at ?? null,
    };
  });

/** حذف حساب مستخدم نهائياً — للإدارة فقط، ولا يمكن للإداري حذف نفسه. */
export const deleteUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError) throw roleError;
    if (!isAdmin) throw new Error("غير مصرح");
    if (data.userId === context.userId) throw new Error("لا يمكنك حذف حسابك الخاص");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw error;
    return { ok: true };
  });
