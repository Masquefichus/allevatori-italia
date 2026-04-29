-- 017_vet_profiles.sql
-- Veterinari vertical. Vets are an account_type, not a profile_role: a single
-- profile is either a service_pro (with one or more roles in profile_roles) or
-- a vet, never both. Exclusivity is enforced at the DB layer in addition to
-- the onboarding flow split.

-- ── 1. vet_profiles ────────────────────────────────────────────────────────
-- Shape mirrors trainer_profiles/boarding_profiles (shared identity columns
-- are duplicated here for now; migration 016 introduced profile_identity but
-- the role tables haven't been cut over yet — vets follow the same pattern
-- and will be migrated together in a future cleanup).
CREATE TABLE IF NOT EXISTS vet_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,

  -- Location
  region TEXT,
  province TEXT,
  city TEXT,
  address TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),

  -- Contact
  phone TEXT,
  email_public TEXT,
  website TEXT,
  whatsapp TEXT,
  facebook_url TEXT,
  instagram_url TEXT,

  -- Media
  logo_url TEXT,
  cover_image_url TEXT,
  gallery_urls TEXT[] NOT NULL DEFAULT '{}',

  -- Italian credentials (Ordine dei Veterinari)
  albo_number TEXT,
  albo_region TEXT,
  albo_verified BOOLEAN NOT NULL DEFAULT false,
  university TEXT,
  graduation_year INTEGER,
  years_experience INTEGER,

  -- Practice
  clinic_name TEXT,
  emergency_available BOOLEAN NOT NULL DEFAULT false,
  house_visits BOOLEAN NOT NULL DEFAULT false,
  languages TEXT[] NOT NULL DEFAULT '{italiano}',
  specializations TEXT[] NOT NULL DEFAULT '{}',

  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vet_slug ON vet_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_vet_region ON vet_profiles(region, province);
CREATE INDEX IF NOT EXISTS idx_vet_specializations ON vet_profiles USING GIN (specializations);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON vet_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 2. RLS (mirrors trainer_profiles / boarding_profiles) ──────────────────
ALTER TABLE vet_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved vets are viewable"       ON vet_profiles FOR SELECT USING (is_approved = true);
CREATE POLICY "Owner can view own vet profile"   ON vet_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Owner can insert own vet profile" ON vet_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner can update own vet profile" ON vet_profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Owner can delete own vet profile" ON vet_profiles FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Admins manage all vets"           ON vet_profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 3. Exclusivity invariant ───────────────────────────────────────────────
-- Vets cannot also be service_pros, and service_pros (with any role row)
-- cannot become vets. Enforced two ways:
--   a) reject INSERT/UPDATE on profile_roles when the profile is a vet
--   b) reject UPDATE on profiles.account_type to 'vet' when role rows exist
CREATE OR REPLACE FUNCTION enforce_no_vet_with_roles()
RETURNS TRIGGER AS $$
DECLARE
  current_account_type TEXT;
BEGIN
  SELECT account_type INTO current_account_type
  FROM profiles
  WHERE id = NEW.profile_id;

  IF current_account_type = 'vet' THEN
    RAISE EXCEPTION 'Cannot assign a service role to a profile with account_type=vet (profile_id=%)', NEW.profile_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profile_roles_block_vets
  BEFORE INSERT OR UPDATE ON profile_roles
  FOR EACH ROW EXECUTE FUNCTION enforce_no_vet_with_roles();

CREATE OR REPLACE FUNCTION enforce_no_roles_when_becoming_vet()
RETURNS TRIGGER AS $$
DECLARE
  role_count INTEGER;
BEGIN
  IF NEW.account_type = 'vet' AND (OLD.account_type IS DISTINCT FROM 'vet') THEN
    SELECT COUNT(*) INTO role_count
    FROM profile_roles
    WHERE profile_id = NEW.id;

    IF role_count > 0 THEN
      RAISE EXCEPTION 'Cannot set account_type=vet on profile with existing service roles (profile_id=%)', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_block_vet_with_roles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_no_roles_when_becoming_vet();

-- ── 4. Update handle_new_user to set account_type from signup metadata ─────
-- New signups can pass `account_type` ∈ {seeker, service_pro, vet} in user
-- metadata. Falls back to deriving from legacy `role` for backward compat.
-- profiles.role stays in {'user', 'breeder', 'admin'}; vet maps to role='user'.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  raw_role TEXT := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  raw_account_type TEXT := NEW.raw_user_meta_data->>'account_type';
  derived_role TEXT;
  derived_account_type TEXT;
BEGIN
  IF raw_account_type IN ('seeker', 'service_pro', 'vet') THEN
    derived_account_type := raw_account_type;
  ELSIF raw_role = 'breeder' THEN
    derived_account_type := 'service_pro';
  ELSE
    derived_account_type := 'seeker';
  END IF;

  derived_role := CASE
    WHEN raw_role IN ('user', 'breeder', 'admin') THEN raw_role
    WHEN raw_account_type = 'vet' THEN 'user'
    ELSE 'user'
  END;

  INSERT INTO public.profiles (id, email, full_name, role, account_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utente'),
    derived_role,
    derived_account_type
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
