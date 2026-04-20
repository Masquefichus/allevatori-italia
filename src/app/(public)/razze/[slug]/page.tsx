import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin, ExternalLink, Info } from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SITE_NAME } from "@/lib/constants";
import razzeEnriched from "@/data/razze-enriched.json";
import type { RazzaEnricched } from "@/data/razze-types";
import SaveBreedButton from "@/components/breeds/SaveBreedButton";

const razze = razzeEnriched as RazzaEnricched[];

interface BreedPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BreedPageProps): Promise<Metadata> {
  const { slug } = await params;
  const breed = razze.find((r) => r.slug === slug);
  if (!breed) return { title: "Razza non trovata" };
  return {
    title: `Allevatori di ${breed.name_it} in Italia | ${SITE_NAME}`,
    description:
      breed.description_it?.slice(0, 155) ??
      `Trova allevatori professionali di ${breed.name_it} in Italia. Cuccioli disponibili con pedigree e certificazioni sanitarie.`,
  };
}

export default async function BreedDetailPage({ params }: BreedPageProps) {
  const { slug } = await params;
  const breed = razze.find((r) => r.slug === slug);
  if (!breed) notFound();

  // Fetch real breeders for this breed from Supabase
  const supabase = await createClient();
  const { data: breedRow } = await supabase
    .from("breeds")
    .select("id")
    .ilike("name_it", breed.name_it)
    .single();

  const { data: breeders } = breedRow
    ? await supabase
        .from("breeder_profiles")
        .select("id, slug, kennel_name, city, region, is_premium, average_rating, review_count")
        .eq("is_approved", true)
        .contains("breed_ids", [breedRow.id])
        .order("is_premium", { ascending: false })
        .order("average_rating", { ascending: false })
        .limit(6)
    : { data: [] };

  const sa = breed.seeker_attributes;

  const coatTypeLabels: Record<string, string> = {
    corto: "Corto",
    medio: "Medio",
    lungo: "Lungo",
    duro: "Duro (Wire)",
    riccio: "Riccio",
    senza_pelo: "Senza pelo",
    doppio: "Doppio",
  };

  const useLabels: Record<string, string> = {
    compagnia: "Compagnia",
    guardia: "Guardia",
    caccia: "Caccia",
    sport: "Sport",
    pastorizia: "Pastorizia",
    terapia: "Terapia",
    lavoro: "Lavoro",
    slitta: "Slitta",
  };

  type AttributeRow =
    | { category: string; label: string; type: "bar"; value: number }
    | { category: string; label: string; type: "text"; value: string }
    | { category: string; label: string; type: "badges"; value: string[] };

  const attributes: AttributeRow[] = sa
    ? [
        { category: "Fisico", label: "Altezza al garrese", type: "text", value: `${sa.height_min_cm}–${sa.height_max_cm} cm` },
        { category: "Fisico", label: "Tipo di mantello", type: "text", value: coatTypeLabels[sa.coat_type] ?? sa.coat_type },
        { category: "Fisico", label: "Livello di bava", type: "bar", value: sa.drooling },
        { category: "Stile di vita", label: "Bisogno di esercizio", type: "bar", value: sa.exercise_needs },
        { category: "Stile di vita", label: "Adatto in appartamento", type: "bar", value: sa.apartment_suitable },
        { category: "Stile di vita", label: "Tolleranza alla solitudine", type: "bar", value: sa.alone_tolerance },
        { category: "Stile di vita", label: "Adatto al primo proprietario", type: "bar", value: sa.first_time_owner },
        { category: "Ambiente", label: "Tolleranza al caldo", type: "bar", value: sa.heat_tolerance },
        { category: "Ambiente", label: "Tolleranza al freddo", type: "bar", value: sa.cold_tolerance },
        { category: "Salute", label: "Problemi di salute comuni", type: "text", value: sa.health_issues.join(", ") },
        { category: "Utilizzo", label: "Utilizzo principale", type: "badges", value: sa.primary_use.map((u) => useLabels[u] ?? u) },
        { category: "Cura", label: "Colori del mantello", type: "text", value: sa.coat_colors.join(", ") },
      ]
    : [];

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/razze" className="text-sm text-primary hover:underline flex items-center gap-1 mb-4">
            <ArrowLeft className="h-3 w-3" />
            Tutte le razze
          </Link>

          <div className="flex items-start gap-6">
            {/* Photo */}
            <div className="w-28 h-28 rounded-2xl overflow-hidden bg-muted shrink-0 flex items-center justify-center">
              {breed.photo_url ? (
                <Image
                  src={breed.photo_url}
                  alt={breed.name_it}
                  width={112}
                  height={112}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                <span className="text-4xl">{breed.is_italian_breed ? "🇮🇹" : "🐕"}</span>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold">{breed.name_it}</h1>
              <p className="text-muted-foreground text-sm">{breed.name_en}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline">Gruppo FCI {breed.group_fci}</Badge>
                <Badge variant="outline">{breed.group_name_it}</Badge>
                <Badge variant="primary">Taglia {breed.size_category}</Badge>
                {breed.is_italian_breed && <Badge variant="success">Razza Italiana 🇮🇹</Badge>}
                <Badge variant="outline">{breed.origin_country}</Badge>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-end gap-2">
              <SaveBreedButton breedSlug={breed.slug} breedName={breed.name_it} />
              <a
                href={breed.fci_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" />
                Scheda FCI
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Description */}
            {(breed.description_it || breed.description_en) && (
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold">Descrizione</h2>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    {breed.description_it ?? breed.description_en}
                  </p>
                  {/* Source attribution */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1 border-t border-border">
                    <Info className="h-3 w-3 shrink-0" />
                    Fonte:{" "}
                    {breed.description_it && breed.sources.description_it ? (
                      <a
                        href={breed.sources.description_it}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        Wikipedia Italia
                      </a>
                    ) : (
                      <a href="https://dogapi.dog" target="_blank" rel="noopener noreferrer" className="hover:underline">
                        DogAPI
                      </a>
                    )}
                    {breed.photo_url && (
                      <> &middot; Foto: <span>{breed.photo_credit}</span></>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Seeker attributes table */}
            {sa && attributes.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Caratteristiche</h2>
                    {breed.sources.seeker_attributes && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Fonte: {breed.sources.seeker_attributes}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="py-2 pr-4 font-medium text-muted-foreground">Categoria</th>
                          <th className="py-2 pr-4 font-medium text-muted-foreground">Attributo</th>
                          <th className="py-2 font-medium text-muted-foreground">Valore</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attributes.map((attr, i) => {
                          const showCategory =
                            i === 0 || attributes[i - 1].category !== attr.category;
                          return (
                            <tr
                              key={attr.label}
                              className={showCategory && i > 0 ? "border-t border-border" : ""}
                            >
                              <td className="py-2.5 pr-4 text-muted-foreground align-top whitespace-nowrap">
                                {showCategory ? attr.category : ""}
                              </td>
                              <td className="py-2.5 pr-4 align-top">{attr.label}</td>
                              <td className="py-2.5 align-top">
                                {attr.type === "bar" ? (
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-primary rounded-full"
                                        style={{ width: `${(attr.value / 5) * 100}%` }}
                                      />
                                    </div>
                                    <span className="font-medium text-xs">{attr.value}/5</span>
                                  </div>
                                ) : attr.type === "badges" ? (
                                  <div className="flex flex-wrap gap-1">
                                    {attr.value.map((v) => (
                                      <Badge key={v} variant="outline">{v}</Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span>{attr.value}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Breeders */}
            <div>
              <h2 className="text-xl font-bold mb-4">
                Allevatori di {breed.name_it} in Italia
              </h2>
              {!breeders || breeders.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">
                    <span className="text-4xl block mb-3">🐕</span>
                    <p className="font-medium">Nessun allevatore ancora registrato per questa razza.</p>
                    <p className="text-sm mt-1">
                      Sei un allevatore di {breed.name_it}?{" "}
                      <Link href="/registrati" className="text-primary underline">
                        Registrati su {SITE_NAME}
                      </Link>
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {breeders.map((breeder) => (
                    <Link key={breeder.id} href={`/allevatori/${breeder.slug}`}>
                      <Card hover className="cursor-pointer">
                        <CardContent className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center text-xl shrink-0">
                            🏠
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold truncate">{breeder.kennel_name}</h3>
                            </div>
                            {(breeder.city || breeder.region) && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3" />
                                {[breeder.city, breeder.region].filter(Boolean).join(", ")}
                              </p>
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Physical data */}
            {(breed.weight_min_kg || breed.lifespan_min || breed.hypoallergenic !== null || sa?.height_min_cm) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Dati fisici</h2>
                    <a
                      href="https://dogapi.dog"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      DogAPI
                    </a>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {sa?.height_min_cm && sa?.height_max_cm && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Altezza</span>
                      <span className="font-medium">{sa.height_min_cm}–{sa.height_max_cm} cm</span>
                    </div>
                  )}
                  {breed.weight_min_kg && breed.weight_max_kg && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Peso</span>
                      <span className="font-medium">{breed.weight_min_kg}–{breed.weight_max_kg} kg</span>
                    </div>
                  )}
                  {breed.lifespan_min && breed.lifespan_max && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Aspettativa di vita</span>
                      <span className="font-medium">{breed.lifespan_min}–{breed.lifespan_max} anni</span>
                    </div>
                  )}
                  {breed.hypoallergenic !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ipoallergenico</span>
                      <span className="font-medium">{breed.hypoallergenic ? "Sì" : "No"}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* FCI info */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Scheda FCI</h2>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Numero FCI</span>
                  <span className="font-medium">{breed.fci_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gruppo</span>
                  <span className="font-medium">{breed.group_fci}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Origine</span>
                  <span className="font-medium">{breed.origin_country}</span>
                </div>
                <a
                  href={breed.fci_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline text-xs pt-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Standard ufficiale FCI
                </a>
              </CardContent>
            </Card>

            {/* Wikipedia link */}
            {breed.wikipedia_url_it && (
              <Card>
                <CardContent className="py-4">
                  <a
                    href={breed.wikipedia_url_it}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Leggi su Wikipedia Italia
                  </a>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
