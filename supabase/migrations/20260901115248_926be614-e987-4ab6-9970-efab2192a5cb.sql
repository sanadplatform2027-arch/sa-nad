DO $$ BEGIN
  CREATE TYPE public.link_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.parent_child
  ADD COLUMN IF NOT EXISTS status public.link_status NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

CREATE OR REPLACE FUNCTION public.has_child_access(_user_id uuid, _child_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR EXISTS (SELECT 1 FROM public.children WHERE id = _child_id AND created_by = _user_id)
    OR EXISTS (SELECT 1 FROM public.parent_child WHERE parent_id = _user_id AND child_id = _child_id AND status = 'approved')
    OR EXISTS (SELECT 1 FROM public.specialist_child WHERE specialist_id = _user_id AND child_id = _child_id)
    OR EXISTS (SELECT 1 FROM public.teacher_child WHERE teacher_id = _user_id AND child_id = _child_id)
$$;
REVOKE EXECUTE ON FUNCTION public.has_child_access(uuid, uuid) FROM anon;

DROP POLICY IF EXISTS "Admin create children" ON public.children;
CREATE POLICY "Admin or parent create children" ON public.children
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    OR (has_role(auth.uid(), 'parent') AND created_by = auth.uid())
  );

DROP POLICY IF EXISTS "Specialists/admin manage parent_child" ON public.parent_child;
CREATE POLICY "Admin manage parent_child" ON public.parent_child
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Parents request own link" ON public.parent_child
  FOR INSERT TO authenticated
  WITH CHECK (parent_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admin verify parent_child" ON public.parent_child
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
