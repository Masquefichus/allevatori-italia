-- 017_owner_delete_policies.sql
-- Allow owners to delete their own role entries and vertical profiles.
-- Required for the "remove role" feature on the public profile page.

CREATE POLICY "Owner can delete own role"
  ON profile_roles FOR DELETE
  USING (profile_id = auth.uid());

CREATE POLICY "Owner can delete own trainer profile"
  ON trainer_profiles FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Owner can delete own boarding profile"
  ON boarding_profiles FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Owner can delete own breeder profile"
  ON breeder_profiles FOR DELETE
  USING (user_id = auth.uid());
