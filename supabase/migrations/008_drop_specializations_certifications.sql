-- Remove specializations and certifications columns from breeder_profiles
-- These are dog-level attributes, not breeder-level
ALTER TABLE breeder_profiles DROP COLUMN IF EXISTS specializations;
ALTER TABLE breeder_profiles DROP COLUMN IF EXISTS certifications;
