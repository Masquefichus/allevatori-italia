-- 014_profile_roles_no_approval.sql
-- Temporarily remove the admin approval gate for profile_roles.
-- Owners can now self-activate any service role. is_approved stays on the table
-- (it is_ still writable) so a future migration can re-enable verification without schema churn.

DROP POLICY IF EXISTS "Owner can request own role" ON profile_roles;

CREATE POLICY "Owner can add own role"
  ON profile_roles FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- Any already-submitted pending roles go live immediately.
UPDATE profile_roles
SET is_active = true, is_approved = true
WHERE is_active = false OR is_approved = false;
