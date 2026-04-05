ALTER TABLE breeder_profiles
  ADD COLUMN IF NOT EXISTS cover_image_position TEXT DEFAULT '50% 50%',
  ADD COLUMN IF NOT EXISTS logo_position TEXT DEFAULT '50% 50%';
