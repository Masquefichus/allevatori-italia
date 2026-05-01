-- 019_trainer_course_types.sql
-- Adds a course_types array to trainer_profiles for multi-select disciplines.

ALTER TABLE trainer_profiles ADD COLUMN IF NOT EXISTS course_types TEXT[] DEFAULT '{}';
