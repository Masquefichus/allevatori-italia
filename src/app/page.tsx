import Link from "next/link";
import Image from "next/image";
import { Search, ArrowRight, CheckCircle, MapPin } from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardContent } from "@/components/ui/Card";
import HomeAuthCTA from "@/components/layout/HomeAuthCTA";
import SearchForm from "@/components/search/SearchForm";
import { SITE_NAME } from "@/lib/constants";
import razzeEnriched from "@/data/razze-enriched.json";
import type { RazzaEnricched } from "@/data/razze-types";
import { createClient } from "@/lib/supabase/server";

const razze = razzeEnriched as RazzaEnricched[];
const popularBreeds = razze.filter((r) => r.is_popular).slice(0, 8);

export default async function HomePage() {
  const supabase = await createClient();
  const { data: featuredBreeders } = await supabase
    .from("breeder_profiles")
    .select("id, kennel_name, slug, region, city, logo_url, cover_image_url, enci_verified, average_rating, review_count, is_premium")
    .eq("is_approved", true)
    .order("is_premium", { ascending: false })
    .order("average_rating", { ascending: false })
    .limit(6);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-background pt-20 pb-16 md:pt-28 md:pb-20 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-secondary text-sm font-medium uppercase tracking-widest mb-4">La directory italiana</p>
          <h1 className="font-serif text-5xl md:text-7xl text-foreground leading-tight mb-6">
            Il tuo cane merita un allevatore vero
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Connettiti con allevatori certificati ENCI, razze riconosciute FCI e inizia questo capitolo con fiducia — non con un annuncio anonimo.
          </p>

          {/* Search */}
          <SearchForm />

          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">359 razze riconosciute FCI</span> · tutti gli allevatori sono verificati prima di apparire.
          </p>

          <HomeAuthCTA />
        </div>
      </section>

      {/* ── Featured breeders ───────────────────────────────────────────── */}
      {featuredBreeders && featuredBreeders.length > 0 && (
        <section className="py-20 bg-muted/40 border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
              <div>
                <p className="text-secondary text-sm font-medium uppercase tracking-widest mb-3">Allevatori</p>
                <h2 className="font-serif text-4xl md:text-5xl text-foreground">
                  Allevatori verificati
                </h2>
                <p className="text-muted-foreground mt-3 max-w-xl">
                  Ogni profilo è stato esaminato dal nostro team prima di essere pubblicato.
                </p>
              </div>
              <Link href="/allevatori">
                <Button variant="outline" size="sm">
                  Vedi tutti <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBreeders.map((breeder) => (
                <Link key={breeder.id} href={`/allevatori/${breeder.slug}`}>
                  <Card hover className="group overflow-hidden h-full">
                    <div className="h-36 bg-muted relative overflow-hidden">
                      {breeder.cover_image_url ? (
                        <img src={breeder.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🐕</div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 -mt-8 mb-3">
                        <div className="w-14 h-14 rounded-xl bg-white border-2 border-white shadow-md flex items-center justify-center shrink-0 overflow-hidden">
                          {breeder.logo_url
                            ? <img src={breeder.logo_url} alt="" className="w-full h-full object-cover" />
                            : <span className="text-xl">🏠</span>}
                        </div>
                        <div className="pt-8 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{breeder.kennel_name}</h3>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {[breeder.city, breeder.region].filter(Boolean).join(", ")}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Browse breeds ────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-secondary text-sm font-medium uppercase tracking-widest mb-3">Razze</p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
              Scopri le razze
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Caratteristiche, storia e dati fisici di ogni razza. Trova l'allevatore specializzato direttamente dalla scheda.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 mb-10">
            {popularBreeds.map((breed) => (
              <Link key={breed.slug} href={`/razze/${breed.slug}`}>
                <Card hover className="group overflow-hidden">
                  <div className="aspect-square bg-muted overflow-hidden">
                    {(breed as RazzaEnricched & { photo_url?: string }).photo_url ? (
                      <Image
                        src={(breed as RazzaEnricched & { photo_url?: string }).photo_url!}
                        alt={breed.name_it}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">
                        {breed.is_italian_breed ? "🇮🇹" : "🐕"}
                      </div>
                    )}
                  </div>
                  <CardContent className="py-3 px-4">
                    <h3 className="font-medium text-sm text-foreground">{breed.name_it}</h3>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">{breed.size_category}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link href="/razze">
              <Button variant="outline" size="lg">
                Tutte le 359 razze <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Split CTA: breeders + buyers ─────────────────────────────────── */}
      <section className="py-0">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="bg-foreground text-white px-10 py-20 md:px-16 flex flex-col justify-center">
            <CheckCircle className="h-10 w-10 text-white/30 mb-6" />
            <h2 className="font-serif text-3xl md:text-4xl font-normal mb-4">
              Sei un allevatore responsabile?
            </h2>
            <p className="text-white/60 leading-relaxed mb-8 max-w-md">
              Unisciti alla nostra rete. Connettiti con famiglie serie e ricevi il supporto per concentrarti su ciò che conta.
            </p>
            <div>
              <Link href="/per-allevatori">
                <Button size="lg" className="bg-white text-foreground hover:bg-white/90 shadow-none">
                  Scopri di più <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="bg-secondary text-white px-10 py-20 md:px-16 flex flex-col justify-center">
            <Search className="h-10 w-10 text-white/30 mb-6" />
            <h2 className="font-serif text-3xl md:text-4xl font-normal mb-4">
              Stai cercando il tuo cane?
            </h2>
            <p className="text-white/60 leading-relaxed mb-8 max-w-md">
              Allevatori verificati, recensioni reali, razze certificate. Scegli con consapevolezza.
            </p>
            <div>
              <Link href="/allevatori">
                <Button size="lg" className="bg-white text-secondary hover:bg-white/90 shadow-none">
                  Trova un allevatore <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tagline close ────────────────────────────────────────────────── */}
      <section className="py-16 bg-background border-t border-border text-center">
        <p className="font-serif text-2xl md:text-3xl text-foreground">
          La vita è più bella con un cane ben allevato.
        </p>
      </section>
    </>
  );
}
