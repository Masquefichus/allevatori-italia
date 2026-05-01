-- 022_trainer_course_other.sql
-- Adds free-text "Altro" field for custom course types to trainer_profiles.

ALTER TABLE trainer_profiles ADD COLUMN IF NOT EXISTS course_other TEXT;
