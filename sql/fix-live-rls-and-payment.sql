-- ============================================================
-- FIX LIVE ERRORS: RLS 403 + payment_method 400
-- Run this in Supabase SQL Editor (safe/idempotent style)
-- ============================================================

-- 1) Ensure payment_method column exists (fixes 400 on registrations insert)
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Optional backfill for existing rows
UPDATE registrations
SET payment_method = 'cash'
WHERE payment_method IS NULL;

-- Keep enum constraint safe (drop/recreate)
ALTER TABLE registrations
DROP CONSTRAINT IF EXISTS chk_payment_method_enum;

ALTER TABLE registrations
ADD CONSTRAINT chk_payment_method_enum
CHECK (payment_method IS NULL OR payment_method IN ('d17', 'flouci', 'bank_transfer', 'cash'));

-- 2) Reset ALL existing policies on target tables (avoids hidden/restrictive conflicts)
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

-- 3) Ensure RLS is enabled
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- 4) Ensure roles have privileges (explicitly include anon/authenticated)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE ON TABLE sessions TO anon;
GRANT INSERT ON TABLE events TO anon;
GRANT INSERT ON TABLE registrations TO anon;
GRANT SELECT ON TABLE sessions, events, registrations TO authenticated;

-- 5) Recreate minimal safe policies for frontend inserts + dashboard reads
CREATE POLICY "anon_insert_sessions" ON sessions
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_sessions" ON sessions
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (last_seen_at IS NOT NULL AND total_events >= 0);

CREATE POLICY "anon_insert_events" ON events
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_insert_registrations" ON registrations
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "auth_read_sessions" ON sessions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_events" ON events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_registrations" ON registrations
  FOR SELECT TO authenticated USING (true);

-- 6) Quick verification
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('sessions', 'events', 'registrations')
ORDER BY tablename, policyname;
