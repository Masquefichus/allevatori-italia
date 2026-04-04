"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, MapPin, Star, Shield } from "lucide-react";
import Card, { CardContent } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export default function PrefertiPage() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"allevatori" | "razze">("allevatori");
  const [breeders, setBreeders] = useState<any[]>([]);
  const [breeds, setBreeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    async function load() {
      const supabase = createClient();
      if (!supabase) { setLoading(false); return; }

      const [{ data: favBreeders }, { data: favBreeds }] = await Promise.all([
        (supabase as any)
          .from("favorites")
          .select(`
            id, created_at,
            breeder:breeder_profiles (
              id, kennel_name, slug, city, region, logo_url,
              average_rating, review_count, enci_verified, is_premium
            )
          `)
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false }),
        (supabase as any)
          .from("breed_favorites")
          .select("id, breed_slug, breed_name, created_at")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false }),
      ]);

      setBreeders(favBreeders || []);
      setBreeds(favBreeds || []);
      setLoading(false);
    }

    load();
  }, [user, authLoading]);

  async function removeBreeder(favId: string) {
    const supabase = createClient();
    if (!supabase) return;
    await (supabase as any).from("favorites").delete().eq("id", favId);
    setBreeders((prev) => prev.filter((f) => f.id !== favId));
  }

  async function removeBreed(favId: string) {
    const supabase = createClient();
    if (!supabase) return;
    await (supabase as any).from("breed_favorites").delete().eq("id", favId);
    setBreeds((prev) => prev.filter((f) => f.id !== favId));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Preferiti</h1>
        <p className="text-muted-foreground">Allevatori e razze che hai salvato</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border">
        {([
          { id: "allevatori", label: "Allevatori", count: breeders.length },
          { id: "razze", label: "Razze", count: breeds.length },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-1 py-3 mr-6 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Allevatori tab */}
      {tab === "allevatori" && (
        breeders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nessun allevatore salvato</h3>
              <p className="text-muted-foreground mb-4">
                Esplora gli allevatori e salvali per ritrovarli facilmente.
              </p>
              <Link href="/allevatori" className="text-primary font-medium hover:underline">
                Cerca allevatori →
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {breeders.map((fav) => {
              const b = fav.breeder;
              if (!b) return null;
              return (
                <Card key={fav.id} className="group">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Link href={`/allevatori/${b.slug}`} className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center text-xl">
                        {b.logo_url
                          ? <img src={b.logo_url} alt={b.kennel_name} className="w-full h-full object-cover" />
                          : "🏠"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground truncate">{b.kennel_name}</h3>
                          {b.is_premium && (
                            <span className="text-xs bg-secondary text-white px-2 py-0.5 rounded-full">Premium</span>
                          )}
                        </div>
                        {(b.city || b.region) && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {[b.city, b.region].filter(Boolean).join(", ")}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {b.enci_verified && (
                            <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                              <Shield className="h-3 w-3" /> ENCI
                            </span>
                          )}
                          {b.average_rating > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Star className="h-3 w-3 fill-secondary text-secondary" />
                              {b.average_rating.toFixed(1)} ({b.review_count})
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={() => removeBreeder(fav.id)}
                      className="shrink-0 p-2 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      title="Rimuovi dai preferiti"
                    >
                      <Heart className="h-5 w-5 fill-rose-400" />
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* Razze tab */}
      {tab === "razze" && (
        breeds.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nessuna razza salvata</h3>
              <p className="text-muted-foreground mb-4">
                Esplora le razze e salvale per confrontarle con calma.
              </p>
              <Link href="/razze" className="text-primary font-medium hover:underline">
                Scopri le razze →
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {breeds.map((fav) => (
              <Card key={fav.id} className="group">
                <CardContent className="p-4 flex items-center gap-4">
                  <Link href={`/razze/${fav.breed_slug}`} className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-xl bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center text-2xl">
                      🐕
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{fav.breed_name}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">Vedi scheda razza →</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => removeBreed(fav.id)}
                    className="shrink-0 p-2 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    title="Rimuovi dai preferiti"
                  >
                    <Heart className="h-5 w-5 fill-rose-400" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}
