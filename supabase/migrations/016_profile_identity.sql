-- 016_profile_identity.sql
-- Canonical shared identity for the multi-role profile hub.
-- One row per user_id holds the role-agnostic Chi siamo content (description,
-- contact, location, media). Per-role tables (breeder_profiles, trainer_profiles,
-- boarding_profiles) keep only their vertical-specific fields from here forward.
--
-- Strategy: this migration *adds* profile_identity and backfills from
-- breeder_profiles. It does NOT drop columns from role tables yet — reads from
-- role tables keep working until every client is cut over to profile_identity.
-- A future migration will drop the now-duplicated columns from role tables.

-- ── 1. Table ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profile_identity (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
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
  logo_position TEXT DEFAULT '50% 50%',
  cover_image_url TEXT,
  cover_image_position TEXT DEFAULT '50% 50%',
  gallery_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_identity_region ON profile_identity(region, province);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profile_identity
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 2. Backfill from breeder_profiles ───────────────────────────────────────
INSERT INTO profile_identity (
  user_id, description,
  region, province, city, address, latitude, longitude,
  phone, email_public, website, whatsapp, facebook_url, instagram_url,
  logo_url, logo_position, cover_image_url, cover_image_position, gallery_urls
)
SELECT
  bp.user_id, bp.description,
  bp.region, bp.province, bp.city, bp.address, bp.latitude, bp.longitude,
  bp.phone, bp.email_public, bp.website, bp.whatsapp, bp.facebook_url, bp.instagram_url,
  bp.logo_url, COALESCE(bp.logo_position, '50% 50%'),
  bp.cover_image_url, COALESCE(bp.cover_image_position, '50% 50%'),
  COALESCE(bp.gallery_urls, '{}')
FROM breeder_profiles bp
ON CONFLICT (user_id) DO NOTHING;

-- ── 3. RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE profile_identity ENABLE ROW LEVEL SECURITY;

-- Public reads allowed when the owner has at least one approved, active role.
-- Owners always see their own identity row (including before any role approval).
CREATE POLICY "Identity viewable when pro has active role"
  ON profile_identity FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profile_roles pr
      WHERE pr.profile_id = profile_identity.user_id
        AND pr.is_active = true
        AND pr.is_approved = true
    )
  );

CREATE POLICY "Owner can view own identity"
  ON profile_identity FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Owner can insert own identity"
  ON profile_identity FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can update own identity"
  ON profile_identity FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage all identities"
  ON profile_identity FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
