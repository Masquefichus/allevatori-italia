"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import Card, { CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { gruppiFCI } from "@/data/razze";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import type { RazzaEnricched } from "@/data/razze-types";

interface Props {
  italianBreeds: RazzaEnricched[];
  breedsByGroup: Record<number, RazzaEnricched[]>;
  totalCount: number;
}

export default function RazzePageClient({ italianBreeds, breedsByGroup, totalCount }: Props) {
  const { user } = useAuth();
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
          Esplora {totalCount} razze e trova l&apos;allevatore giusto per te
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Tutte le razze riconosciute ufficialmente dalla{" "}
          <a href="https://www.fci.be" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            FCI — Fédération Cynologique Internationale
          </a>
          , l&apos;organizzazione cinofila mondiale che classifica le razze in 10 gruppi in base alle loro caratteristiche e funzioni originarie.
        </p>

        {/* Italian Breeds */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>🇮🇹</span> Razze Italiane
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {italianBreeds.map((breed) => (
              <Link key={breed.slug} href={`/razze/${breed.slug}`} className="group relative block">
                <Card hover>
                  <CardContent className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-green-100 shrink-0 flex items-center justify-center">
                      {breed.photo_url ? (
                        <Image src={breed.photo_url} alt={breed.name_it} width={48} height={48} className="object-cover w-full h-full" unoptimized />
                      ) : (
                        <span>🇮🇹</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium">{breed.name_it}</h3>
                      <p className="text-xs text-muted-foreground">{breed.name_en}</p>
                    </div>
                    <Badge variant="outline" className="ml-auto mr-6">
                      {breed.size_category}
                    </Badge>
                  </CardContent>
                </Card>
                <SaveBtn slug={breed.slug} name={breed.name_it} />
              </Link>
            ))}
          </div>
        </div>

        {/* All Breeds by FCI Group */}
        {Object.entries(breedsByGroup)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([group, breeds]) => (
            <div key={group} className="mb-10">
              <h2 className="text-xl font-bold mb-1">Gruppo {group}</h2>
              <p className="text-sm text-muted-foreground mb-4">{gruppiFCI[Number(group)]}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {breeds.map((breed) => (
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
          ))}
      </div>
    </div>
  );
}
