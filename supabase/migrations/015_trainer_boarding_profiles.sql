-- 015_trainer_boarding_profiles.sql
-- Minimal scaffolding tables for addestratori and pensioni verticals.
-- Each vertical team (addestratore / pensione) extends this with their own
-- vertical-specific columns in later migrations.

-- ── trainer_profiles ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trainer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  region TEXT,
  province TEXT,
  city TEXT,
  address TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  phone TEXT,
  email_public TEXT,
  website TEXT,
  whatsapp TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  logo_url TEXT,
  gallery_urls TEXT[] DEFAULT '{}',
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trainer_slug ON trainer_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_trainer_region ON trainer_profiles(region, province);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON trainer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── boarding_profiles ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS boarding_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  region TEXT,
  province TEXT,
  city TEXT,
  address TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  phone TEXT,
  email_public TEXT,
  website TEXT,
  whatsapp TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  logo_url TEXT,
  gallery_urls TEXT[] DEFAULT '{}',
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boarding_slug ON boarding_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_boarding_region ON boarding_profiles(region, province);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON boarding_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RLS (mirrors breeder_profiles pattern) ──────────────────────────────────
ALTER TABLE trainer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE boarding_profiles ENABLE ROW LEVEL SECURITY;

-- trainer_profiles policies
CREATE POLICY "Approved trainers are viewable"       ON trainer_profiles FOR SELECT USING (is_approved = true);
CREATE POLICY "Owner can view own trainer profile"   ON trainer_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Owner can insert own trainer profile" ON trainer_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner can update own trainer profile" ON trainer_profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins manage all trainers"           ON trainer_profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- boarding_profiles policies
CREATE POLICY "Approved boardings are viewable"       ON boarding_profiles FOR SELECT USING (is_approved = true);
CREATE POLICY "Owner can view own boarding profile"   ON boarding_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Owner can insert own boarding profile" ON boarding_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner can update own boarding profile" ON boarding_profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins manage all boardings"           ON boarding_profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
