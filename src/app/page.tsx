import Link from "next/link";
import { Search, Shield, Star, MapPin, ArrowRight, Award } from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { SITE_NAME } from "@/lib/constants";
import { razze } from "@/data/razze";
import { regioni } from "@/data/regioni";

const italianBreeds = razze.filter((r) => r.is_italian_breed);
const popularBreeds = razze.filter((r) => r.is_popular).slice(0, 12);
const featuredRegions = regioni.filter((r) =>
  ["lombardia", "lazio", "toscana", "veneto", "piemonte", "campania"].includes(r.slug)
);

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Trova il tuo allevatore di fiducia in Italia
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl">
              La directory italiana degli allevatori professionali certificati.
              Cerca per razza, regione e trova il cucciolo perfetto per la tua
              famiglia.
            </p>

            {/* Search Bar */}
            <div className="bg-white rounded-xl p-2 flex flex-col sm:flex-row gap-2 max-w-2xl shadow-xl">
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cerca per razza, allevatore..."
                  className="w-full py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  suppressHydrationWarning
                />
              </div>
              <div className="flex items-center gap-2 px-3 border-t sm:border-t-0 sm:border-l border-gray-200">
                <MapPin className="h-5 w-5 text-gray-400" />
                <select className="py-2 text-gray-900 bg-transparent focus:outline-none">
                  <option value="">Tutta Italia</option>
                  {regioni.map((r) => (
                    <option key={r.slug} value={r.slug}>
                      {r.nome}
                    </option>
                  ))}
                </select>
              </div>
              <Link href="/allevatori">
                <Button size="lg" className="w-full sm:w-auto whitespace-nowrap">
                  Cerca
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-10 text-blue-100">
              <div>
                <div className="text-3xl font-bold text-white">500+</div>
                <div className="text-sm">Allevatori registrati</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">50+</div>
                <div className="text-sm">Razze disponibili</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">20</div>
                <div className="text-sm">Regioni coperte</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-light rounded-xl mb-4">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Allevatori Verificati
              </h3>
              <p className="text-muted-foreground text-sm">
                Tutti gli allevatori sono verificati e certificati ENCI per
                garantire la massima affidabilita.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-xl mb-4">
                <Star className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Recensioni Reali
              </h3>
              <p className="text-muted-foreground text-sm">
                Leggi le esperienze di altri acquirenti e scegli con
                consapevolezza il tuo allevatore.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 rounded-xl mb-4">
                <Award className="h-7 w-7 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Razze Italiane
              </h3>
              <p className="text-muted-foreground text-sm">
                Scopri le prestigiose razze italiane dai migliori allevatori
                specializzati del paese.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Breeds */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">
                Razze Popolari
              </h2>
              <p className="text-muted-foreground mt-1">
                Le razze piu cercate dagli italiani
              </p>
            </div>
            <Link href="/razze">
              <Button variant="outline" size="sm">
                Tutte le razze
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {popularBreeds.map((breed) => (
              <Link key={breed.slug} href={`/razze/${breed.slug}`}>
                <Card hover className="text-center p-4">
                  <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-3 flex items-center justify-center text-2xl">
                    {breed.is_italian_breed ? "🇮🇹" : "🐕"}
                  </div>
                  <h3 className="text-sm font-medium text-foreground leading-tight">
                    {breed.name_it}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {breed.size_category === "piccola"
                      ? "Piccola"
                      : breed.size_category === "media"
                      ? "Media"
                      : breed.size_category === "grande"
                      ? "Grande"
                      : "Gigante"}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Italian Breeds Highlight */}
      <section className="py-16 bg-gradient-to-r from-green-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <span className="text-3xl">🇮🇹</span>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">
                Razze Italiane
              </h2>
              <p className="text-muted-foreground mt-1">
                Le orgogliose razze nate nel Bel Paese
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {italianBreeds.map((breed) => (
              <Link key={breed.slug} href={`/razze/${breed.slug}`}>
                <Card hover>
                  <CardContent className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center shrink-0 text-xl">
                      🇮🇹
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {breed.name_it}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="success">{breed.group_name_it}</Badge>
                        <span className="text-xs text-muted-foreground">
                          Gruppo FCI {breed.group_fci}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by Region */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">
                Cerca per Regione
              </h2>
              <p className="text-muted-foreground mt-1">
                Trova allevatori vicino a te
              </p>
            </div>
            <Link href="/regioni">
              <Button variant="outline" size="sm">
                Tutte le regioni
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredRegions.map((region) => (
              <Link key={region.slug} href={`/regioni/${region.slug}`}>
                <Card hover className="text-center p-6">
                  <div className="flex items-center justify-center mb-2">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground text-sm">
                    {region.nome}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {region.province.length} province
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA for Breeders */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Sei un allevatore?
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Registra il tuo allevamento su {SITE_NAME} e raggiungi migliaia di
            famiglie italiane in cerca del cucciolo perfetto.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/registrati">
              <Button size="lg" variant="secondary">
                Registrati Gratis
              </Button>
            </Link>
            <Link href="/chi-siamo">
              <Button size="lg" variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
                Scopri di piu
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
