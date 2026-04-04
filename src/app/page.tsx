import Link from "next/link";
import Image from "next/image";
import { Search, MapPin, ArrowRight, CheckCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardContent } from "@/components/ui/Card";
import { SITE_NAME } from "@/lib/constants";
import { regioni } from "@/data/regioni";
import razzeEnriched from "@/data/razze-enriched.json";
import type { RazzaEnricched } from "@/data/razze-types";

const razze = razzeEnriched as RazzaEnricched[];
const popularBreeds = razze.filter((r) => r.is_popular).slice(0, 8);
const italianBreeds = razze.filter((r) => r.is_italian_breed).slice(0, 6);

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-background pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-serif text-5xl md:text-7xl text-foreground leading-tight mb-5">
            Un modo migliore per trovare il tuo cane
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Connetti con allevatori certificati, razze riconosciute FCI e inizia
            questo capitolo con fiducia.
          </p>

          {/* Search */}
          <div className="bg-white rounded-2xl p-2 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto shadow-md border border-border mb-8">
            <div className="flex-1 flex items-center gap-2 px-4">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Cerca per razza..."
                className="w-full py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none bg-transparent text-sm"
              />
            </div>
            <div className="flex items-center gap-2 px-4 border-t sm:border-t-0 sm:border-l border-border">
              <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
              <select className="py-2.5 text-foreground bg-transparent focus:outline-none text-sm w-full">
                <option value="">Tutta Italia</option>
                {regioni.map((r) => (
                  <option key={r.slug} value={r.slug}>{r.nome}</option>
                ))}
              </select>
            </div>
            <Link href="/allevatori">
              <Button size="lg" className="w-full sm:w-auto whitespace-nowrap">
                Cerca
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">359 razze riconosciute FCI</span> — tutti gli allevatori sono verificati prima di apparire sulla piattaforma.
          </p>
        </div>
      </section>

      {/* ── Value prop strip ─────────────────────────────────────────────── */}
      <section className="border-y border-border bg-white py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg text-muted-foreground leading-relaxed">
            Uniamo{" "}
            <span className="text-foreground font-medium">allevatori certificati ENCI</span>,{" "}
            <span className="text-foreground font-medium">razze verificate FCI</span> e{" "}
            <span className="text-foreground font-medium">famiglie italiane</span> in un
            unico posto — così trovare il tuo cane è più sicuro e semplice.
          </p>
        </div>
      </section>

      {/* ── Browse breeds ────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-secondary text-sm font-medium uppercase tracking-widest mb-3">Esplora</p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
              Scopri le razze
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Approfondisci caratteristiche, storia e dati fisici di ogni razza.
              Trova allevatori specializzati direttamente dalla scheda razza.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 mb-10">
            {popularBreeds.map((breed) => (
              <Link key={breed.slug} href={`/razze/${breed.slug}`}>
                <Card hover className="group overflow-hidden">
                  <div className="aspect-square bg-muted overflow-hidden">
                    {breed.photo_url ? (
                      <Image
                        src={breed.photo_url}
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
                Tutte le 359 razze
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Italian breeds spotlight ─────────────────────────────────────── */}
      <section className="py-20 bg-muted/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <p className="text-secondary text-sm font-medium uppercase tracking-widest mb-3">Patrimonio</p>
              <h2 className="font-serif text-4xl md:text-5xl text-foreground">
                Razze Italiane 🇮🇹
              </h2>
            </div>
            <Link href="/razze">
              <Button variant="outline" size="sm">
                Tutte le razze italiane <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {italianBreeds.map((breed) => (
              <Link key={breed.slug} href={`/razze/${breed.slug}`}>
                <Card hover className="group overflow-hidden">
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
                      {breed.photo_url ? (
                        <Image
                          src={breed.photo_url}
                          alt={breed.name_it}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🇮🇹</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-foreground">{breed.name_it}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{breed.group_name_it}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0 group-hover:text-primary transition-colors" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Split CTA: breeders + buyers ─────────────────────────────────── */}
      <section className="py-0">
        <div className="grid grid-cols-1 md:grid-cols-2">

          {/* Breeders */}
          <div className="bg-primary text-white px-10 py-20 md:px-16 flex flex-col justify-center">
            <CheckCircle className="h-10 w-10 text-white/40 mb-6" />
            <h2 className="font-serif text-3xl md:text-4xl font-normal mb-4">
              Sei un allevatore responsabile?
            </h2>
            <p className="text-white/70 leading-relaxed mb-8 max-w-md">
              Unisciti alla nostra rete di allevatori certificati. Connettiti con
              famiglie che cercano cani allevati con cura e ricevi il supporto per
              concentrarti su ciò che conta davvero.
            </p>
            <div>
              <Link href="/per-allevatori">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-none">
                  Scopri di più
                </Button>
              </Link>
            </div>
          </div>

          {/* Buyers */}
          <div className="bg-secondary text-white px-10 py-20 md:px-16 flex flex-col justify-center">
            <Search className="h-10 w-10 text-white/40 mb-6" />
            <h2 className="font-serif text-3xl md:text-4xl font-normal mb-4">
              Stai cercando il tuo cane?
            </h2>
            <p className="text-white/70 leading-relaxed mb-8 max-w-md">
              Trova allevatori di fiducia verificati da {SITE_NAME}. Consulta le
              recensioni di altre famiglie, scopri le razze e scegli con
              consapevolezza.
            </p>
            <div>
              <Link href="/allevatori">
                <Button size="lg" className="bg-white text-secondary hover:bg-white/90 shadow-none">
                  Trova un allevatore
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── Tagline close ────────────────────────────────────────────────── */}
      <section className="py-16 bg-background border-t border-border text-center">
        <p className="font-serif text-2xl md:text-3xl text-foreground">
          La vita è più bella con un cane.
        </p>
      </section>
    </>
  );
}
