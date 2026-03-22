import { Metadata } from "next";
import Link from "next/link";
import { Search, SlidersHorizontal, MapPin } from "lucide-react";
import Card, { CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { regioni } from "@/data/regioni";
import { razze } from "@/data/razze";
import { SITE_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Trova Allevatori di Cani",
  description:
    "Cerca allevatori di cani professionali in Italia. Filtra per razza, regione e certificazioni ENCI.",
};

export default async function AllevatoriPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; breed?: string; q?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("breeder_profiles")
    .select("*", { count: "exact" })
    .eq("is_approved", true);

  if (params.region) query = query.eq("region", params.region);
  if (params.breed) query = query.contains("breed_ids", [params.breed]);
  if (params.q) query = query.ilike("kennel_name", `%${params.q}%`);

  if (params.sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else if (params.sort === "reviews") {
    query = query.order("review_count", { ascending: false });
  } else {
    query = query.order("average_rating", { ascending: false });
  }

  query = query.order("is_premium", { ascending: false });

  const { data: breeders, count } = await query;

  return (
    <div className="min-h-screen bg-muted">
      {/* Search Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">
            Trova Allevatori di Cani in Italia
          </h1>
          <form method="GET" className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Cerca per nome allevamento o razza..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            <select
              name="region"
              defaultValue={params.region ?? ""}
              className="px-4 py-2.5 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Tutte le regioni</option>
              {regioni.map((r) => (
                <option key={r.slug} value={r.nome}>
                  {r.nome}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
            >
              Cerca
            </button>
          </form>
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
                {count && count > 0
                  ? `${count} allevator${count === 1 ? "e" : "i"} trovat${count === 1 ? "o" : "i"}`
                  : "Nessun allevatore trovato"}
              </p>
              <form method="GET">
                {params.q && <input type="hidden" name="q" value={params.q} />}
                {params.region && <input type="hidden" name="region" value={params.region} />}
                <select
                  name="sort"
                  defaultValue={params.sort ?? "rating"}
                  onChange={(e) => (e.currentTarget.form as HTMLFormElement)?.submit()}
                  className="text-sm border border-border rounded-lg px-3 py-1.5 bg-white"
                >
                  <option value="rating">Piu rilevanti</option>
                  <option value="reviews">Piu recensioni</option>
                  <option value="newest">Piu recenti</option>
                </select>
              </form>
            </div>

            {!breeders || breeders.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <span className="text-5xl block mb-4">🐕</span>
                <p className="text-lg font-medium">Nessun allevatore ancora registrato</p>
                <p className="text-sm mt-2">
                  Sei un allevatore?{" "}
                  <Link href="/registrati" className="text-primary underline">
                    Registrati ora
                  </Link>{" "}
                  e crea il tuo profilo.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {breeders.map((breeder) => (
                  <Link key={breeder.id} href={`/allevatori/${breeder.slug}`}>
                    <Card hover className="cursor-pointer">
                      <div className="h-36 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center relative">
                        <span className="text-4xl">🐕</span>
                        {breeder.is_premium && (
                          <div className="absolute top-3 right-3">
                            <Badge variant="secondary">Premium</Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="space-y-2">
                        <h3 className="font-semibold">{breeder.kennel_name}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {[breeder.city, breeder.region].filter(Boolean).join(", ")}
                        </div>
                        {breeder.average_rating > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="flex">
                              {Array.from({ length: 5 }, (_, i) => (
                                <span
                                  key={i}
                                  className={`text-sm ${
                                    i < Math.floor(breeder.average_rating)
                                      ? "text-yellow-400"
                                      : "text-gray-200"
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="text-sm font-medium">
                              {breeder.average_rating?.toFixed(1)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              ({breeder.review_count ?? 0})
                            </span>
                          </div>
                        )}
                        {breeder.breed_ids && breeder.breed_ids.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {(breeder.breed_ids as string[]).slice(0, 3).map((breed: string) => (
                              <Badge key={breed} variant="outline">
                                {breed}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {breeder.enci_verified && <Badge variant="primary">ENCI</Badge>}
                          {breeder.year_established && (
                            <span>Dal {breeder.year_established}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
