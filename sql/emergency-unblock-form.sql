-- ============================================================
-- EMERGENCY UNBLOCK (run once in Supabase SQL Editor)
-- Goal: immediately allow landing-page form submissions
-- ============================================================

-- 0) Ensure table/column required by frontend exists
ALTER TABLE IF EXISTS public.registrations
  ADD COLUMN IF NOT EXISTS payment_method text;

-- Optional normalization for old rows
UPDATE public.registrations
SET payment_method = 'cash'
WHERE payment_method IS NULL;

ALTER TABLE public.registrations
  DROP CONSTRAINT IF EXISTS chk_payment_method_enum;
ALTER TABLE public.registrations
  ADD CONSTRAINT chk_payment_method_enum
  CHECK (payment_method IS NULL OR payment_method IN ('d17', 'flouci', 'bank_transfer', 'cash'));

-- 1) Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE ON public.sessions TO anon;
GRANT INSERT ON public.events TO anon;
GRANT INSERT ON public.registrations TO anon;

-- 2) RLS flags
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- IMPORTANT: if FORCE RLS is on from previous hardening, turn it off
ALTER TABLE public.sessions NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public.events NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public.registrations NO FORCE ROW LEVEL SECURITY;

-- 3) Drop all existing policies on these tables to remove hidden conflicts
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('sessions', 'events', 'registrations')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

-- 4) Minimal allow policies for landing page
CREATE POLICY sessions_insert_anon ON public.sessions
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY sessions_insert_authenticated ON public.sessions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY sessions_update_anon ON public.sessions
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY sessions_update_authenticated ON public.sessions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY events_insert_anon ON public.events
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY events_insert_authenticated ON public.events
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY registrations_insert_anon ON public.registrations
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY registrations_insert_authenticated ON public.registrations
  FOR INSERT TO authenticated WITH CHECK (true);

-- Dashboard read access only to authenticated users
CREATE POLICY sessions_read_auth ON public.sessions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY events_read_auth ON public.events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY registrations_read_auth ON public.registrations
  FOR SELECT TO authenticated USING (true);

-- 5) Verification output
SELECT
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('sessions', 'events', 'registrations')
ORDER BY tablename, policyname;
