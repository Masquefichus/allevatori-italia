export type UserRole = "user" | "breeder" | "admin";
export type SizeCategory = "piccola" | "media" | "grande" | "gigante";
export type LitterStatus = "attivo" | "venduto" | "scaduto" | "bozza";
export type PuppyStatus = "disponibile" | "prenotato" | "venduto";
export type PuppySex = "maschio" | "femmina";
export type SubscriptionPlan = "base" | "premium" | "elite";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing";

// ─── Row types (match database columns exactly) ───

export type AccountType = "seeker" | "service_pro" | "vet";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  account_type: AccountType | null;
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
  fci_id: number | null;
  is_italian_breed: boolean;
  is_popular: boolean;
  is_working_breed: boolean;
  seeker_attributes: Record<string, unknown> | null;
  height_min_cm: number | null;
  height_max_cm: number | null;
  coat_type: string | null;
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
  show_address: boolean;
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
  affisso: string | null;
  breed_club_memberships: string[];
  year_established: number | null;
  breed_ids: string[];
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

export interface LitterRow {
  id: string;
  breeder_id: string;
  breed_id: string | null;
  mother_id: string;
  father_id: string | null;
  is_external_father: boolean;
  external_father_name: string | null;
  external_father_kennel: string | null;
  external_father_breed_id: string | null;
  external_father_color: string | null;
  external_father_pedigree_number: string | null;
  external_father_photo_url: string | null;
  external_father_titles: string[];
  external_father_health_screenings: Record<string, string>;
  name: string;
  litter_date: string | null;
  pedigree_included: boolean;
  vaccinated: boolean;
  microchipped: boolean;
  images: string[];
  status: LitterStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PuppyRow {
  id: string;
  litter_id: string;
  name: string | null;
  sex: PuppySex;
  color: string | null;
  variety: string | null;
  status: PuppyStatus;
  photo_url: string | null;
  price: number | null;
  price_on_request: boolean;
  microchip_number: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type BreedingDogSex = "maschio" | "femmina";

export interface BreedingDogRow {
  id: string;
  breeder_id: string;
  name: string;
  call_name: string | null;
  affisso: string | null;
  breed_id: string | null;
  variety: string | null;
  sex: BreedingDogSex;
  date_of_birth: string | null;
  pedigree_number: string | null;
  microchip_number: string | null;
  color: string | null;
  titles: string[];
  health_screenings: Record<string, string>;
  dna_deposited: boolean;
  photo_url: string | null;
  gallery_urls: string[];
  is_external: boolean;
  external_kennel_name: string | null;
  notes: string | null;
  sort_order: number;
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
  litter_id: string | null;
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

export interface VetProfileRow {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  region: string | null;
  province: string | null;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email_public: string | null;
  website: string | null;
  whatsapp: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  gallery_urls: string[];
  albo_number: string | null;
  albo_region: string | null;
  albo_verified: boolean;
  university: string | null;
  graduation_year: number | null;
  years_experience: number | null;
  clinic_name: string | null;
  emergency_available: boolean;
  house_visits: boolean;
  languages: string[];
  specializations: string[];
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Enriched types (with joined fields, for app usage) ───

export interface BreederProfile extends BreederProfileRow {
  breeds?: Breed[];
  profile?: Profile;
}

export interface Litter extends LitterRow {
  mother?: BreedingDogRow;
  father?: BreedingDogRow;
  breed?: Breed;
  puppies?: PuppyRow[];
}

export interface Puppy extends PuppyRow {
  litter?: Litter;
}

export interface Review extends ReviewRow {
  author?: Profile;
}

export interface Conversation extends ConversationRow {
  other_participant?: Profile;
  last_message?: Message;
  litter?: Litter;
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
      litters: TableDef<LitterRow>;
      puppies: TableDef<PuppyRow>;
      reviews: TableDef<ReviewRow>;
      conversations: TableDef<ConversationRow>;
      messages: TableDef<MessageRow>;
      subscriptions: TableDef<Subscription>;
      vet_profiles: TableDef<VetProfileRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
