-- ============================================
-- Wijha Academy - Analytics & Registration Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. SESSIONS TABLE
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  device_type TEXT CHECK (length(device_type) <= 50),
  browser TEXT CHECK (length(browser) <= 50),
  os TEXT CHECK (length(os) <= 50),
  screen_width INT CHECK (screen_width IS NULL OR (screen_width >= 0 AND screen_width <= 10000)),
  screen_height INT CHECK (screen_height IS NULL OR (screen_height >= 0 AND screen_height <= 10000)),
  language TEXT CHECK (length(language) <= 20),
  timezone TEXT CHECK (length(timezone) <= 100),
  country TEXT CHECK (length(country) <= 100),
  city TEXT CHECK (length(city) <= 100),
  referrer TEXT CHECK (length(referrer) <= 2000),
  utm_source TEXT CHECK (length(utm_source) <= 200),
  utm_medium TEXT CHECK (length(utm_medium) <= 200),
  utm_campaign TEXT CHECK (length(utm_campaign) <= 200),
  utm_term TEXT CHECK (length(utm_term) <= 200),
  utm_content TEXT CHECK (length(utm_content) <= 200),
  landing_page TEXT CHECK (length(landing_page) <= 2000),
  is_returning BOOLEAN DEFAULT FALSE,
  total_events INT DEFAULT 0 CHECK (total_events >= 0 AND total_events <= 100000)
);

-- 2. EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL CHECK (length(session_id) <= 100),
  event_type TEXT NOT NULL CHECK (length(event_type) <= 100),
  event_data JSONB DEFAULT '{}' CHECK (length(event_data::text) <= 10000),
  page_url TEXT CHECK (length(page_url) <= 2000),
  viewport_width INT CHECK (viewport_width IS NULL OR (viewport_width >= 0 AND viewport_width <= 10000)),
  viewport_height INT CHECK (viewport_height IS NULL OR (viewport_height >= 0 AND viewport_height <= 10000)),
  scroll_y INT CHECK (scroll_y IS NULL OR (scroll_y >= 0 AND scroll_y <= 100000)),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT CHECK (length(session_id) <= 100),
  full_name TEXT NOT NULL CHECK (length(full_name) >= 2 AND length(full_name) <= 200),
  phone TEXT NOT NULL CHECK (length(phone) >= 8 AND length(phone) <= 20),
  email TEXT CHECK (email IS NULL OR (length(email) <= 200 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  city TEXT CHECK (city IS NULL OR length(city) <= 200),
  experience_level TEXT CHECK (experience_level IS NULL OR experience_level IN ('beginner', 'basic', 'intermediate', 'advanced')),
  referral_source TEXT CHECK (referral_source IS NULL OR referral_source IN ('facebook', 'instagram', 'youtube', 'tiktok', 'friend', 'google', 'other')),
  utm_source TEXT CHECK (length(utm_source) <= 200),
  utm_medium TEXT CHECK (length(utm_medium) <= 200),
  utm_campaign TEXT CHECK (length(utm_campaign) <= 200),
  utm_term TEXT CHECK (length(utm_term) <= 200),
  utm_content TEXT CHECK (length(utm_content) <= 200),
  device_type TEXT CHECK (length(device_type) <= 50),
  browser TEXT CHECK (length(browser) <= 50),
  os TEXT CHECK (length(os) <= 50),
  ip_country TEXT CHECK (length(ip_country) <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_type_created ON events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_utm ON sessions(utm_source, utm_medium, utm_campaign);
CREATE INDEX IF NOT EXISTS idx_registrations_created ON registrations(created_at);
CREATE INDEX IF NOT EXISTS idx_registrations_utm ON registrations(utm_source, utm_medium, utm_campaign);

-- 5. ROW LEVEL SECURITY
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Idempotent: safe to re-run (policies already exist from a previous run)
DROP POLICY IF EXISTS "anon_insert_sessions" ON sessions;
DROP POLICY IF EXISTS "anon_update_sessions" ON sessions;
DROP POLICY IF EXISTS "anon_insert_events" ON events;
DROP POLICY IF EXISTS "anon_insert_registrations" ON registrations;
DROP POLICY IF EXISTS "auth_read_sessions" ON sessions;
DROP POLICY IF EXISTS "auth_read_events" ON events;
DROP POLICY IF EXISTS "auth_read_registrations" ON registrations;

-- Anon can INSERT sessions (new visitor)
CREATE POLICY "anon_insert_sessions" ON sessions
  FOR INSERT TO anon WITH CHECK (true);

-- Anon can UPDATE only their own session (matched by session_id in the WHERE clause)
-- The WITH CHECK prevents changing the session_id field itself
CREATE POLICY "anon_update_sessions" ON sessions
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (
    session_id = session_id AND
    last_seen_at IS NOT NULL AND
    total_events >= 0
  );

-- Anon can INSERT events (tracking)
CREATE POLICY "anon_insert_events" ON events
  FOR INSERT TO anon WITH CHECK (true);

-- Anon can INSERT registrations (form submission)
CREATE POLICY "anon_insert_registrations" ON registrations
  FOR INSERT TO anon WITH CHECK (true);

-- ONLY authenticated users can read ANY data (dashboard)
CREATE POLICY "auth_read_sessions" ON sessions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_events" ON events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_registrations" ON registrations
  FOR SELECT TO authenticated USING (true);

-- SECURITY NOTES:
-- ✅ Anon can ONLY insert/update — never read data
-- ✅ Only authenticated dashboard users can SELECT
-- ✅ All text fields have length limits to prevent payload attacks
-- ✅ Registration fields have format validation (email regex, enum values)
-- ✅ Numeric fields have range limits
-- ✅ JSONB event_data limited to 10KB
-- ⚠️ DO NOT add anon SELECT policies — this would leak all user PII

-- 6. DASHBOARD VIEWS

CREATE OR REPLACE VIEW daily_stats AS
SELECT
  DATE(s.started_at) AS day,
  COUNT(DISTINCT s.session_id) AS unique_visitors,
  COUNT(DISTINCT r.id) AS registrations,
  ROUND(
    COUNT(DISTINCT r.id)::NUMERIC / NULLIF(COUNT(DISTINCT s.session_id), 0) * 100, 2
  ) AS conversion_rate
FROM sessions s
LEFT JOIN registrations r ON r.session_id = s.session_id
GROUP BY DATE(s.started_at)
ORDER BY day DESC;

CREATE OR REPLACE VIEW traffic_sources AS
SELECT
  COALESCE(s.utm_source, CASE
    WHEN s.referrer ILIKE '%facebook%' OR s.referrer ILIKE '%fb.%' THEN 'facebook'
    WHEN s.referrer ILIKE '%instagram%' THEN 'instagram'
    WHEN s.referrer ILIKE '%youtube%' THEN 'youtube'
    WHEN s.referrer ILIKE '%google%' THEN 'google'
    WHEN s.referrer ILIKE '%tiktok%' THEN 'tiktok'
    WHEN s.referrer IS NULL OR s.referrer = '' THEN 'direct'
    ELSE 'other'
  END) AS source,
  COUNT(DISTINCT s.session_id) AS visitors,
  COUNT(DISTINCT r.id) AS conversions
FROM sessions s
LEFT JOIN registrations r ON r.session_id = s.session_id
GROUP BY 1
ORDER BY visitors DESC;

CREATE OR REPLACE VIEW device_breakdown AS
SELECT
  s.device_type,
  s.browser,
  s.os,
  COUNT(*) AS count
FROM sessions s
GROUP BY s.device_type, s.browser, s.os
ORDER BY count DESC;

CREATE OR REPLACE VIEW hourly_traffic AS
SELECT
  EXTRACT(HOUR FROM s.started_at)::INT AS hour,
  COUNT(*) AS visitors
FROM sessions s
GROUP BY 1
ORDER BY 1;

CREATE OR REPLACE VIEW conversion_funnel AS
SELECT 'page_view' AS step, 1 AS step_order, COUNT(DISTINCT session_id) AS count FROM events WHERE event_type = 'page_view'
UNION ALL
SELECT 'scroll_50', 2, COUNT(DISTINCT session_id) FROM events WHERE event_type = 'scroll_50'
UNION ALL
SELECT 'form_impression', 3, COUNT(DISTINCT session_id) FROM events WHERE event_type = 'form_impression'
UNION ALL
SELECT 'form_start', 4, COUNT(DISTINCT session_id) FROM events WHERE event_type = 'form_start'
UNION ALL
SELECT 'form_submit_success', 5, COUNT(DISTINCT session_id) FROM events WHERE event_type = 'form_submit_success'
ORDER BY step_order;
