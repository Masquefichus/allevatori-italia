-- Breed favorites: users can save breeds by slug (static data, not all in breeds table)
CREATE TABLE breed_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  breed_slug TEXT NOT NULL,
  breed_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, breed_slug)
);

ALTER TABLE breed_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own breed favorites" ON breed_favorites FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can add breed favorites" ON breed_favorites FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can remove breed favorites" ON breed_favorites FOR DELETE USING (user_id = auth.uid());
