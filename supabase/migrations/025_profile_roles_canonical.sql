-- 025_profile_roles_canonical.sql
-- Make `profile_roles.is_active=true` the canonical signal that a user offers a service.
--
-- Before this migration three sources independently answered "does user X offer service Y?"
-- and could disagree:
--   1. Per-role tables  (breeder_profiles / trainer_profiles / boarding_profiles + their is_approved)
--   2. profile_roles.is_active
--   3. profiles.role='admin' legacy carve-out
--
-- After this migration:
--   • profile_roles.is_active is the only signal read by the app for service visibility
--     and dashboard gating.
--   • Public-SELECT RLS on the three per-role tables is rewritten to consult profile_roles.
--   • A SECURITY DEFINER function atomically creates a per-role row + activates profile_roles,
--     replacing the previous client-side two-step that could leave dangling rows.
--   • An AFTER DELETE trigger on each per-role table flips profile_roles.is_active=false so
--     the two never drift back out of sync.
--   • Legacy admins (role='admin', account_type=NULL) get account_type='service_pro' so the
--     dashboard nav can run on account_type alone.
--
-- Vets are intentionally untouched: account_type='vet' is a separate axis by design (017).

-- ── 1. Backfill profile_roles.is_active ──────────────────────────────────────
-- Every user who has a row in a per-role table should have an active matching profile_roles row.
-- Use ON CONFLICT to handle existing rows that were inserted with is_active=false (the bug).

INSERT INTO profile_roles (profile_id, role, is_active, is_approved)
SELECT user_id, 'allevatore', true, true FROM breeder_profiles
ON CONFLICT (profile_id, role) DO UPDATE SET is_active = true;

INSERT INTO profile_roles (profile_id, role, is_active, is_approved)
SELECT user_id, 'addestratore', true, true FROM trainer_profiles
ON CONFLICT (profile_id, role) DO UPDATE SET is_active = true;

INSERT INTO profile_roles (profile_id, role, is_active, is_approved)
SELECT user_id, 'pensione', true, true FROM boarding_profiles
ON CONFLICT (profile_id, role) DO UPDATE SET is_active = true;

-- ── 2. Promote legacy admins to service_pro ─────────────────────────────────
-- Anyone with at least one profile_roles row but no account_type was a legacy admin
-- on the old "role gates everything" path. Give them service_pro so the new nav works.

UPDATE profiles
SET account_type = 'service_pro'
WHERE account_type IS NULL
  AND id IN (SELECT DISTINCT profile_id FROM profile_roles);

-- ── 3. Replace public SELECT RLS to gate on profile_roles.is_active ─────────
-- Owner-self policies and admin-manage policies stay untouched.

DROP POLICY IF EXISTS "Approved breeders are viewable" ON breeder_profiles;
CREATE POLICY "Active breeders are viewable" ON breeder_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profile_roles pr
      WHERE pr.profile_id = breeder_profiles.user_id
        AND pr.role = 'allevatore'
        AND pr.is_active = true
    )
  );

DROP POLICY IF EXISTS "Approved trainers are viewable" ON trainer_profiles;
CREATE POLICY "Active trainers are viewable" ON trainer_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profile_roles pr
      WHERE pr.profile_id = trainer_profiles.user_id
        AND pr.role = 'addestratore'
        AND pr.is_active = true
    )
  );

DROP POLICY IF EXISTS "Approved boardings are viewable" ON boarding_profiles;
CREATE POLICY "Active boardings are viewable" ON boarding_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profile_roles pr
      WHERE pr.profile_id = boarding_profiles.user_id
        AND pr.role = 'pensione'
        AND pr.is_active = true
    )
  );

-- ── 4. Sync invariant: per-role row deleted → profile_roles.is_active=false ─

CREATE OR REPLACE FUNCTION deactivate_profile_role_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profile_roles
    SET is_active = false
  WHERE profile_id = OLD.user_id AND role = TG_ARGV[0];
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS deactivate_breeder_role ON breeder_profiles;
CREATE TRIGGER deactivate_breeder_role AFTER DELETE ON breeder_profiles
  FOR EACH ROW EXECUTE FUNCTION deactivate_profile_role_on_delete('allevatore');

DROP TRIGGER IF EXISTS deactivate_trainer_role ON trainer_profiles;
CREATE TRIGGER deactivate_trainer_role AFTER DELETE ON trainer_profiles
  FOR EACH ROW EXECUTE FUNCTION deactivate_profile_role_on_delete('addestratore');

DROP TRIGGER IF EXISTS deactivate_boarding_role ON boarding_profiles;
CREATE TRIGGER deactivate_boarding_role AFTER DELETE ON boarding_profiles
  FOR EACH ROW EXECUTE FUNCTION deactivate_profile_role_on_delete('pensione');

-- ── 5. Atomic onboarding RPC ────────────────────────────────────────────────
-- Before: client did two separate inserts (per-role table + profile_roles); a failure between
-- them left dangling rows. After: a single SQL transaction; either both land or neither does.
-- Slug uniqueness is the caller's job (collision-proof slug computed in the form layer).

CREATE OR REPLACE FUNCTION create_service_role_profile(
  p_role     TEXT,
  p_name     TEXT,
  p_slug     TEXT,
  p_region   TEXT DEFAULT NULL,
  p_province TEXT DEFAULT NULL,
  p_city     TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id   UUID;
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_role NOT IN ('allevatore', 'addestratore', 'pensione') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  IF p_role = 'allevatore' THEN
    INSERT INTO breeder_profiles (user_id, kennel_name, slug, region, province, city)
      VALUES (v_user, p_name, p_slug, p_region, p_province, p_city)
      RETURNING id INTO v_id;
  ELSIF p_role = 'addestratore' THEN
    INSERT INTO trainer_profiles (user_id, name, slug, region, province, city)
      VALUES (v_user, p_name, p_slug, p_region, p_province, p_city)
      RETURNING id INTO v_id;
  ELSIF p_role = 'pensione' THEN
    INSERT INTO boarding_profiles (user_id, name, slug, region, province, city)
      VALUES (v_user, p_name, p_slug, p_region, p_province, p_city)
      RETURNING id INTO v_id;
  END IF;

  INSERT INTO profile_roles (profile_id, role, is_active, is_approved)
    VALUES (v_user, p_role, true, true)
    ON CONFLICT (profile_id, role) DO UPDATE SET is_active = true;

  UPDATE profiles SET account_type = 'service_pro'
    WHERE id = v_user AND account_type IS NULL;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION create_service_role_profile(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
