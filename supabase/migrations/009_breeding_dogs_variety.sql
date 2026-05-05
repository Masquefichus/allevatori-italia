-- 009_breeding_dogs_variety.sql
-- Adds variety column to breeding_dogs (e.g., pelo lungo, pelo corto)

ALTER TABLE breeding_dogs ADD COLUMN IF NOT EXISTS variety TEXT;
