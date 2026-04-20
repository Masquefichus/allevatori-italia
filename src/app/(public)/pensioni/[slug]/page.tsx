export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SITE_NAME } from "@/lib/constants";
import ProProfileClient from "@/components/profile/ProProfileClient";
import { loadBreederBundle } from "@/lib/profile/load-breeder-bundle";

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

  return (
    <>
      {backNav}
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
    </>
  );
}
