export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SITE_NAME } from "@/lib/constants";
import ChatModal from "@/components/chat/ChatModal";
import ReviewForm from "@/components/breeders/ReviewForm";
import BreederProfileClient from "./BreederProfileClient";

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

  const { data: breeder } = await supabase
    .from("breeder_profiles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!breeder) notFound();

  // Resolve breed UUIDs → name + slug
  let resolvedBreeds: { id: string; name_it: string; slug: string }[] = [];
  if (breeder.breed_ids?.length) {
    const { data: breedRows } = await supabase
      .from("breeds")
      .select("id, name_it, slug")
      .in("id", breeder.breed_ids);
    if (breedRows) {
      resolvedBreeds = breeder.breed_ids
        .map((id: string) => breedRows.find((b) => b.id === id))
        .filter(Boolean) as { id: string; name_it: string; slug: string }[];
    }
  }

  // Fetch listings
  const { data: listingRows } = await supabase
    .from("listings")
    .select("id, title, breed_id, price_min, price_max, price_on_request, available_puppies, litter_date, gender_available, pedigree_included, vaccinated, microchipped, health_tests, images, status")
    .eq("breeder_id", breeder.id)
    .order("created_at", { ascending: false });

  const listings = (listingRows ?? []) as Parameters<typeof BreederProfileClient>[0]["listings"];

  // Fetch reviews
  const { data: reviewRows } = await supabase
    .from("reviews")
    .select("id, rating, title, content, created_at, author:profiles(full_name)")
    .eq("breeder_id", breeder.id)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  const reviews = (reviewRows ?? []) as unknown as Parameters<typeof BreederProfileClient>[0]["reviews"];

  // Check if the logged-in user owns this profile
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = !!user && user.id === breeder.user_id;

  // Fetch all breeds for the edit mode picker
  const { data: allBreedRows } = isOwner
    ? await supabase.from("breeds").select("id, name_it, slug").order("name_it")
    : { data: null };
  const allBreeds = (allBreedRows ?? []) as { id: string; name_it: string; slug: string }[];

  return (
    <>
      {/* Back nav */}
      <div className="border-b border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Link
            href="/allevatori"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Tutti gli allevatori
          </Link>
        </div>
      </div>

      <BreederProfileClient
        breeder={breeder}
        breeds={resolvedBreeds}
        allBreeds={allBreeds}
        listings={listings}
        reviews={reviews}
        isOwner={isOwner}
        ChatModalComponent={
          breeder.user_id ? (
            <ChatModal breederUserId={breeder.user_id} breederName={breeder.kennel_name} />
          ) : null
        }
        ReviewFormComponent={
          <ReviewForm breederId={breeder.id} breederName={breeder.kennel_name} />
        }
      />
    </>
  );
}
