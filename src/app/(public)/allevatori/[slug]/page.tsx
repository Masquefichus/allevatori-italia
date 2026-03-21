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

  // Demo data - in production, fetch from Supabase
  const breeder = {
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
    breeds: ["Labrador Retriever", "Golden Retriever"],
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

  const reviews = [
    {
      id: "1",
      author: "Marco R.",
      rating: 5,
      date: "15 Febbraio 2026",
      content:
        "Esperienza fantastica! Il nostro Labrador e arrivato sano, vaccinato e gia socializzato. L'allevatore ci ha seguito anche dopo l'acquisto con consigli preziosi.",
    },
    {
      id: "2",
      author: "Giulia M.",
      rating: 5,
      date: "3 Gennaio 2026",
      content:
        "Allevamento serio e professionale. I cani sono tenuti benissimo e si vede l'amore che mettono nel loro lavoro. Consigliatissimo!",
    },
    {
      id: "3",
      author: "Luca P.",
      rating: 4,
      date: "20 Dicembre 2025",
      content:
        "Ottima esperienza complessiva. Cucciolo bellissimo con tutti i documenti in regola. Unica nota: tempi di attesa un po' lunghi, ma ne e valsa la pena.",
    },
  ];

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
                  {breeder.breeds.map((breed) => (
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
                    Recensioni ({breeder.review_count})
                  </h2>
                  <Button variant="outline" size="sm">
                    Scrivi una recensione
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b border-border last:border-0 pb-6 last:pb-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-sm font-semibold text-primary-dark">
                          {review.author.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{review.author}</p>
                          <p className="text-xs text-muted-foreground">
                            {review.date}
                          </p>
                        </div>
                      </div>
                      <Rating value={review.rating} size="sm" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {review.content}
                    </p>
                  </div>
                ))}
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
                <div className="pt-3 border-t border-border">
                  <Button className="w-full" size="lg">
                    <MessageCircle className="h-4 w-4" />
                    Invia Messaggio
                  </Button>
                </div>
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
