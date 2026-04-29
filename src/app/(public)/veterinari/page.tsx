import { Metadata } from "next";
import Link from "next/link";
import { MapPin, Stethoscope, Siren, Home as HomeIcon } from "lucide-react";
import Card, { CardContent } from "@/components/ui/Card";
import { SITE_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `Veterinari per Cani | ${SITE_NAME}`,
  description: "Trova medici veterinari professionisti per il tuo cane in Italia.",
};

export default async function VeterinariPage() {
  const supabase = await createClient();

  const { data: vets } = await supabase
    .from("vet_profiles")
    .select("id, slug, name, description, region, city, logo_url, specializations, emergency_available, house_visits, clinic_name")
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Stethoscope className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Veterinari</h1>
          <p className="text-muted-foreground">Medici veterinari professionisti per la salute del tuo cane</p>
        </div>
      </div>

      {!vets || vets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <Stethoscope className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">Nessun veterinario ancora registrato.</p>
            <p className="text-xs text-muted-foreground">Stiamo iniziando a popolare questa sezione.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vets.map((v) => (
            <Link key={v.id} href={`/veterinari/${v.slug}`}>
              <Card hover>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-3">
                    {v.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.logo_url} alt={v.name} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <Stethoscope className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <h2 className="font-semibold">{v.name}</h2>
                      {v.clinic_name && (
                        <p className="text-xs text-muted-foreground">{v.clinic_name}</p>
                      )}
                    </div>
                  </div>

                  {(v.city || v.region) && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {[v.city, v.region].filter(Boolean).join(", ")}
                    </p>
                  )}

                  {v.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{v.description}</p>
                  )}

                  {(v.specializations?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {v.specializations!.slice(0, 3).map((s: string) => (
                        <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {s}
                        </span>
                      ))}
                      {v.specializations!.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{v.specializations!.length - 3}</span>
                      )}
                    </div>
                  )}

                  {(v.emergency_available || v.house_visits) && (
                    <div className="flex gap-3 pt-1 text-xs text-muted-foreground">
                      {v.emergency_available && (
                        <span className="inline-flex items-center gap-1">
                          <Siren className="h-3.5 w-3.5" /> Urgenze
                        </span>
                      )}
                      {v.house_visits && (
                        <span className="inline-flex items-center gap-1">
                          <HomeIcon className="h-3.5 w-3.5" /> Visite a domicilio
                        </span>
                      )}
                    </div>
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
