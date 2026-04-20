-- 013_profile_roles.sql
-- Multi-role foundation: each profile can hold 1..N service roles.
-- Adds profiles.account_type (seeker | service_pro | vet) orthogonal to admin flag,
-- and a profile_roles join table so a single pro can be allevatore + addestratore + pensione.
-- Existing breeders are backfilled to service_pro + one 'allevatore' profile_roles row.

-- ── 1. profiles.account_type ────────────────────────────────────────────────
-- Kept separate from the legacy `role` column: `role` continues to flag admin,
-- while `account_type` captures the user journey (seeker vs service provider vs vet).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT
    CHECK (account_type IN ('seeker', 'service_pro', 'vet'));

UPDATE profiles SET account_type = 'seeker'      WHERE role = 'user'    AND account_type IS NULL;
UPDATE profiles SET account_type = 'service_pro' WHERE role = 'breeder' AND account_type IS NULL;
-- role = 'admin' → account_type stays NULL (admin is orthogonal)

CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type);

-- ── 2. profile_roles ────────────────────────────────────────────────────────
-- One row per (profile, service role). Vet is intentionally NOT in this enum —
-- vets live on a separate account_type with their own directory/profile.
CREATE TABLE IF NOT EXISTS profile_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('allevatore', 'addestratore', 'pensione')),
  is_active BOOLEAN NOT NULL DEFAULT false,   -- pro has finished onboarding + admin approved
  is_approved BOOLEAN NOT NULL DEFAULT false, -- admin approval gate per role
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, role)
);

CREATE INDEX IF NOT EXISTS idx_profile_roles_profile ON profile_roles(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_roles_role_active ON profile_roles(role, is_active);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profile_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 3. Backfill from existing breeder_profiles ──────────────────────────────
INSERT INTO profile_roles (profile_id, role, is_active, is_approved)
SELECT
  bp.user_id,
  'allevatore',
  bp.is_approved,   -- active iff already approved (matches today's visibility)
  bp.is_approved
FROM breeder_profiles bp
ON CONFLICT (profile_id, role) DO NOTHING;

-- ── 4. RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE profile_roles ENABLE ROW LEVEL SECURITY;

-- Active + approved roles are publicly readable (directory listings rely on this)
CREATE POLICY "Active roles are viewable"
  ON profile_roles FOR SELECT
  USING (is_active = true AND is_approved = true);

-- Owner can always read their own role rows (including pending/inactive)
CREATE POLICY "Owner can view own roles"
  ON profile_roles FOR SELECT
  USING (profile_id = auth.uid());

-- Owner can request a new role (inserts start is_active=false, is_approved=false)
CREATE POLICY "Owner can request own role"
  ON profile_roles FOR INSERT
  WITH CHECK (
    profile_id = auth.uid()
    AND is_active = false
    AND is_approved = false
  );

-- Owner can self-update non-gating fields (e.g. toggle is_active off to hide a role)
-- is_approved is admin-only and protected by a separate policy below.
CREATE POLICY "Owner can update own role"
  ON profile_roles FOR UPDATE
  USING (profile_id = auth.uid());

-- Admins manage everything
CREATE POLICY "Admins manage all profile_roles"
  ON profile_roles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
