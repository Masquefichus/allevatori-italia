-- 024_repair_triggers.sql
-- Repair triggers accidentally dropped by a partial run of 000_drop_all.sql
-- (run halted at "DROP TRIGGER set_updated_at ON listings" because the table
-- listings does not exist on this DB — but the four DROP statements before
-- that point did execute, removing critical triggers).
--
-- Triggers being recreated:
--   on_auth_user_created  → auto-creates profiles row on auth.users insert
--   on_review_change      → recomputes breeder_profiles.media_rating
--   set_updated_at on profiles
--   set_updated_at on breeder_profiles
--
-- All function bodies (handle_new_user, update_breeder_rating, update_updated_at)
-- were not dropped, so we only need to re-attach the triggers.

-- Drop-then-create to make the migration idempotent across re-runs.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS on_review_change ON reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_breeder_rating();

DROP TRIGGER IF EXISTS set_updated_at ON profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON breeder_profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON breeder_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
