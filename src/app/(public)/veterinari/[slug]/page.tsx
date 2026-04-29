export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import VetPublicProfileClient from "@/components/profile/VetPublicProfileClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("vet_profiles")
    .select("name, city, region, description")
    .eq("slug", slug)
    .single();

  if (!data) return { title: `Veterinario | ${SITE_NAME}` };

  const location = [data.city, data.region].filter(Boolean).join(", ");
  return {
    title: `${data.name}${location ? ` — ${location}` : ""} | ${SITE_NAME}`,
    description: data.description || `Profilo veterinario di ${data.name} su ${SITE_NAME}.`,
  };
}

// Escape `<` so user-provided strings cannot break out of the JSON-LD <script> tag.
function safeJsonLd(payload: unknown): string {
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}

export default async function VeterinarioProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: vet } = await supabase
    .from("vet_profiles")
    .select("*")
    .eq("slug", slug)
    .eq("is_approved", true)
    .maybeSingle();

  if (!vet) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    additionalType: "https://schema.org/VeterinaryCare",
    name: vet.name,
    url: `${SITE_URL}/veterinari/${vet.slug}`,
    description: vet.description ?? undefined,
    image: vet.logo_url ?? undefined,
    telephone: vet.phone ?? undefined,
    email: vet.email_public ?? undefined,
    address: {
      "@type": "PostalAddress",
      addressCountry: "IT",
      addressRegion: vet.region ?? undefined,
      addressLocality: vet.city ?? undefined,
      streetAddress: vet.address ?? undefined,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      <div className="bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
          <Link
            href="/veterinari"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Tutti i veterinari
          </Link>
        </div>
      </div>

      <VetPublicProfileClient vet={vet} ownerUserId={vet.user_id} />
    </>
  );
}
