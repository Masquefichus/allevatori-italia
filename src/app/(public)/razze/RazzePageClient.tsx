"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Heart } from "lucide-react";
import Card, { CardContent } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import type { RazzaEnricched, PrimaryUse } from "@/data/razze-types";
import BreedFilters from "./BreedFilters";

interface Props {
  allBreeds: RazzaEnricched[];
}

function RazzeContent({ allBreeds }: Props) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [savedSlugs, setSavedSlugs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    if (!supabase) return;
    (supabase as any)
      .from("breed_favorites")
      .select("breed_slug")
      .eq("user_id", user.id)
      .then(({ data }: { data: { breed_slug: string }[] | null }) => {
        if (data) setSavedSlugs(new Set(data.map((r) => r.breed_slug)));
      });
  }, [user]);

  // Read all filter params
  const q = searchParams.get("q") ?? "";
  const size = searchParams.get("size") ?? "";
  const group = searchParams.get("group") ?? "";
  const coat = searchParams.get("coat") ?? "";
  const apartment = searchParams.get("apartment") === "true";
  const firstTime = searchParams.get("first_time") === "true";
  const italian = searchParams.get("italian") === "true";
  const use = searchParams.get("use") ?? "";
  const exerciseMax = searchParams.get("exercise_max") ?? "";
  const droolMax = searchParams.get("drool_max") ?? "";
  const aloneMin = searchParams.get("alone_min") ?? "";
  const heatMin = searchParams.get("heat_min") ?? "";
  const coldMin = searchParams.get("cold_min") ?? "";
  const heightMin = searchParams.get("height_min") ?? "";
  const heightMax = searchParams.get("height_max") ?? "";
  const country = searchParams.get("country") ?? "";

  const filteredBreeds = useMemo(() => {
    return allBreeds.filter((breed) => {
      const sa = breed.seeker_attributes;

      if (q) {
        const lower = q.toLowerCase();
        if (
          !breed.name_it.toLowerCase().includes(lower) &&
          !breed.name_en.toLowerCase().includes(lower)
        )
          return false;
      }
      if (size && !size.split(",").includes(breed.size_category)) return false;
      if (group && breed.group_fci !== Number(group)) return false;
      if (coat && sa?.coat_type !== coat) return false;
      if (apartment && (!sa || sa.apartment_suitable < 4)) return false;
      if (firstTime && (!sa || sa.first_time_owner < 4)) return false;
      if (italian && !breed.is_italian_breed) return false;
      if (use && (!sa || !sa.primary_use.includes(use as PrimaryUse))) return false;
      if (exerciseMax && (!sa || sa.exercise_needs > Number(exerciseMax))) return false;
      if (droolMax && (!sa || sa.drooling > Number(droolMax))) return false;
      if (aloneMin && (!sa || sa.alone_tolerance < Number(aloneMin))) return false;
      if (heatMin && (!sa || sa.heat_tolerance < Number(heatMin))) return false;
      if (coldMin && (!sa || sa.cold_tolerance < Number(coldMin))) return false;
      if (heightMin && (!sa || sa.height_max_cm < Number(heightMin))) return false;
      if (heightMax && (!sa || sa.height_min_cm > Number(heightMax))) return false;
      if (country && !country.split(",").includes(breed.origin_country)) return false;

      return true;
    });
  }, [allBreeds, q, size, group, coat, apartment, firstTime, italian, use, exerciseMax, droolMax, aloneMin, heatMin, coldMin, heightMin, heightMax, country]);

  const hasFilters = q || size || group || coat || apartment || firstTime || italian || use || exerciseMax || droolMax || aloneMin || heatMin || coldMin || heightMin || heightMax || country;

  const sortedBreeds = useMemo(
    () => [...filteredBreeds].sort((a, b) => a.name_it.localeCompare(b.name_it, "it")),
    [filteredBreeds]
  );

  async function toggleSave(e: React.MouseEvent, slug: string, name: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      window.location.href = `/accedi?redirect=/razze`;
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    if (savedSlugs.has(slug)) {
      await (supabase as any)
        .from("breed_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("breed_slug", slug);
      setSavedSlugs((prev) => { const s = new Set(prev); s.delete(slug); return s; });
    } else {
      await (supabase as any)
        .from("breed_favorites")
        .insert({ user_id: user.id, breed_slug: slug, breed_name: name });
      setSavedSlugs((prev) => new Set(prev).add(slug));
    }
  }

  function SaveBtn({ slug, name }: { slug: string; name: string }) {
    const saved = savedSlugs.has(slug);
    return (
      <button
        onClick={(e) => toggleSave(e, slug, name)}
        className={`absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
          saved
            ? "opacity-100 bg-rose-50 text-rose-500"
            : "bg-white/90 text-muted-foreground hover:text-rose-500"
        }`}
        title={saved ? "Rimuovi dai preferiti" : "Salva razza"}
      >
        <Heart className={`h-4 w-4 ${saved ? "fill-rose-500 text-rose-500" : ""}`} />
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-2">Razze di Cani</h1>
        <p className="text-muted-foreground mb-2">
          Esplora {allBreeds.length} razze e trova l&apos;allevatore giusto per te
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Tutte le razze riconosciute ufficialmente dalla{" "}
          <a href="https://www.fci.be" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            FCI — Fédération Cynologique Internationale
          </a>
          , l&apos;organizzazione cinofila mondiale che classifica le razze in 10 gruppi in base alle loro caratteristiche e funzioni originarie.
        </p>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className="w-full lg:w-64 shrink-0">
            <BreedFilters />
          </aside>

          {/* Main content */}
          <div className="flex-1">
            {/* Result count */}
            {hasFilters && (
              <p className="text-sm text-muted-foreground mb-4">
                {filteredBreeds.length} razze trovate su {allBreeds.length}
              </p>
            )}

            {/* No results */}
            {filteredBreeds.length === 0 && (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  <span className="text-4xl block mb-3">🔍</span>
                  <p className="font-medium">Nessuna razza trovata con i filtri selezionati.</p>
                  <p className="text-sm mt-1">
                    Prova a modificare o{" "}
                    <Link href="/razze" className="text-primary underline">
                      reimpostare i filtri
                    </Link>
                  </p>
                </CardContent>
              </Card>
            )}

            {/* All breeds — flat alphabetical list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {sortedBreeds.map((breed) => (
                <Link key={breed.slug} href={`/razze/${breed.slug}`} className="group relative block">
                  <Card hover>
                    <CardContent className="flex items-center gap-3 py-3">
                      <div className="w-10 h-10 bg-muted rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-lg">
                        {breed.photo_url ? (
                          <Image src={breed.photo_url} alt={breed.name_it} width={40} height={40} className="object-cover w-full h-full" unoptimized />
                        ) : (
                          breed.is_italian_breed ? "🇮🇹" : "🐕"
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm truncate">{breed.name_it}</h3>
                        <p className="text-xs text-muted-foreground">{breed.origin_country}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <SaveBtn slug={breed.slug} name={breed.name_it} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RazzePageClient({ allBreeds }: Props) {
  return (
    <Suspense>
      <RazzeContent allBreeds={allBreeds} />
    </Suspense>
  );
}
