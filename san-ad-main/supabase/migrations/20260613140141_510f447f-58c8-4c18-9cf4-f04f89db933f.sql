
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('parent', 'specialist', 'teacher', 'admin');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE public.appointment_type AS ENUM ('psychological', 'medical', 'speech', 'educational', 'other');
CREATE TYPE public.diagnosis_type AS ENUM ('medical', 'psychological', 'educational');
CREATE TYPE public.assignment_status AS ENUM ('pending', 'submitted', 'graded');
CREATE TYPE public.grade_type AS ENUM ('homework', 'quiz', 'exam', 'participation');
CREATE TYPE public.note_category AS ENUM ('behavior', 'social', 'academic', 'progress');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============ SECURITY DEFINER FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id ORDER BY
    CASE role WHEN 'admin' THEN 1 WHEN 'specialist' THEN 2 WHEN 'teacher' THEN 3 ELSE 4 END
  LIMIT 1
$$;

-- ============ CHILDREN ============
CREATE TABLE public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  grade_level TEXT,
  institution TEXT,
  disability_type TEXT,
  photo_url TEXT,
  contact_info TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.children TO authenticated;
GRANT ALL ON public.children TO service_role;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- ============ RELATIONSHIPS ============
CREATE TABLE public.parent_child (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  relationship TEXT DEFAULT 'parent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (parent_id, child_id)
);
GRANT SELECT, INSERT, DELETE ON public.parent_child TO authenticated;
GRANT ALL ON public.parent_child TO service_role;
ALTER TABLE public.parent_child ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.specialist_child (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (specialist_id, child_id)
);
GRANT SELECT, INSERT, DELETE ON public.specialist_child TO authenticated;
GRANT ALL ON public.specialist_child TO service_role;
ALTER TABLE public.specialist_child ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.teacher_child (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, child_id)
);
GRANT SELECT, INSERT, DELETE ON public.teacher_child TO authenticated;
GRANT ALL ON public.teacher_child TO service_role;
ALTER TABLE public.teacher_child ENABLE ROW LEVEL SECURITY;

-- ============ ACCESS HELPER ============
CREATE OR REPLACE FUNCTION public.has_child_access(_user_id UUID, _child_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR EXISTS (SELECT 1 FROM public.parent_child WHERE parent_id = _user_id AND child_id = _child_id)
    OR EXISTS (SELECT 1 FROM public.specialist_child WHERE specialist_id = _user_id AND child_id = _child_id)
    OR EXISTS (SELECT 1 FROM public.teacher_child WHERE teacher_id = _user_id AND child_id = _child_id)
$$;

-- ============ DIAGNOSES ============
CREATE TABLE public.diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  type public.diagnosis_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  author_id UUID REFERENCES auth.users(id),
  diagnosed_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnoses TO authenticated;
GRANT ALL ON public.diagnoses TO service_role;
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;

-- ============ REPORTS ============
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  period TEXT,
  content TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  author_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- ============ INDIVIDUAL PLANS ============
CREATE TABLE public.individual_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  short_term_goals TEXT,
  long_term_goals TEXT,
  activities TEXT,
  evaluation_indicators TEXT,
  author_id UUID REFERENCES auth.users(id),
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.individual_plans TO authenticated;
GRANT ALL ON public.individual_plans TO service_role;
ALTER TABLE public.individual_plans ENABLE ROW LEVEL SECURITY;

-- ============ ATTENDANCE ============
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.attendance_status NOT NULL,
  reason TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- ============ ASSIGNMENTS ============
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status public.assignment_status NOT NULL DEFAULT 'pending',
  grade NUMERIC,
  feedback TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- ============ GRADES ============
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  type public.grade_type NOT NULL,
  score NUMERIC NOT NULL,
  max_score NUMERIC NOT NULL DEFAULT 20,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grades TO authenticated;
GRANT ALL ON public.grades TO service_role;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- ============ APPOINTMENTS ============
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  specialist_id UUID REFERENCES auth.users(id),
  requested_by UUID REFERENCES auth.users(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  type public.appointment_type NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- ============ MESSAGES ============
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============ NOTES ============
CREATE TABLE public.child_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  category public.note_category NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_notes TO authenticated;
GRANT ALL ON public.child_notes TO service_role;
ALTER TABLE public.child_notes ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES ============

-- profiles: readable by all authenticated; updatable by self
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- user_roles: own + admin
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- children: child access OR admin
CREATE POLICY "Authorized view children" ON public.children FOR SELECT TO authenticated USING (public.has_child_access(auth.uid(), id));
CREATE POLICY "Specialists/admin create children" ON public.children FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'specialist') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Specialists/admin update children" ON public.children FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'specialist') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete children" ON public.children FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- relationships
CREATE POLICY "View own parent_child" ON public.parent_child FOR SELECT TO authenticated USING (parent_id = auth.uid() OR public.has_child_access(auth.uid(), child_id));
CREATE POLICY "Specialists/admin manage parent_child" ON public.parent_child FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'specialist') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete parent_child" ON public.parent_child FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "View specialist_child" ON public.specialist_child FOR SELECT TO authenticated USING (specialist_id = auth.uid() OR public.has_child_access(auth.uid(), child_id));
CREATE POLICY "Specialists/admin manage specialist_child" ON public.specialist_child FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'specialist') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete specialist_child" ON public.specialist_child FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "View teacher_child" ON public.teacher_child FOR SELECT TO authenticated USING (teacher_id = auth.uid() OR public.has_child_access(auth.uid(), child_id));
CREATE POLICY "Specialists/admin manage teacher_child" ON public.teacher_child FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'specialist') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete teacher_child" ON public.teacher_child FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- diagnoses
CREATE POLICY "View diagnoses" ON public.diagnoses FOR SELECT TO authenticated USING (public.has_child_access(auth.uid(), child_id));
CREATE POLICY "Specialists create diagnoses" ON public.diagnoses FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'specialist') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Specialists update diagnoses" ON public.diagnoses FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'specialist') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Specialists delete diagnoses" ON public.diagnoses FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'specialist') OR public.has_role(auth.uid(), 'admin'));

-- reports
CREATE POLICY "View reports" ON public.reports FOR SELECT TO authenticated USING (public.has_child_access(auth.uid(), child_id));
CREATE POLICY "Staff create reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'specialist') OR public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authors update reports" ON public.reports FOR UPDATE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authors delete reports" ON public.reports FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- individual_plans
CREATE POLICY "View plans" ON public.individual_plans FOR SELECT TO authenticated USING (public.has_child_access(auth.uid(), child_id));
CREATE POLICY "Specialists create plans" ON public.individual_plans FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'specialist') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Specialists update plans" ON public.individual_plans FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'specialist') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Specialists delete plans" ON public.individual_plans FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'specialist') OR public.has_role(auth.uid(), 'admin'));

-- attendance
CREATE POLICY "View attendance" ON public.attendance FOR SELECT TO authenticated USING (public.has_child_access(auth.uid(), child_id));
CREATE POLICY "Teachers manage attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers update attendance" ON public.attendance FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers delete attendance" ON public.attendance FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- assignments
CREATE POLICY "View assignments" ON public.assignments FOR SELECT TO authenticated USING (public.has_child_access(auth.uid(), child_id));
CREATE POLICY "Teachers create assignments" ON public.assignments FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers update assignments" ON public.assignments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers delete assignments" ON public.assignments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- grades
CREATE POLICY "View grades" ON public.grades FOR SELECT TO authenticated USING (public.has_child_access(auth.uid(), child_id));
CREATE POLICY "Teachers manage grades" ON public.grades FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers update grades" ON public.grades FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers delete grades" ON public.grades FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- appointments
CREATE POLICY "View appointments" ON public.appointments FOR SELECT TO authenticated USING (
  public.has_child_access(auth.uid(), child_id) OR specialist_id = auth.uid() OR requested_by = auth.uid()
);
CREATE POLICY "Authorized create appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (
  public.has_child_access(auth.uid(), child_id) OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Specialists/requesters update appointments" ON public.appointments FOR UPDATE TO authenticated USING (
  specialist_id = auth.uid() OR requested_by = auth.uid() OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Requesters delete appointments" ON public.appointments FOR DELETE TO authenticated USING (
  requested_by = auth.uid() OR public.has_role(auth.uid(), 'admin')
);

-- messages
CREATE POLICY "View own messages" ON public.messages FOR SELECT TO authenticated USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "Send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Update own messages" ON public.messages FOR UPDATE TO authenticated USING (recipient_id = auth.uid());

-- notifications
CREATE POLICY "View own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- child_notes
CREATE POLICY "View child notes" ON public.child_notes FOR SELECT TO authenticated USING (public.has_child_access(auth.uid(), child_id));
CREATE POLICY "Staff create notes" ON public.child_notes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'specialist') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authors update notes" ON public.child_notes FOR UPDATE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authors delete notes" ON public.child_notes FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ============ TRIGGERS ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;

  _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'parent'::public.app_role);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_children_updated BEFORE UPDATE ON public.children FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_plans_updated BEFORE UPDATE ON public.individual_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_assignments_updated BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_appointments_updated BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
