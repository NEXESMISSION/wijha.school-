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
  device_type TEXT,
  browser TEXT,
  os TEXT,
  screen_width INT,
  screen_height INT,
  language TEXT,
  timezone TEXT,
  country TEXT,
  city TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  landing_page TEXT,
  is_returning BOOLEAN DEFAULT FALSE,
  total_events INT DEFAULT 0
);

-- 2. EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  page_url TEXT,
  viewport_width INT,
  viewport_height INT,
  scroll_y INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  city TEXT,
  experience_level TEXT,
  referral_source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  ip_country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PERFORMANCE INDEXES
CREATE INDEX idx_events_session ON events(session_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_created ON events(created_at);
CREATE INDEX idx_events_type_created ON events(event_type, created_at);
CREATE INDEX idx_sessions_started ON sessions(started_at);
CREATE INDEX idx_sessions_utm ON sessions(utm_source, utm_medium, utm_campaign);
CREATE INDEX idx_registrations_created ON registrations(created_at);
CREATE INDEX idx_registrations_utm ON registrations(utm_source, utm_medium, utm_campaign);

-- 5. ROW LEVEL SECURITY
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_sessions" ON sessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_sessions" ON sessions FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_insert_events" ON events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_registrations" ON registrations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "auth_read_sessions" ON sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_events" ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_registrations" ON registrations FOR SELECT TO authenticated USING (true);

-- SECURITY: anon can ONLY insert/update — never read data.
-- Only authenticated dashboard users can SELECT.
-- DO NOT add anon SELECT policies — this would leak all user PII.

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
