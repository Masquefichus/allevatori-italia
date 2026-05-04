-- 020_trainer_certification_types.sql
-- Adds certification fields to trainer_profiles.

ALTER TABLE trainer_profiles ADD COLUMN IF NOT EXISTS certification_types TEXT[] DEFAULT '{}';
ALTER TABLE trainer_profiles ADD COLUMN IF NOT EXISTS certification_other TEXT;
