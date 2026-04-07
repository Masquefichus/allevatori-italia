-- 006_breeding_dogs.sql
-- Creates the breeding_dogs table for managing breeding stock (riproduttori/fattrici)

CREATE TABLE breeding_dogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  breeder_id UUID NOT NULL REFERENCES breeder_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  call_name TEXT,
  breed_id UUID REFERENCES breeds(id),
  sex TEXT NOT NULL CHECK (sex IN ('maschio', 'femmina')),
  date_of_birth DATE,
  pedigree_number TEXT,
  microchip_number TEXT,
  color TEXT,
  titles TEXT[] DEFAULT '{}',
  health_screenings JSONB DEFAULT '{}',
  dna_deposited BOOLEAN NOT NULL DEFAULT false,
  photo_url TEXT,
  gallery_urls TEXT[] DEFAULT '{}',
  is_external BOOLEAN NOT NULL DEFAULT false,
  external_kennel_name TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_breeding_dogs_breeder ON breeding_dogs(breeder_id, sort_order);
CREATE INDEX idx_breeding_dogs_breed ON breeding_dogs(breed_id);

-- Updated_at trigger
CREATE TRIGGER set_breeding_dogs_updated_at
  BEFORE UPDATE ON breeding_dogs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE breeding_dogs ENABLE ROW LEVEL SECURITY;

-- Public can view breeding dogs of approved breeders
CREATE POLICY "Breeding dogs visible on approved profiles"
  ON breeding_dogs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM breeder_profiles
      WHERE breeder_profiles.id = breeding_dogs.breeder_id
      AND breeder_profiles.is_approved = true
    )
  );

-- Owner can view own breeding dogs (even if not approved yet)
CREATE POLICY "Owner can view own breeding dogs"
  ON breeding_dogs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM breeder_profiles
      WHERE breeder_profiles.id = breeding_dogs.breeder_id
      AND breeder_profiles.user_id = auth.uid()
    )
  );

-- Owner can insert breeding dogs
CREATE POLICY "Owner can insert breeding dogs"
  ON breeding_dogs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM breeder_profiles
      WHERE breeder_profiles.id = breeding_dogs.breeder_id
      AND breeder_profiles.user_id = auth.uid()
    )
  );

-- Owner can update breeding dogs
CREATE POLICY "Owner can update breeding dogs"
  ON breeding_dogs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM breeder_profiles
      WHERE breeder_profiles.id = breeding_dogs.breeder_id
      AND breeder_profiles.user_id = auth.uid()
    )
  );

-- Owner can delete breeding dogs
CREATE POLICY "Owner can delete breeding dogs"
  ON breeding_dogs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM breeder_profiles
      WHERE breeder_profiles.id = breeding_dogs.breeder_id
      AND breeder_profiles.user_id = auth.uid()
    )
  );
