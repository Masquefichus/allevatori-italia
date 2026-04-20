import { Metadata } from "next";
import Link from "next/link";
import { MapPin, Home } from "lucide-react";
import Card, { CardContent } from "@/components/ui/Card";
import { SITE_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `Pensioni per Cani | ${SITE_NAME}`,
  description: "Trova pensioni, dog sitter e pet hotel in Italia.",
};

export default async function PensioniPage() {
  const supabase = await createClient();

  const { data: boardings } = await supabase
    .from("boarding_profiles")
    .select("id, slug, name, description, region, city, logo_url")
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Home className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Pensioni</h1>
          <p className="text-muted-foreground">Pensioni, dog sitter e pet hotel per il tuo cane</p>
        </div>
      </div>

      {!boardings || boardings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <Home className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">Nessuna pensione ancora registrata.</p>
            <p className="text-xs text-muted-foreground">Il team pensioni sta lavorando per popolare questa sezione.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boardings.map((b) => (
            <Link key={b.id} href={`/pensioni/${b.slug}`}>
              <Card hover>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-3">
                    {b.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.logo_url} alt={b.name} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <Home className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <h2 className="font-semibold">{b.name}</h2>
                  </div>
                  {(b.city || b.region) && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {[b.city, b.region].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {b.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{b.description}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
