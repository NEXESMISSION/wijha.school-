-- ============================================================
-- SECURITY FIX: Remove anon SELECT policies
-- Run this IMMEDIATELY in Supabase SQL Editor
-- 
-- These policies were allowing anyone with the public anon key
-- to read ALL user data (names, phones, emails, sessions).
-- After this fix, only authenticated dashboard users can read.
-- ============================================================

-- Drop the dangerous anon SELECT policies
DROP POLICY IF EXISTS "anon_read_sessions" ON sessions;
DROP POLICY IF EXISTS "anon_read_events" ON events;
DROP POLICY IF EXISTS "anon_read_registrations" ON registrations;

-- Verify: only these policies should remain:
--   anon_insert_sessions     (INSERT for tracking)
--   anon_update_sessions     (UPDATE for heartbeat)
--   anon_insert_events       (INSERT for tracking)
--   anon_insert_registrations (INSERT for form)
--   auth_read_sessions       (SELECT for dashboard, authenticated only)
--   auth_read_events         (SELECT for dashboard, authenticated only)
--   auth_read_registrations  (SELECT for dashboard, authenticated only)

-- Confirm policies are correct
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('sessions', 'events', 'registrations')
ORDER BY tablename, policyname;
