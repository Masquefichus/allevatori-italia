-- 007_litters_puppies.sql
-- Replaces the listings system with structured litters + puppies model
-- Litters are connected to breeding_dogs (mother/father)

-- ============================================
-- LITTERS TABLE
-- ============================================
CREATE TABLE litters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  breeder_id UUID NOT NULL REFERENCES breeder_profiles(id) ON DELETE CASCADE,
  breed_id UUID REFERENCES breeds(id),

  -- Mother (must be breeder's own femmina)
  mother_id UUID NOT NULL REFERENCES breeding_dogs(id),

  -- Father: either own dog or external
  father_id UUID REFERENCES breeding_dogs(id),
  is_external_father BOOLEAN NOT NULL DEFAULT false,

  -- External father info (used when is_external_father = true and father_id is null)
  external_father_name TEXT,
  external_father_kennel TEXT,
  external_father_breed_id UUID REFERENCES breeds(id),
  external_father_color TEXT,
  external_father_pedigree_number TEXT,
  external_father_photo_url TEXT,
  external_father_titles TEXT[] DEFAULT '{}',
  external_father_health_screenings JSONB DEFAULT '{}',

  -- Litter info
  name TEXT NOT NULL,
  litter_date DATE,
  pedigree_included BOOLEAN NOT NULL DEFAULT true,
  vaccinated BOOLEAN NOT NULL DEFAULT false,
  microchipped BOOLEAN NOT NULL DEFAULT false,
  images TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'attivo' CHECK (status IN ('attivo', 'venduto', 'scaduto', 'bozza')),
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_litters_breeder ON litters(breeder_id, status);
CREATE INDEX idx_litters_breed ON litters(breed_id, status);
CREATE INDEX idx_litters_mother ON litters(mother_id);
CREATE INDEX idx_litters_father ON litters(father_id);

CREATE TRIGGER set_litters_updated_at
  BEFORE UPDATE ON litters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- PUPPIES TABLE
-- ============================================
CREATE TABLE puppies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  litter_id UUID NOT NULL REFERENCES litters(id) ON DELETE CASCADE,
  name TEXT,
  sex TEXT NOT NULL CHECK (sex IN ('maschio', 'femmina')),
  color TEXT,
  status TEXT NOT NULL DEFAULT 'disponibile' CHECK (status IN ('disponibile', 'prenotato', 'venduto')),
  photo_url TEXT,
  price INTEGER,
  price_on_request BOOLEAN NOT NULL DEFAULT false,
  microchip_number TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_puppies_litter ON puppies(litter_id, sort_order);

CREATE TRIGGER set_puppies_updated_at
  BEFORE UPDATE ON puppies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- RLS: LITTERS
-- ============================================
ALTER TABLE litters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active litters are viewable"
  ON litters FOR SELECT
  USING (
    status = 'attivo' AND
    EXISTS (
      SELECT 1 FROM breeder_profiles
      WHERE breeder_profiles.id = litters.breeder_id
      AND breeder_profiles.is_approved = true
    )
  );

CREATE POLICY "Owner can view own litters"
  ON litters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM breeder_profiles
      WHERE breeder_profiles.id = litters.breeder_id
      AND breeder_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can insert litters"
  ON litters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM breeder_profiles
      WHERE breeder_profiles.id = litters.breeder_id
      AND breeder_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can update litters"
  ON litters FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM breeder_profiles
      WHERE breeder_profiles.id = litters.breeder_id
      AND breeder_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can delete litters"
  ON litters FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM breeder_profiles
      WHERE breeder_profiles.id = litters.breeder_id
      AND breeder_profiles.user_id = auth.uid()
    )
  );

-- ============================================
-- RLS: PUPPIES
-- ============================================
ALTER TABLE puppies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Puppies of active litters are viewable"
  ON puppies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM litters
      JOIN breeder_profiles ON breeder_profiles.id = litters.breeder_id
      WHERE litters.id = puppies.litter_id
      AND litters.status = 'attivo'
      AND breeder_profiles.is_approved = true
    )
  );

CREATE POLICY "Owner can view own puppies"
  ON puppies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM litters
      JOIN breeder_profiles ON breeder_profiles.id = litters.breeder_id
      WHERE litters.id = puppies.litter_id
      AND breeder_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can insert puppies"
  ON puppies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM litters
      JOIN breeder_profiles ON breeder_profiles.id = litters.breeder_id
      WHERE litters.id = puppies.litter_id
      AND breeder_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can update puppies"
  ON puppies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM litters
      JOIN breeder_profiles ON breeder_profiles.id = litters.breeder_id
      WHERE litters.id = puppies.litter_id
      AND breeder_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can delete puppies"
  ON puppies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM litters
      JOIN breeder_profiles ON breeder_profiles.id = litters.breeder_id
      WHERE litters.id = puppies.litter_id
      AND breeder_profiles.user_id = auth.uid()
    )
  );

-- ============================================
-- MIGRATE CONVERSATIONS FK
-- ============================================
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_listing_id_fkey;
ALTER TABLE conversations RENAME COLUMN listing_id TO litter_id;
ALTER TABLE conversations ADD CONSTRAINT conversations_litter_id_fkey
  FOREIGN KEY (litter_id) REFERENCES litters(id) ON DELETE SET NULL;

-- ============================================
-- DROP OLD LISTINGS TABLE
-- ============================================
DROP TABLE IF EXISTS listings CASCADE;
