-- 1) Contact data out of the shared directory table
CREATE TABLE public.profile_contacts (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_contacts TO authenticated;
GRANT ALL ON public.profile_contacts TO service_role;

ALTER TABLE public.profile_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own or admin contacts" ON public.profile_contacts
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Insert own contacts" ON public.profile_contacts
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Update own contacts" ON public.profile_contacts
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Delete own contacts" ON public.profile_contacts
  FOR DELETE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_profile_contacts_updated BEFORE UPDATE ON public.profile_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

INSERT INTO public.profile_contacts (id, phone, bio)
SELECT id, phone, bio FROM public.profiles
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.profiles DROP COLUMN phone;
ALTER TABLE public.profiles DROP COLUMN bio;

-- keep new signups working: contact data now lands in profile_contacts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profile_contacts (id, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;

  _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'parent'::public.app_role);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- 2) Notifications cannot be spoofed onto other accounts
DROP POLICY IF EXISTS "System insert notifications" ON public.notifications;
CREATE POLICY "Insert own notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 3) Staff writes must be scoped to children they are linked to
DROP POLICY IF EXISTS "Specialists create diagnoses" ON public.diagnoses;
DROP POLICY IF EXISTS "Specialists update diagnoses" ON public.diagnoses;
DROP POLICY IF EXISTS "Specialists delete diagnoses" ON public.diagnoses;
CREATE POLICY "Specialists create diagnoses" ON public.diagnoses FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(), 'specialist') OR public.has_role(auth.uid(), 'admin')) AND public.has_child_access(auth.uid(), child_id));
CREATE POLICY "Specialists update diagnoses" ON public.diagnoses FOR UPDATE TO authenticated
  USING ((public.has_role(auth.uid(), 'specialist') OR public.has_role(auth.uid(), 'admin')) AND public.has_child_access(auth.uid(), child_id))
  WITH CHECK ((public.has_role(auth.uid(), 'specialist') OR public.has_role(auth.uid(), 'admin')) AND public.has_child_access(auth.uid(), child_id));
CREATE POLICY "Specialists delete diagnoses" ON public.diagnoses FOR DELETE TO authenticated
  USING ((public.has_role(auth.uid(), 'specialist') OR public.has_role(auth.uid(), 'admin')) AND public.has_child_access(auth.uid(), child_id));

DROP POLICY IF EXISTS "Specialists create plans" ON public.individual_plans;
DROP POLICY IF EXISTS "Specialists update plans" ON public.individual_plans;
DROP POLICY IF EXISTS "Specialists delete plans" ON public.individual_plans;
CREATE POLICY "Specialists create plans" ON public.individual_plans FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(), 'specialist') OR public.has_role(auth.uid(), 'admin')) AND public.has_child_access(auth.uid(), child_id));
CREATE POLICY "Specialists update plans" ON public.individual_plans FOR UPDATE TO authenticated
  USING ((public.has_role(auth.uid(), 'specialist') OR public.has_role(auth.uid(), 'admin')) AND public.has_child_access(auth.uid(), child_id))
  WITH CHECK ((public.has_role(auth.uid(), 'specialist') OR public.has_role(auth.uid(), 'admin')) AND public.has_child_access(auth.uid(), child_id));
CREATE POLICY "Specialists delete plans" ON public.individual_plans FOR DELETE TO authenticated
  USING ((public.has_role(auth.uid(), 'specialist') OR public.has_role(auth.uid(), 'admin')) AND public.has_child_access(auth.uid(), child_id));

DROP POLICY IF EXISTS "Teachers manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers delete attendance" ON public.attendance;
CREATE POLICY "Teachers manage attendance" ON public.attendance FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin')) AND public.has_child_access(auth.uid(), child_id));
CREATE POLICY "Teachers update attendance" ON public.attendance FOR UPDATE TO authenticated
  USING ((public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin')) AND public.has_child_access(auth.uid(), child_id))
  WITH CHECK ((public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin')) AND public.has_child_access(auth.uid(), child_id));
CREATE POLICY "Teachers delete attendance" ON public.attendance FOR DELETE TO authenticated
  USING ((public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin')) AND public.has_child_access(auth.uid(), child_id));

DROP POLICY IF EXISTS "Teachers create assignments" ON public.assignments;
DROP POLICY IF EXISTS "Teachers update assignments" ON public.assignments;
DROP POLICY IF EXISTS "Teachers delete assignments" ON public.assignments;
CREATE POLICY "Teachers create assignments" ON public.assignments FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin')) AND public.has_child_access(auth.uid(), child_id));
CREATE POLICY "Teachers update assignments" ON public.assignments FOR UPDATE TO authenticated
  USING ((public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin')) AND public.has_child_access(auth.uid(), child_id))
  WITH CHECK ((public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin')) AND public.has_child_access(auth.uid(), child_id));
CREATE POLICY "Teachers delete assignments" ON public.assignments FOR DELETE TO authenticated
  USING ((public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin')) AND public.has_child_access(auth.uid(), child_id));

DROP POLICY IF EXISTS "Teachers manage grades" ON public.grades;
DROP POLICY IF EXISTS "Teachers update grades" ON public.grades;
DROP POLICY IF EXISTS "Teachers delete grades" ON public.grades;
CREATE POLICY "Teachers manage grades" ON public.grades FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'specialist') OR public.has_role(auth.uid(), 'admin')) AND public.has_child_access(auth.uid(), child_id));
CREATE POLICY "Teachers update grades" ON public.grades FOR UPDATE TO authenticated
  USING ((public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'specialist') OR public.has_role(auth.uid(), 'admin')) AND public.has_child_access(auth.uid(), child_id))
  WITH CHECK ((public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'specialist') OR public.has_role(auth.uid(), 'admin')) AND public.has_child_access(auth.uid(), child_id));
CREATE POLICY "Teachers delete grades" ON public.grades FOR DELETE TO authenticated
  USING ((public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'specialist') OR public.has_role(auth.uid(), 'admin')) AND public.has_child_access(auth.uid(), child_id));

DROP POLICY IF EXISTS "Staff create notes" ON public.child_notes;
CREATE POLICY "Staff create notes" ON public.child_notes FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'specialist') OR public.has_role(auth.uid(), 'admin')) AND public.has_child_access(auth.uid(), child_id));
DROP POLICY IF EXISTS "Authors update notes" ON public.child_notes;
DROP POLICY IF EXISTS "Authors delete notes" ON public.child_notes;
CREATE POLICY "Authors update notes" ON public.child_notes FOR UPDATE TO authenticated
  USING ((author_id = auth.uid() OR public.has_role(auth.uid(), 'admin')) AND public.has_child_access(auth.uid(), child_id))
  WITH CHECK ((author_id = auth.uid() OR public.has_role(auth.uid(), 'admin')) AND public.has_child_access(auth.uid(), child_id));
CREATE POLICY "Authors delete notes" ON public.child_notes FOR DELETE TO authenticated
  USING ((author_id = auth.uid() OR public.has_role(auth.uid(), 'admin')) AND public.has_child_access(auth.uid(), child_id));

-- 4) SECURITY DEFINER function exposure
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_child_access(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_child_access(uuid, uuid) TO authenticated;