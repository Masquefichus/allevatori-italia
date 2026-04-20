import type { createClient } from "@/lib/supabase/server";

type DbClient = Awaited<ReturnType<typeof createClient>>;

export async function loadBreederBundle(supabase: DbClient, userId: string) {
  const { data: breeder } = await supabase
    .from("breeder_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!breeder) return null;

  const [litterRows, dogsRows, reviewRows, allBreedsRows] = await Promise.all([
    supabase
      .from("litters")
      .select(`
        *,
        mother:breeding_dogs!mother_id(id, name, call_name, affisso, photo_url, sex, breed_id, color, titles, health_screenings, pedigree_number),
        father:breeding_dogs!father_id(id, name, call_name, affisso, photo_url, sex, breed_id, color, titles, health_screenings, pedigree_number, is_external, external_kennel_name),
        puppies(*)
      `)
      .eq("breeder_id", breeder.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("breeding_dogs")
      .select("*")
      .eq("breeder_id", breeder.id)
      .order("sort_order"),
    supabase
      .from("reviews")
      .select("id, rating, title, content, created_at, author:profiles(full_name)")
      .eq("breeder_id", breeder.id)
      .eq("is_approved", true)
      .order("created_at", { ascending: false }),
    supabase.from("breeds").select("id, name_it, slug, is_working_breed").order("name_it"),
  ]);

  const allBreeds = (allBreedsRows.data ?? []) as { id: string; name_it: string; slug: string; is_working_breed: boolean }[];
  const resolvedBreeds = (breeder.breed_ids ?? [])
    .map((bid: string) => allBreeds.find((b) => b.id === bid))
    .filter(Boolean) as { id: string; name_it: string; slug: string }[];

  return {
    breeder,
    breeds: resolvedBreeds,
    allBreeds,
    litters: (litterRows.data ?? []),
    breedingDogs: (dogsRows.data ?? []),
    reviews: (reviewRows.data ?? []),
  };
}
