-- 021_trainer_certification_text.sql
-- Adds a free-text description for certifications to trainer_profiles.

ALTER TABLE trainer_profiles ADD COLUMN IF NOT EXISTS certification_text TEXT;
