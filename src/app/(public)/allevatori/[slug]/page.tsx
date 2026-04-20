export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SITE_NAME } from "@/lib/constants";
import ChatModal from "@/components/chat/ChatModal";
import ReviewForm from "@/components/breeders/ReviewForm";
import ProProfileClient from "@/components/profile/ProProfileClient";
import { loadBreederBundle } from "@/lib/profile/load-breeder-bundle";

interface BreederPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BreederPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("breeder_profiles")
    .select("kennel_name, city, region")
    .eq("slug", slug)
    .single();
  if (!data) return { title: `Allevatore | ${SITE_NAME}` };
  return {
    title: `${data.kennel_name} — ${data.city ?? data.region} | ${SITE_NAME}`,
    description: `Scopri ${data.kennel_name}, allevatore certificato a ${data.city ?? data.region}. Profilo verificato su ${SITE_NAME}.`,
  };
}

export default async function BreederProfilePage({ params }: BreederPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: breederBySlug } = await supabase
    .from("breeder_profiles")
    .select("user_id")
    .eq("slug", slug)
    .single();

  if (!breederBySlug) notFound();

  const [bundle, trainerResult, boardingResult] = await Promise.all([
    loadBreederBundle(supabase, breederBySlug.user_id!),
    supabase.from("trainer_profiles").select("*").eq("user_id", breederBySlug.user_id!).maybeSingle(),
    supabase.from("boarding_profiles").select("*").eq("user_id", breederBySlug.user_id!).maybeSingle(),
  ]);

  if (!bundle) notFound();

  const { breeder, breeds, allBreeds, litters, breedingDogs, reviews } = bundle;
  const trainer = trainerResult.data ?? null;
  const boarding = boardingResult.data ?? null;

  const backNav = (
    <div className="bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <Link
          href="/allevatori"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Tutti gli allevatori
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {backNav}
      <ProProfileClient
        urlRole="allevatore"
        initialTab="chi-siamo"
        breeder={breeder}
        breeds={breeds}
        allBreeds={allBreeds}
        litters={litters as Parameters<typeof ProProfileClient>[0]["litters"]}
        breedingDogs={breedingDogs as Parameters<typeof ProProfileClient>[0]["breedingDogs"]}
        reviews={reviews as unknown as Parameters<typeof ProProfileClient>[0]["reviews"]}
        trainer={trainer}
        boarding={boarding}
        ownerUserId={breeder.user_id}
        ChatModalComponent={
          breeder.user_id ? (
            <ChatModal breederUserId={breeder.user_id} breederName={breeder.kennel_name} />
          ) : null
        }
        ReviewFormComponent={<ReviewForm breederId={breeder.id} breederName={breeder.kennel_name} />}
      />
    </>
  );
}
