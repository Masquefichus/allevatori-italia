"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Dog } from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

const STATUS_BADGE = {
  attivo: "success" as const,
  venduto: "default" as const,
  scaduto: "destructive" as const,
  bozza: "outline" as const,
};

const STATUS_LABEL: Record<string, string> = {
  attivo: "Attivo",
  venduto: "Venduto",
  scaduto: "Scaduto",
  bozza: "Bozza",
};

export default function CucciolatePage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const supabase = createClient();
      if (!supabase) { setLoading(false); return; }

      // Get the breeder profile for this user
      const { data: bp } = await (supabase as any)
        .from("breeder_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (!bp) { setLoading(false); return; }

      const { data } = await (supabase as any)
        .from("listings")
        .select("id, title, breed_id, status, available_puppies, price_min, price_max, price_on_request, images, created_at")
        .eq("breeder_id", bp.id)
        .order("created_at", { ascending: false });

      setListings(data || []);
      setLoading(false);
    }
    load();
  }, [user]);

  async function deleteListing(id: string) {
    if (!confirm("Eliminare questa cucciolata?")) return;
    setDeleting(id);
    const supabase = createClient();
    if (!supabase) return;
    await (supabase as any).from("listings").delete().eq("id", id);
    setListings((prev) => prev.filter((l) => l.id !== id));
    setDeleting(null);
  }

  function formatPrice(l: any) {
    if (l.price_on_request) return "Prezzo su richiesta";
    if (l.price_min && l.price_max && l.price_min !== l.price_max)
      return `€${l.price_min.toLocaleString("it-IT")} – €${l.price_max.toLocaleString("it-IT")}`;
    if (l.price_min || l.price_max)
      return `€${(l.price_min ?? l.price_max).toLocaleString("it-IT")}`;
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cucciolate</h1>
          <p className="text-muted-foreground">Gestisci le tue cucciolate disponibili</p>
        </div>
        <Link href="/dashboard/annunci/nuovo">
          <Button>
            <Plus className="h-4 w-4" />
            Nuova Cucciolata
          </Button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Dog className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nessuna cucciolata ancora</h3>
            <p className="text-muted-foreground mb-6">
              Pubblica la tua prima cucciolata per iniziare a ricevere richieste.
            </p>
            <Link href="/dashboard/annunci/nuovo">
              <Button>
                <Plus className="h-4 w-4" />
                Nuova Cucciolata
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => {
            const price = formatPrice(listing);
            const img = listing.images?.[0];
            const date = new Date(listing.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
            const status = listing.status as keyof typeof STATUS_BADGE;
            return (
              <Card key={listing.id}>
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4">
                  <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex items-center justify-center text-2xl shrink-0">
                    {img
                      ? <img src={img} alt="" className="w-full h-full object-cover" />
                      : "🐶"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-medium truncate">{listing.title ?? "Cucciolata"}</h3>
                      <Badge variant={STATUS_BADGE[status] ?? "outline"}>
                        {STATUS_LABEL[status] ?? status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {listing.available_puppies != null && `${listing.available_puppies} cuccioli`}
                      {price && ` · ${price}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Pubblicato il {date}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/dashboard/annunci/${listing.id}`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteListing(listing.id)}
                      disabled={deleting === listing.id}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
