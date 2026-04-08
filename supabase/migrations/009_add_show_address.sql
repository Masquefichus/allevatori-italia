-- Add show_address toggle to breeder_profiles
ALTER TABLE breeder_profiles ADD COLUMN IF NOT EXISTS show_address BOOLEAN DEFAULT false;
