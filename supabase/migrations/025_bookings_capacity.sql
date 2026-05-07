-- 025_bookings_capacity.sql
-- Capacity-aware bookings:
--   • capacity column on boarding_profiles (max simultaneous dogs)
--   • boarding_blocks: owner-defined unavailable date ranges (ferie, manutenzione)
--   • check_availability SQL function used by /api/bookings, /api/bookings/availability,
--     and the dashboard calendar view.

-- ── 1. Capacity ────────────────────────────────────────────────────────────
ALTER TABLE boarding_profiles
  ADD COLUMN IF NOT EXISTS capacity INT NOT NULL DEFAULT 10
    CHECK (capacity > 0);

-- ── 2. boarding_blocks ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS boarding_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boarding_id UUID NOT NULL REFERENCES boarding_profiles(id) ON DELETE CASCADE,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (date_to > date_from)
);

CREATE INDEX IF NOT EXISTS idx_boarding_blocks_boarding ON boarding_blocks(boarding_id);
CREATE INDEX IF NOT EXISTS idx_boarding_blocks_dates ON boarding_blocks(date_from, date_to);

ALTER TABLE boarding_blocks ENABLE ROW LEVEL SECURITY;

-- Anyone can read blocks (public availability requires it)
DROP POLICY IF EXISTS "Blocks are readable" ON boarding_blocks;
CREATE POLICY "Blocks are readable"
  ON boarding_blocks FOR SELECT
  USING (true);

-- Owner can insert/update/delete their own blocks
DROP POLICY IF EXISTS "Owner manages own blocks" ON boarding_blocks;
CREATE POLICY "Owner manages own blocks"
  ON boarding_blocks FOR ALL
  USING (
    boarding_id IN (
      SELECT id FROM boarding_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    boarding_id IN (
      SELECT id FROM boarding_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins manage all blocks" ON boarding_blocks;
CREATE POLICY "Admins manage all blocks"
  ON boarding_blocks FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 3. check_availability(boarding_id, from, to) ──────────────────────────
-- Returns one row per day in [p_from, p_to) with:
--   • occupied: count of active bookings overlapping that day
--   • capacity: configured capacity of the boarding
--   • is_blocked: true if a boarding_blocks entry covers that day
-- Pending bookings count only if created in the last 72h (auto-expire stale ones).
CREATE OR REPLACE FUNCTION check_availability(
  p_boarding_id UUID,
  p_from DATE,
  p_to DATE
)
RETURNS TABLE (
  day DATE,
  occupied INT,
  capacity INT,
  is_blocked BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH cap AS (
    SELECT bp.capacity AS c FROM boarding_profiles bp WHERE bp.id = p_boarding_id
  ),
  days AS (
    SELECT d::date AS day
    FROM generate_series(p_from, p_to - INTERVAL '1 day', INTERVAL '1 day') AS d
  )
  SELECT
    days.day,
    (
      SELECT COUNT(*)::int FROM bookings b
      WHERE b.boarding_id = p_boarding_id
        AND b.check_in <= days.day
        AND b.check_out > days.day
        AND (
          b.status = 'confirmed'
          OR (b.status = 'pending' AND b.created_at > now() - INTERVAL '72 hours')
        )
    ) AS occupied,
    (SELECT c FROM cap) AS capacity,
    EXISTS (
      SELECT 1 FROM boarding_blocks bb
      WHERE bb.boarding_id = p_boarding_id
        AND bb.date_from <= days.day
        AND bb.date_to > days.day
    ) AS is_blocked
  FROM days
  ORDER BY days.day;
$$;

GRANT EXECUTE ON FUNCTION check_availability(UUID, DATE, DATE) TO anon, authenticated;

-- Convenience: scalar version that returns true if any day in the range is full or blocked.
CREATE OR REPLACE FUNCTION is_range_available(
  p_boarding_id UUID,
  p_from DATE,
  p_to DATE
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM check_availability(p_boarding_id, p_from, p_to) a
    WHERE a.is_blocked OR a.occupied >= a.capacity
  );
$$;

GRANT EXECUTE ON FUNCTION is_range_available(UUID, DATE, DATE) TO anon, authenticated;

-- ── 5. RLS: owner può inserire bookings con qualsiasi status sulla propria pensione
-- (la policy esistente "Anyone can request a booking" copre solo status=pending,
--  serve un'altra policy per le prenotazioni manuali che partono come 'confirmed').
DROP POLICY IF EXISTS "Owner inserts own boarding bookings" ON bookings;
CREATE POLICY "Owner inserts own boarding bookings"
  ON bookings FOR INSERT
  WITH CHECK (
    boarding_id IN (
      SELECT id FROM boarding_profiles WHERE user_id = auth.uid()
    )
  );
