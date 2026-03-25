"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, MapPin } from "lucide-react";
import Card, { CardContent } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";

export default function SalvatiPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFavorites() {
      const supabase = createClient();
      if (!supabase) { setLoading(false); return; }

      const storageKey = `sb-nveyyjefsrdyjdtwwxda-auth-token`;
      const stored = localStorage.getItem(storageKey);
      if (!stored) { setLoading(false); return; }

      try {
        const session = JSON.parse(stored);
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });

        const { data } = await supabase
          .from("favorites")
          .select(`
            id,
            created_at,
            listing:listings (
              id,
              title,
              breed_name,
              price,
              images,
              breeder:breeder_profiles (
                business_name,
                city,
                regione
              )
            )
          `)
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        setFavorites(data || []);
      } catch {}

      setLoading(false);
    }

    loadFavorites();
  }, []);

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
        <h1 className="text-2xl font-bold">Annunci Salvati</h1>
        <p className="text-muted-foreground">I tuoi annunci preferiti</p>
      </div>

      {favorites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nessun annuncio salvato</h3>
            <p className="text-muted-foreground mb-4">
              Esplora gli allevatori e salva gli annunci che ti interessano.
            </p>
            <Link
              href="/allevatori"
              className="text-primary font-medium hover:underline"
            >
              Cerca allevatori →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites.map((fav) => (
            <Card key={fav.id} hover>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {fav.listing?.images?.[0] && (
                    <img
                      src={fav.listing.images[0]}
                      alt={fav.listing.title}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{fav.listing?.title}</h3>
                    <p className="text-sm text-muted-foreground">{fav.listing?.breed_name}</p>
                    {fav.listing?.breeder && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {fav.listing.breeder.city}, {fav.listing.breeder.regione}
                      </p>
                    )}
                    {fav.listing?.price && (
                      <p className="text-sm font-medium text-primary mt-1">
                        €{fav.listing.price}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
