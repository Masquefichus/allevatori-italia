export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, MapPin, Home, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import Card, { CardContent } from "@/components/ui/Card";
import ProProfileClient from "@/components/profile/ProProfileClient";
import { loadBreederBundle } from "@/lib/profile/load-breeder-bundle";
import PensioneMap from "./PensioneMap";
import RequestBookingButton from "./RequestBookingButton";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("boarding_profiles")
    .select("name, city, region")
    .eq("slug", slug)
    .single();
  if (!data) return { title: `Pensione | ${SITE_NAME}` };
  return {
    title: `${data.name} — ${data.city ?? data.region ?? ""} | ${SITE_NAME}`,
    description: `Scopri ${data.name}, pensione per cani su ${SITE_NAME}.`,
  };
}

export default async function PensioneProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: boarding } = await supabase
    .from("boarding_profiles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!boarding) notFound();

  const [bundle, trainerResult] = boarding.user_id
    ? await Promise.all([
        loadBreederBundle(supabase, boarding.user_id),
        supabase.from("trainer_profiles").select("*").eq("user_id", boarding.user_id).maybeSingle(),
      ])
    : [null, { data: null }];

  const trainer = trainerResult.data ?? null;
  const bundle_ = bundle;

  // Pensioni simili (stessa regione, escludendo l'attuale) — best effort
  const { data: similiRaw } = boarding.region
    ? await supabase
        .from("boarding_profiles")
        .select("id, slug, name, city, region, logo_url, gallery_urls")
        .eq("is_approved", true)
        .eq("region", boarding.region)
        .neq("id", boarding.id)
        .limit(3)
    : { data: null };
  const simili = similiRaw ?? [];

  const backNav = (
    <div className="bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <Link
          href="/pensioni"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Tutte le pensioni
        </Link>
      </div>
    </div>
  );

  // Dati strutturati LocalBusiness (rich snippets Google)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/pensioni/${boarding.slug}`,
    name: boarding.name,
    description: boarding.description ?? undefined,
    image: (boarding.gallery_urls as string[] | null)?.slice(0, 4) ?? undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: boarding.city ?? undefined,
      addressRegion: boarding.region ?? undefined,
      streetAddress: boarding.address ?? undefined,
      addressCountry: "IT",
    },
    telephone: boarding.phone ?? undefined,
    email: boarding.email_public ?? undefined,
    url: `${SITE_URL}/pensioni/${boarding.slug}`,
    ...(boarding.latitude && boarding.longitude
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: boarding.latitude,
            longitude: boarding.longitude,
          },
        }
      : {}),
  };

  const hasLocation = boarding.city || boarding.region;

  return (
    <>
      {backNav}

      {/* CTA prenotazione — visibile sopra al profilo per essere subito raggiungibile */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-4">
        <section className="bg-primary-light/40 border border-primary/30 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
          <div>
            <h2 className="font-serif text-lg text-foreground">
              Vuoi prenotare un soggiorno per il tuo cane?
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Invia una richiesta a {boarding.name}: ti risponderanno entro 48 ore.
            </p>
          </div>
          <RequestBookingButton boardingId={boarding.id} boardingName={boarding.name} />
        </section>
      </div>

      <ProProfileClient
        urlRole="pensione"
        initialTab="chi-siamo"
        breeder={bundle_?.breeder ?? null}
        breeds={bundle_?.breeds ?? []}
        allBreeds={bundle_?.allBreeds ?? []}
        litters={(bundle_?.litters ?? []) as Parameters<typeof ProProfileClient>[0]["litters"]}
        breedingDogs={(bundle_?.breedingDogs ?? []) as Parameters<typeof ProProfileClient>[0]["breedingDogs"]}
        reviews={(bundle_?.reviews ?? []) as unknown as Parameters<typeof ProProfileClient>[0]["reviews"]}
        trainer={trainer}
        boarding={boarding}
        ownerUserId={boarding.user_id}
        ChatModalComponent={null}
        ReviewFormComponent={null}
      />

      {/* Sezioni aggiuntive sotto al ProProfileClient */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 space-y-10">
        {/* Mappa */}
        {hasLocation && (
          <section>
            <h2 className="font-serif text-2xl mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Dove si trova
            </h2>
            <Card>
              <CardContent className="p-5">
                <PensioneMap
                  nome={boarding.name}
                  citta={boarding.city ?? null}
                  provincia={boarding.province ?? null}
                  regione={boarding.region ?? null}
                  latitude={boarding.latitude ?? null}
                  longitude={boarding.longitude ?? null}
                  address={boarding.address ?? null}
                />
              </CardContent>
            </Card>
          </section>
        )}

        {/* Pensioni simili */}
        {simili.length > 0 && (
          <section>
            <h2 className="font-serif text-2xl mb-4">Altre pensioni in {boarding.region}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {simili.map((s) => {
                const cover = (s.gallery_urls as string[] | null)?.[0] ?? s.logo_url;
                return (
                  <Link key={s.id} href={`/pensioni/${s.slug}`}>
                    <Card hover className="cursor-pointer h-full overflow-hidden">
                      <div className="h-32 bg-gradient-to-br from-primary-light to-primary-light/50 relative overflow-hidden">
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cover}
                            alt={`Foto di ${s.name}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Home className="h-10 w-10 text-primary/40" />
                          </div>
                        )}
                      </div>
                      <CardContent className="space-y-1.5">
                        <h3 className="font-semibold text-base leading-tight">{s.name}</h3>
                        {(s.city || s.region) && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {[s.city, s.region].filter(Boolean).join(", ")}
                          </p>
                        )}
                        <p className="pt-1 text-sm text-primary inline-flex items-center gap-1">
                          Vedi profilo
                          <ArrowRight className="h-3.5 w-3.5" />
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* JSON-LD LocalBusiness */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
