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
  const [litters, setLitters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const supabase = createClient();
      if (!supabase) { setLoading(false); return; }

      const { data: bp } = await (supabase as any)
        .from("breeder_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (!bp) { setLoading(false); return; }

      const { data } = await (supabase as any)
        .from("litters")
        .select("id, name, breed_id, status, litter_date, images, created_at, puppies(id, status)")
        .eq("breeder_id", bp.id)
        .order("created_at", { ascending: false });

      setLitters(data || []);
      setLoading(false);
    }
    load();
  }, [user]);

  async function deleteLitter(id: string) {
    if (!confirm("Eliminare questa cucciolata e tutti i cuccioli?")) return;
    setDeleting(id);
    const supabase = createClient();
    if (!supabase) return;
    await (supabase as any).from("litters").delete().eq("id", id);
    setLitters((prev) => prev.filter((l) => l.id !== id));
    setDeleting(null);
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
          <p className="text-muted-foreground">Gestisci le tue cucciolate</p>
        </div>
        <Link href="/dashboard/annunci/nuovo">
          <Button>
            <Plus className="h-4 w-4" />
            Nuova Cucciolata
          </Button>
        </Link>
      </div>

      {litters.length === 0 ? (
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
          {litters.map((litter) => {
            const puppies = litter.puppies ?? [];
            const available = puppies.filter((p: any) => p.status === "disponibile").length;
            const total = puppies.length;
            const date = new Date(litter.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
            const status = litter.status as keyof typeof STATUS_BADGE;
            const img = litter.images?.[0];
            return (
              <Card key={litter.id}>
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4">
                  <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex items-center justify-center text-2xl shrink-0">
                    {img
                      ? <img src={img} alt="" className="w-full h-full object-cover" />
                      : <Dog className="h-6 w-6 text-muted-foreground" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-medium truncate">{litter.name}</h3>
                      <Badge variant={STATUS_BADGE[status] ?? "outline"}>
                        {STATUS_LABEL[status] ?? status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {total > 0 ? `${total} cuccioli (${available} disponibili)` : "Nessun cucciolo inserito"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Creato il {date}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/dashboard/annunci/${litter.id}`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteLitter(litter.id)}
                      disabled={deleting === litter.id}
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
