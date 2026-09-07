DROP POLICY "Specialists/admin create children" ON public.children;

CREATE POLICY "Admin create children" ON public.children
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));