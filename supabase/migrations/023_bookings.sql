-- 023_bookings.sql
-- Boarding bookings: a dog owner (or guest) requests a stay at a pensione.
-- The pensione owner sees the request in their dashboard and accepts/declines.
-- Status flow: pending → confirmed/declined/cancelled → completed.

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boarding_id UUID NOT NULL REFERENCES boarding_profiles(id) ON DELETE CASCADE,

  -- Requester: optional logged-in user, plus denormalized contact
  -- so guest requests work and contact stays valid even if user deletes account.
  requester_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requester_phone TEXT,

  -- Stay details
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  CHECK (check_out > check_in),

  -- Dog details
  dog_name TEXT NOT NULL,
  dog_breed TEXT,
  dog_size TEXT CHECK (dog_size IN ('piccola', 'media', 'grande', 'gigante')),

  -- Free-text from requester
  notes TEXT,

  -- Status + reply
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled', 'completed')),
  response_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_boarding ON bookings(boarding_id);
CREATE INDEX IF NOT EXISTS idx_bookings_requester ON bookings(requester_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in ON bookings(check_in);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Boarding owner can read all bookings for their structure(s)
CREATE POLICY "Owner reads own boarding bookings"
  ON bookings FOR SELECT
  USING (
    boarding_id IN (
      SELECT id FROM boarding_profiles WHERE user_id = auth.uid()
    )
  );

-- Logged-in requester can read their own bookings
CREATE POLICY "Requester reads own bookings"
  ON bookings FOR SELECT
  USING (requester_id = auth.uid());

-- Anyone (including anon/guest) can create a pending booking request.
-- Server-side validation in /api/bookings ensures sane payload.
CREATE POLICY "Anyone can request a booking"
  ON bookings FOR INSERT
  WITH CHECK (status = 'pending');

-- Boarding owner can update status + response_message on their bookings
CREATE POLICY "Owner updates own bookings"
  ON bookings FOR UPDATE
  USING (
    boarding_id IN (
      SELECT id FROM boarding_profiles WHERE user_id = auth.uid()
    )
  );

-- Requester can cancel their own pending booking
CREATE POLICY "Requester cancels own pending booking"
  ON bookings FOR UPDATE
  USING (requester_id = auth.uid() AND status = 'pending');

-- Admins manage everything
CREATE POLICY "Admins manage all bookings"
  ON bookings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
