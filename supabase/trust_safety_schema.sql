-- Trust and Safety Schema

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  reported_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NOT NULL,
  details text,
  status text DEFAULT 'open',
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_user_id, blocked_user_id)
);

-- RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_insert_reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_user_id);
CREATE POLICY "users_can_view_own_reports" ON public.reports FOR SELECT TO authenticated USING (auth.uid() = reporter_user_id);

CREATE POLICY "users_can_insert_blocks" ON public.blocked_users FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_user_id);
CREATE POLICY "users_can_view_own_blocks" ON public.blocked_users FOR SELECT TO authenticated USING (auth.uid() = blocker_user_id);
CREATE POLICY "users_can_delete_own_blocks" ON public.blocked_users FOR DELETE TO authenticated USING (auth.uid() = blocker_user_id);
