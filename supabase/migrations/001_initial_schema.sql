-- AllevatoriItalia Database Schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'breeder', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utente'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- BREEDS
-- ============================================
CREATE TABLE breeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_it TEXT NOT NULL UNIQUE,
  name_en TEXT,
  slug TEXT NOT NULL UNIQUE,
  group_fci INTEGER,
  group_name_it TEXT,
  description_it TEXT,
  image_url TEXT,
  origin_country TEXT,
  size_category TEXT CHECK (size_category IN ('piccola', 'media', 'grande', 'gigante')),
  is_italian_breed BOOLEAN NOT NULL DEFAULT false,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_breeds_slug ON breeds(slug);
CREATE INDEX idx_breeds_popular ON breeds(is_popular) WHERE is_popular = true;
CREATE INDEX idx_breeds_italian ON breeds(is_italian_breed) WHERE is_italian_breed = true;

-- ============================================
-- BREEDER PROFILES
-- ============================================
CREATE TABLE breeder_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  kennel_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  region TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT,
  address TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  website TEXT,
  phone TEXT,
  email_public TEXT,
  whatsapp TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  enci_number TEXT,
  enci_verified BOOLEAN NOT NULL DEFAULT false,
  fci_affiliated BOOLEAN NOT NULL DEFAULT false,
  year_established INTEGER,
  breed_ids UUID[] DEFAULT '{}',
  specializations TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  logo_url TEXT,
  cover_image_url TEXT,
  gallery_urls TEXT[] DEFAULT '{}',
  is_approved BOOLEAN NOT NULL DEFAULT false,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  premium_until TIMESTAMPTZ,
  average_rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_breeder_region ON breeder_profiles(region, province);
CREATE INDEX idx_breeder_approved ON breeder_profiles(is_approved, is_premium);
CREATE INDEX idx_breeder_slug ON breeder_profiles(slug);

-- ============================================
-- LISTINGS
-- ============================================
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  breeder_id UUID NOT NULL REFERENCES breeder_profiles(id) ON DELETE CASCADE,
  breed_id UUID NOT NULL REFERENCES breeds(id),
  title TEXT NOT NULL,
  description TEXT,
  price_min INTEGER,
  price_max INTEGER,
  price_on_request BOOLEAN NOT NULL DEFAULT false,
  litter_date DATE,
  available_puppies INTEGER,
  gender_available TEXT CHECK (gender_available IN ('maschio', 'femmina', 'entrambi')),
  pedigree_included BOOLEAN NOT NULL DEFAULT true,
  vaccinated BOOLEAN NOT NULL DEFAULT false,
  microchipped BOOLEAN NOT NULL DEFAULT false,
  health_tests TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'bozza' CHECK (status IN ('attivo', 'venduto', 'scaduto', 'bozza')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  views INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_listing_breeder ON listings(breeder_id, status);
CREATE INDEX idx_listing_breed ON listings(breed_id, status);

-- ============================================
-- REVIEWS
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  breeder_id UUID NOT NULL REFERENCES breeder_profiles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  is_reported BOOLEAN NOT NULL DEFAULT false,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(breeder_id, author_id)
);

CREATE INDEX idx_reviews_breeder ON reviews(breeder_id, is_approved);

-- Trigger to update breeder rating on review changes
CREATE OR REPLACE FUNCTION update_breeder_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_breeder_id UUID;
BEGIN
  target_breeder_id := COALESCE(NEW.breeder_id, OLD.breeder_id);

  UPDATE breeder_profiles
  SET
    average_rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM reviews
      WHERE breeder_id = target_breeder_id AND is_approved = true
    ), 0),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE breeder_id = target_breeder_id AND is_approved = true
    ),
    updated_at = now()
  WHERE id = target_breeder_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_breeder_rating();

-- ============================================
-- CONVERSATIONS & MESSAGES
-- ============================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_1 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversations_p1 ON conversations(participant_1);
CREATE INDEX idx_conversations_p2 ON conversations(participant_2);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);

-- ============================================
-- SUBSCRIPTIONS
-- ============================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  breeder_id UUID NOT NULL REFERENCES breeder_profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('base', 'premium', 'elite')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- FAVORITES
-- ============================================
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  breeder_id UUID NOT NULL REFERENCES breeder_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, breeder_id)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE breeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE breeder_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, users update own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Breeds: anyone can read
CREATE POLICY "Breeds are viewable by everyone" ON breeds FOR SELECT USING (true);
CREATE POLICY "Admins can manage breeds" ON breeds FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Breeder profiles: anyone reads approved, owner/admin manages
CREATE POLICY "Approved breeders are viewable" ON breeder_profiles FOR SELECT USING (is_approved = true);
CREATE POLICY "Owner can view own breeder profile" ON breeder_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Breeders can insert own profile" ON breeder_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Breeders can update own profile" ON breeder_profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins manage all breeders" ON breeder_profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Listings: anyone reads active, owner manages
CREATE POLICY "Active listings are viewable" ON listings FOR SELECT USING (status = 'attivo');
CREATE POLICY "Breeders can manage own listings" ON listings FOR ALL USING (
  EXISTS (SELECT 1 FROM breeder_profiles WHERE id = listings.breeder_id AND user_id = auth.uid())
);

-- Reviews: anyone reads approved, auth creates, author/admin manages
CREATE POLICY "Approved reviews are viewable" ON reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Auth users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own reviews" ON reviews FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "Admins manage all reviews" ON reviews FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Conversations: only participants
CREATE POLICY "Participants can view conversations" ON conversations FOR SELECT
  USING (participant_1 = auth.uid() OR participant_2 = auth.uid());
CREATE POLICY "Auth users can create conversations" ON conversations FOR INSERT
  WITH CHECK (participant_1 = auth.uid() OR participant_2 = auth.uid());

-- Messages: only conversation participants
CREATE POLICY "Participants can view messages" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
  )
);
CREATE POLICY "Participants can send messages" ON messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
  )
);

-- Subscriptions: user reads own
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins manage subscriptions" ON subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Favorites: user manages own
CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can add favorites" ON favorites FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can remove favorites" ON favorites FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON breeder_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
