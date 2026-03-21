import { Metadata } from "next";
import { Search, SlidersHorizontal, MapPin } from "lucide-react";
import Card, { CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { regioni } from "@/data/regioni";
import { razze } from "@/data/razze";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Trova Allevatori di Cani",
  description:
    "Cerca allevatori di cani professionali in Italia. Filtra per razza, regione e certificazioni ENCI.",
};

export default function AllevatoriPage() {
  return (
    <div className="min-h-screen bg-muted">
      {/* Search Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">
            Trova Allevatori di Cani in Italia
          </h1>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cerca per nome allevamento o razza..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            <select className="px-4 py-2.5 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Tutte le regioni</option>
              {regioni.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.nome}
                </option>
              ))}
            </select>
            <select className="px-4 py-2.5 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Tutte le razze</option>
              {razze.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.name_it}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 shrink-0">
            <Card>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtri
                  </h3>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Certificazioni</h4>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    Verificato ENCI
                  </label>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer mt-2">
                    <input type="checkbox" className="rounded" />
                    Affiliato FCI
                  </label>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Taglia</h4>
                  {["Piccola", "Media", "Grande", "Gigante"].map((size) => (
                    <label
                      key={size}
                      className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer mt-1"
                    >
                      <input type="checkbox" className="rounded" />
                      {size}
                    </label>
                  ))}
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Disponibilita</h4>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    Con cuccioli disponibili
                  </label>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Valutazione</h4>
                  {[4, 3, 2].map((stars) => (
                    <label
                      key={stars}
                      className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer mt-1"
                    >
                      <input type="radio" name="rating" className="rounded" />
                      {stars}+ stelle
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Results */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                Connetti Supabase per visualizzare gli allevatori registrati
              </p>
              <select className="text-sm border border-border rounded-lg px-3 py-1.5 bg-white">
                <option>Piu rilevanti</option>
                <option>Valutazione</option>
                <option>Piu recenti</option>
                <option>Nome A-Z</option>
              </select>
            </div>

            {/* Placeholder cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  name: "Allevamento Del Sole",
                  location: "Milano, Lombardia",
                  breeds: ["Labrador Retriever", "Golden Retriever"],
                  rating: 4.8,
                  reviews: 24,
                  enci: true,
                  premium: true,
                  year: 2005,
                },
                {
                  name: "Casa dei Molossi",
                  location: "Roma, Lazio",
                  breeds: ["Cane Corso", "Mastino Napoletano"],
                  rating: 4.6,
                  reviews: 18,
                  enci: true,
                  premium: false,
                  year: 2010,
                },
                {
                  name: "Lagotto dei Colli",
                  location: "Bologna, Emilia-Romagna",
                  breeds: ["Lagotto Romagnolo"],
                  rating: 4.9,
                  reviews: 31,
                  enci: true,
                  premium: true,
                  year: 1998,
                },
                {
                  name: "Allevamento Toscano",
                  location: "Firenze, Toscana",
                  breeds: ["Bracco Italiano", "Spinone Italiano"],
                  rating: 4.5,
                  reviews: 12,
                  enci: true,
                  premium: false,
                  year: 2012,
                },
                {
                  name: "Pastori del Nord",
                  location: "Torino, Piemonte",
                  breeds: ["Pastore Tedesco", "Pastore Belga Malinois"],
                  rating: 4.7,
                  reviews: 42,
                  enci: true,
                  premium: true,
                  year: 2001,
                },
                {
                  name: "Piccoli Amici",
                  location: "Napoli, Campania",
                  breeds: ["Chihuahua", "Maltese", "Bolognese"],
                  rating: 4.4,
                  reviews: 15,
                  enci: false,
                  premium: false,
                  year: 2015,
                },
              ].map((breeder) => (
                <Card key={breeder.name} hover className="cursor-pointer">
                  <div className="h-36 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center relative">
                    <span className="text-4xl">🐕</span>
                    {breeder.premium && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="secondary">Premium</Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="space-y-2">
                    <h3 className="font-semibold">{breeder.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {breeder.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${
                              i < Math.floor(breeder.rating)
                                ? "text-yellow-400"
                                : "text-gray-200"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-sm font-medium">{breeder.rating}</span>
                      <span className="text-sm text-muted-foreground">
                        ({breeder.reviews})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {breeder.breeds.map((breed) => (
                        <Badge key={breed} variant="outline">
                          {breed}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {breeder.enci && (
                        <Badge variant="primary">ENCI</Badge>
                      )}
                      <span>Dal {breeder.year}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
