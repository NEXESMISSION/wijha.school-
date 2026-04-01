-- ============================================================
-- SECURITY HARDENING: Add CHECK constraints to existing tables
-- Run this in Supabase SQL Editor if tables already exist
-- ============================================================

-- Registrations: validate input lengths and formats
ALTER TABLE registrations
  ADD CONSTRAINT chk_name_length CHECK (length(full_name) >= 2 AND length(full_name) <= 200),
  ADD CONSTRAINT chk_phone_length CHECK (length(phone) >= 8 AND length(phone) <= 20),
  ADD CONSTRAINT chk_email_format CHECK (email IS NULL OR (length(email) <= 200 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  ADD CONSTRAINT chk_payment_method_enum CHECK (payment_method IS NULL OR payment_method IN ('d17', 'flouci', 'bank_transfer', 'cash')),
  ADD CONSTRAINT chk_city_length CHECK (city IS NULL OR length(city) <= 200),
  ADD CONSTRAINT chk_experience_enum CHECK (experience_level IS NULL OR experience_level IN ('beginner', 'basic', 'intermediate', 'advanced')),
  ADD CONSTRAINT chk_referral_enum CHECK (referral_source IS NULL OR referral_source IN ('facebook', 'instagram', 'youtube', 'tiktok', 'friend', 'google', 'other'));

-- Events: limit payload sizes
ALTER TABLE events
  ADD CONSTRAINT chk_event_type_length CHECK (length(event_type) <= 100),
  ADD CONSTRAINT chk_event_data_size CHECK (length(event_data::text) <= 10000),
  ADD CONSTRAINT chk_session_id_length CHECK (length(session_id) <= 100);

-- Sessions: limit field sizes
ALTER TABLE sessions
  ADD CONSTRAINT chk_referrer_length CHECK (length(referrer) <= 2000),
  ADD CONSTRAINT chk_landing_page_length CHECK (length(landing_page) <= 2000),
  ADD CONSTRAINT chk_utm_source_length CHECK (length(utm_source) <= 200),
  ADD CONSTRAINT chk_utm_medium_length CHECK (length(utm_medium) <= 200),
  ADD CONSTRAINT chk_utm_campaign_length CHECK (length(utm_campaign) <= 200);

-- Verify constraints applied
SELECT conname, conrelid::regclass AS table_name
FROM pg_constraint
WHERE conrelid IN ('sessions'::regclass, 'events'::regclass, 'registrations'::regclass)
  AND contype = 'c'
ORDER BY conrelid, conname;
