import { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import Card, { CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { SITE_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import BreederFilters from "./BreederFilters";
import SearchForm from "@/components/search/SearchForm";

export const metadata: Metadata = {
  title: "Trova Allevatori di Cani",
  description:
    "Cerca allevatori di cani professionali in Italia. Filtra per razza, regione e certificazioni ENCI.",
};

export default async function AllevatoriPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; province?: string; breed?: string; q?: string; sort?: string; enci?: string; fci?: string; size?: string; rating?: string; availability?: string; pedigree?: string; health?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("breeder_profiles")
    .select("*", { count: "exact" })
    .eq("is_approved", true);

  if (params.region) query = query.eq("region", params.region);
  if (params.province) query = query.eq("province", params.province);
  if (params.breed) query = query.contains("breed_ids", [params.breed]);

  // Cerca per nome allevamento OPPURE per razza (due query separate + merge ID)
  if (params.q) {
    const [{ data: byName }, { data: matchingBreeds }] = await Promise.all([
      supabase.from("breeder_profiles").select("id").eq("is_approved", true).ilike("kennel_name", `%${params.q}%`),
      supabase.from("breeds").select("id").ilike("name_it", `%${params.q}%`),
    ]);
    const breedIds = (matchingBreeds ?? []).map((b) => b.id);
    const byBreedData = breedIds.length > 0
      ? (await supabase.from("breeder_profiles").select("id").eq("is_approved", true).overlaps("breed_ids", breedIds)).data
      : [];
    const allIds = [...new Set([...(byName ?? []).map((b) => b.id), ...(byBreedData ?? []).map((b) => b.id)])];
    query = allIds.length > 0
      ? query.in("id", allIds)
      : query.in("id", ["00000000-0000-0000-0000-000000000000"]);
  }
  if (params.enci === "true") query = query.eq("enci_verified", true);
  if (params.fci === "true") query = query.eq("fci_affiliated", true);
  if (params.rating) query = query.gte("average_rating", Number(params.rating));

  // Filtro pedigree e health (mappati su certifications)
  if (params.pedigree === "true") query = query.contains("certifications", ["Pedigree ENCI"]);
  if (params.health === "true") query = query.not("certifications", "eq", "{}");

  // Filtro disponibilità: cerca breeders con listings attivi
  let breederIdsWithListings: string[] | null = null;
  if (params.availability) {
    const statusMap: Record<string, string> = { now: "attivo", expected: "bozza", waitlist: "scaduto" };
    const listingStatus = statusMap[params.availability];
    if (listingStatus) {
      const { data: listingRows } = await supabase
        .from("listings")
        .select("breeder_id")
        .eq("status", listingStatus);
      breederIdsWithListings = [...new Set((listingRows ?? []).map((l) => l.breeder_id))];
      if (breederIdsWithListings.length > 0) {
        query = query.in("id", breederIdsWithListings);
      } else {
        // Nessun allevatore con questa disponibilità
        query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
      }
    }
  }

  // Filtro taglia: prima recupera gli ID delle razze con quella taglia
  if (params.size) {
    const { data: sizeBreeds } = await supabase
      .from("breeds")
      .select("id")
      .eq("size_category", params.size);
    if (sizeBreeds && sizeBreeds.length > 0) {
      query = query.overlaps("breed_ids", sizeBreeds.map((b) => b.id));
    }
  }

  if (params.sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else if (params.sort === "reviews") {
    query = query.order("review_count", { ascending: false });
  } else {
    query = query.order("average_rating", { ascending: false });
  }

  query = query.order("is_premium", { ascending: false });

  const { data: breeders, count } = await query;

  // Risolvi breed_ids → nomi razze in una query sola
  const allBreedIds = [...new Set((breeders ?? []).flatMap((b) => b.breed_ids ?? []))];
  const breedMap: Record<string, string> = {};
  if (allBreedIds.length > 0) {
    const { data: breedRows } = await supabase
      .from("breeds")
      .select("id, name_it")
      .in("id", allBreedIds);
    (breedRows ?? []).forEach((b) => { breedMap[b.id] = b.name_it; });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <section className="bg-background border-b border-border pt-14 pb-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-secondary text-sm font-medium uppercase tracking-widest mb-3">Directory</p>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
            Trova il tuo allevatore
          </h1>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            {count ? `${count} allevator${count === 1 ? "e" : "i"} verificat${count === 1 ? "o" : "i"}` : "Allevatori verificati"} in tutta Italia
          </p>
          <SearchForm
            initialQ={params.q ?? ""}
            showRegion={false}
            preserveParams={{
              ...(params.region ? { region: params.region } : {}),
              ...(params.province ? { province: params.province } : {}),
              ...(params.size ? { size: params.size } : {}),
              ...(params.enci ? { enci: params.enci } : {}),
              ...(params.fci ? { fci: params.fci } : {}),
              ...(params.rating ? { rating: params.rating } : {}),
              ...(params.availability ? { availability: params.availability } : {}),
              ...(params.sort ? { sort: params.sort } : {}),
            }}
          />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 shrink-0">
            <BreederFilters />
          </aside>

          {/* Results */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                {count && count > 0
                  ? `${count} allevator${count === 1 ? "e" : "i"} trovat${count === 1 ? "o" : "i"}`
                  : "Nessun allevatore trovato"}
              </p>
              <form method="GET" className="flex items-center gap-2">
                {params.q && <input type="hidden" name="q" value={params.q} />}
                {params.region && <input type="hidden" name="region" value={params.region} />}
                {params.province && <input type="hidden" name="province" value={params.province} />}
                {params.size && <input type="hidden" name="size" value={params.size} />}
                {params.enci && <input type="hidden" name="enci" value={params.enci} />}
                {params.fci && <input type="hidden" name="fci" value={params.fci} />}
                {params.rating && <input type="hidden" name="rating" value={params.rating} />}
                <select
                  name="sort"
                  defaultValue={params.sort ?? "rating"}
                  className="text-sm border border-border rounded-lg px-3 py-1.5 bg-white"
                >
                  <option value="rating">Piu rilevanti</option>
                  <option value="reviews">Piu recensioni</option>
                  <option value="newest">Piu recenti</option>
                </select>
                <button type="submit" className="text-sm px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90">
                  Ordina
                </button>
              </form>
            </div>

            {!breeders || breeders.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <span className="text-5xl block mb-4">🐕</span>
                <p className="text-lg font-medium">Nessun allevatore trovato</p>
                <p className="text-sm mt-2">Prova a modificare i filtri o la ricerca.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {breeders.map((breeder) => (
                  <Link key={breeder.id} href={`/allevatori/${breeder.slug}`}>
                    <Card hover className="cursor-pointer">
                      <div className="h-36 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center relative overflow-hidden">
                        {breeder.cover_image_url ? (
                          <img src={breeder.cover_image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-4xl">🐕</span>
                        )}
                      </div>
                      <CardContent className="space-y-2 relative z-10">
                        <div className="flex items-start gap-3 -mt-8 relative">
                          <div className="w-14 h-14 rounded-xl bg-white border-2 border-white shadow-md flex items-center justify-center shrink-0 overflow-hidden">
                            {breeder.logo_url ? (
                              <img src={breeder.logo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl">🏠</span>
                            )}
                          </div>
                          <div className="pt-8">
                            <h3 className="font-semibold">{breeder.kennel_name}</h3>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5" />
                              {[breeder.city, breeder.region].filter(Boolean).join(", ")}
                            </div>
                          </div>
                        </div>
                        {breeder.breed_ids && breeder.breed_ids.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {(breeder.breed_ids as string[]).slice(0, 3).map((id: string) => (
                              <Badge key={id} variant="outline">
                                {breedMap[id] ?? id}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
