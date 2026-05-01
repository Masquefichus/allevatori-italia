-- 018_trainer_courses_text.sql
-- Adds a free-text courses description to trainer_profiles.

ALTER TABLE trainer_profiles ADD COLUMN IF NOT EXISTS courses_text TEXT;
