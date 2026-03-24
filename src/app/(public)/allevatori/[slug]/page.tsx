export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Shield,
  Crown,
  Calendar,
  MessageCircle,
  Heart,
  ExternalLink,
  ChevronLeft,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Rating from "@/components/ui/Rating";
import ReviewForm from "@/components/breeders/ReviewForm";
import ChatModal from "@/components/chat/ChatModal";
import { createClient } from "@/lib/supabase/server";
import { SITE_NAME } from "@/lib/constants";

interface BreederPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BreederPageProps): Promise<Metadata> {
  const { slug } = await params;
  // In production, fetch breeder from Supabase
  return {
    title: `Allevamento - ${slug} | ${SITE_NAME}`,
    description: `Scopri l'allevamento ${slug} su ${SITE_NAME}. Allevatore professionale di cani in Italia.`,
  };
}

export default async function BreederProfilePage({ params }: BreederPageProps) {
  const { slug } = await params;

  // Fetch real breeder from Supabase, fallback to demo data if not found
  const supabase = await createClient();
  const { data: supabaseBreeder } = await supabase
    .from("breeder_profiles")
    .select("*")
    .eq("slug", slug)
    .single();

  // Resolve breed UUIDs → names
  let resolvedBreedNames: string[] = [];
  if (supabaseBreeder?.breed_ids?.length) {
    const { data: breedRows } = await supabase
      .from("breeds")
      .select("id, name_it")
      .in("id", supabaseBreeder.breed_ids);
    if (breedRows) {
      resolvedBreedNames = supabaseBreeder.breed_ids
        .map((id: string) => breedRows.find((b) => b.id === id)?.name_it)
        .filter(Boolean) as string[];
    }
  }

  const breeder = supabaseBreeder ?? {
    id: null,
    kennel_name: "Allevamento Del Sole",
    slug,
    description:
      "Il nostro allevamento nasce dalla passione per i cani e dalla volonta di selezionare soggetti sani, equilibrati e aderenti allo standard di razza. Ogni cucciolo cresce in un ambiente familiare, con le migliori cure veterinarie e una socializzazione attenta fin dai primi giorni di vita. Siamo riconosciuti dall'ENCI e affiliati alla FCI.",
    region: "Lombardia",
    province: "Milano",
    city: "Monza",
    phone: "+39 02 1234567",
    email_public: "info@allevamentodelsole.it",
    website: "https://www.allevamentodelsole.it",
    whatsapp: "+39 333 1234567",
    facebook_url: "https://facebook.com",
    instagram_url: "https://instagram.com",
    enci_number: "MI-12345",
    enci_verified: true,
    fci_affiliated: true,
    year_established: 2005,
    breed_ids: ["Labrador Retriever", "Golden Retriever"],
    specializations: ["Compagnia", "Esposizione", "Pet Therapy"],
    certifications: [
      "Displasia dell'anca (HD)",
      "Displasia del gomito (ED)",
      "Test DNA",
      "Esame oculistico",
    ],
    is_premium: true,
    average_rating: 4.8,
    review_count: 24,
  };

  // Fetch real reviews from Supabase
  const { data: reviewRows } = supabaseBreeder
    ? await supabase
        .from("reviews")
        .select("id, rating, title, content, created_at, author:profiles(full_name)")
        .eq("breeder_id", supabaseBreeder.id)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
    : { data: [] };

  const reviews = (reviewRows ?? []) as Array<{
    id: string;
    rating: number;
    title: string | null;
    content: string | null;
    created_at: string;
    author: { full_name: string } | null;
  }>;

  const reviewCount = supabaseBreeder ? reviews.length : breeder.review_count;

  return (
    <div className="min-h-screen bg-muted">
      {/* Cover Image */}
      <div className="h-48 md:h-64 bg-gradient-to-br from-blue-600 to-blue-800 relative">
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent h-32" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="relative -mt-20 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Logo */}
            <div className="w-28 h-28 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-4xl shrink-0">
              🏠
            </div>

            <div className="flex-1 pt-2">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white md:text-foreground">
                  {breeder.kennel_name}
                </h1>
                {breeder.is_premium && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Premium
                  </Badge>
                )}
                {breeder.enci_verified && (
                  <Badge variant="primary" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    ENCI Verificato
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {breeder.city}, {breeder.province} ({breeder.region})
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Attivo dal {breeder.year_established}
                </span>
              </div>

              <Rating
                value={breeder.average_rating}
                showValue
                count={breeder.review_count}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 shrink-0">
              <Button size="lg">
                <MessageCircle className="h-4 w-4" />
                Contatta
              </Button>
              <Button variant="outline" size="lg">
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Chi Siamo</h2>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {breeder.description}
                </p>
              </CardContent>
            </Card>

            {/* Breeds */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Razze Allevate</h2>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {(supabaseBreeder ? resolvedBreedNames : (breeder.breed_ids ?? [])).map((breed) => (
                    <div
                      key={breed}
                      className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                    >
                      <span className="text-2xl">🐕</span>
                      <span className="font-medium">{breed}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Health Certifications */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">
                  Certificazioni Sanitarie
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {breeder.certifications.map((cert) => (
                    <div
                      key={cert}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      {cert}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Recensioni ({reviewCount})
                  </h2>
                  <ReviewForm breederId={breeder.id ?? ""} breederName={breeder.kennel_name} />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nessuna recensione ancora. Sii il primo a recensire questo allevatore!
                  </p>
                ) : (
                  reviews.map((review) => {
                    const authorName = review.author?.full_name ?? "Utente";
                    const date = new Date(review.created_at).toLocaleDateString("it-IT", {
                      day: "numeric", month: "long", year: "numeric",
                    });
                    return (
                      <div
                        key={review.id}
                        className="border-b border-border last:border-0 pb-6 last:pb-0"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-sm font-semibold text-primary-dark">
                              {authorName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{authorName}</p>
                              <p className="text-xs text-muted-foreground">{date}</p>
                            </div>
                          </div>
                          <Rating value={review.rating} size="sm" />
                        </div>
                        {review.title && (
                          <p className="font-medium text-sm mb-1">{review.title}</p>
                        )}
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {review.content}
                        </p>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Contatti</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                {breeder.phone && (
                  <a
                    href={`tel:${breeder.phone}`}
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Phone className="h-4 w-4 shrink-0" />
                    {breeder.phone}
                  </a>
                )}
                {breeder.email_public && (
                  <a
                    href={`mailto:${breeder.email_public}`}
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    {breeder.email_public}
                  </a>
                )}
                {breeder.website && (
                  <a
                    href={breeder.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Globe className="h-4 w-4 shrink-0" />
                    Sito Web
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {supabaseBreeder?.user_id && (
                  <div className="pt-3 border-t border-border">
                    <ChatModal
                      breederUserId={supabaseBreeder.user_id}
                      breederName={breeder.kennel_name}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Dettagli</h2>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ENCI</span>
                  <span className="font-medium">
                    {breeder.enci_number || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">FCI</span>
                  <span className="font-medium">
                    {breeder.fci_affiliated ? "Affiliato" : "Non affiliato"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Attivo dal</span>
                  <span className="font-medium">
                    {breeder.year_established}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Specializations */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Specializzazioni</h2>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {breeder.specializations.map((spec) => (
                    <Badge key={spec} variant="outline">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
