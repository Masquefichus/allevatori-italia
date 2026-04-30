-- 020_boarding_pension_text.sql
ALTER TABLE boarding_profiles ADD COLUMN IF NOT EXISTS pension_text TEXT;
