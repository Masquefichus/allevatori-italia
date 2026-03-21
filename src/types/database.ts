export type UserRole = "user" | "breeder" | "admin";
export type SizeCategory = "piccola" | "media" | "grande" | "gigante";
export type ListingStatus = "attivo" | "venduto" | "scaduto" | "bozza";
export type GenderAvailable = "maschio" | "femmina" | "entrambi";
export type SubscriptionPlan = "base" | "premium" | "elite";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing";

// ─── Row types (match database columns exactly) ───

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Breed {
  id: string;
  name_it: string;
  name_en: string | null;
  slug: string;
  group_fci: number | null;
  group_name_it: string | null;
  description_it: string | null;
  image_url: string | null;
  origin_country: string | null;
  size_category: SizeCategory | null;
  is_italian_breed: boolean;
  is_popular: boolean;
  created_at: string;
}

export interface BreederProfileRow {
  id: string;
  user_id: string;
  kennel_name: string;
  slug: string;
  description: string | null;
  region: string;
  province: string;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  website: string | null;
  phone: string | null;
  email_public: string | null;
  whatsapp: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  enci_number: string | null;
  enci_verified: boolean;
  fci_affiliated: boolean;
  year_established: number | null;
  breed_ids: string[];
  specializations: string[];
  certifications: string[];
  logo_url: string | null;
  cover_image_url: string | null;
  gallery_urls: string[];
  is_approved: boolean;
  is_premium: boolean;
  premium_until: string | null;
  average_rating: number;
  review_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface ListingRow {
  id: string;
  breeder_id: string;
  breed_id: string;
  title: string;
  description: string | null;
  price_min: number | null;
  price_max: number | null;
  price_on_request: boolean;
  litter_date: string | null;
  available_puppies: number | null;
  gender_available: GenderAvailable | null;
  pedigree_included: boolean;
  vaccinated: boolean;
  microchipped: boolean;
  health_tests: string[];
  images: string[];
  status: ListingStatus;
  is_featured: boolean;
  views: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewRow {
  id: string;
  breeder_id: string;
  author_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  is_reported: boolean;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationRow {
  id: string;
  participant_1: string;
  participant_2: string;
  listing_id: string | null;
  last_message_at: string | null;
  created_at: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  breeder_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Enriched types (with joined fields, for app usage) ───

export interface BreederProfile extends BreederProfileRow {
  breeds?: Breed[];
  profile?: Profile;
}

export interface Listing extends ListingRow {
  breed?: Breed;
  breeder?: BreederProfile;
}

export interface Review extends ReviewRow {
  author?: Profile;
}

export interface Conversation extends ConversationRow {
  other_participant?: Profile;
  last_message?: Message;
  listing?: Listing;
}

export interface Message extends MessageRow {
  sender?: Profile;
}

// ─── Supabase Database type ───

type TableDef<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<Profile>;
      breeds: TableDef<Breed>;
      breeder_profiles: TableDef<BreederProfileRow>;
      listings: TableDef<ListingRow>;
      reviews: TableDef<ReviewRow>;
      conversations: TableDef<ConversationRow>;
      messages: TableDef<MessageRow>;
      subscriptions: TableDef<Subscription>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
