-- Add seeker-oriented attributes to breeds table
-- These attributes help dog seekers filter and discover breeds matching their needs.

-- New JSONB column for the full seeker attributes object
ALTER TABLE breeds ADD COLUMN IF NOT EXISTS seeker_attributes JSONB;

-- First-class indexed columns for commonly filtered attributes
ALTER TABLE breeds ADD COLUMN IF NOT EXISTS height_min_cm INTEGER;
ALTER TABLE breeds ADD COLUMN IF NOT EXISTS height_max_cm INTEGER;
ALTER TABLE breeds ADD COLUMN IF NOT EXISTS coat_type TEXT;

-- GIN index on seeker_attributes for JSONB queries
CREATE INDEX IF NOT EXISTS idx_breeds_seeker_attributes
  ON breeds USING GIN (seeker_attributes);

-- B-tree indexes for commonly filtered scalar columns
CREATE INDEX IF NOT EXISTS idx_breeds_coat_type ON breeds(coat_type);
CREATE INDEX IF NOT EXISTS idx_breeds_height ON breeds(height_min_cm, height_max_cm);
