import { Metadata } from "next";
import Link from "next/link";
import { MapPin, GraduationCap } from "lucide-react";
import Card, { CardContent } from "@/components/ui/Card";
import { SITE_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `Addestratori di Cani | ${SITE_NAME}`,
  description: "Trova addestratori di cani professionali in Italia.",
};

export default async function AddestratoriPage() {
  const supabase = await createClient();

  const { data: trainers } = await supabase
    .from("trainer_profiles")
    .select("id, slug, name, description, region, city, logo_url")
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <GraduationCap className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Addestratori</h1>
          <p className="text-muted-foreground">Professionisti per l&apos;educazione e l&apos;addestramento del tuo cane</p>
        </div>
      </div>

      {!trainers || trainers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <GraduationCap className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">Nessun addestratore ancora registrato.</p>
            <p className="text-xs text-muted-foreground">Il team addestratori sta lavorando per popolare questa sezione.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainers.map((t) => (
            <Link key={t.id} href={`/addestratori/${t.slug}`}>
              <Card hover>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-3">
                    {t.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.logo_url} alt={t.name} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <h2 className="font-semibold">{t.name}</h2>
                  </div>
                  {(t.city || t.region) && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {[t.city, t.region].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {t.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>
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
