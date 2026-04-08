import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const breederId = searchParams.get("breeder_id");

  try {
    const supabase = await createClient();
    let query = supabase
      .from("litters")
      .select(`
        *,
        mother:breeding_dogs!mother_id(id, name, call_name, affisso, photo_url, sex, breed_id, color, titles, health_screenings, pedigree_number),
        father:breeding_dogs!father_id(id, name, call_name, affisso, photo_url, sex, breed_id, color, titles, health_screenings, pedigree_number, is_external, external_kennel_name),
        puppies(*)
      `)
      .order("created_at", { ascending: false });

    if (breederId) query = query.eq("breeder_id", breederId);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Errore nel caricamento cucciolate" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { data: breeder } = await supabase
      .from("breeder_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!breeder) {
      return NextResponse.json({ error: "Profilo allevatore non trovato" }, { status: 403 });
    }

    const { puppies: puppiesData, ...litterBody } = await request.json();

    // Insert litter
    const { data: litter, error: litterError } = await supabase
      .from("litters")
      .insert({
        breeder_id: breeder.id,
        ...litterBody,
      })
      .select()
      .single();

    if (litterError) throw litterError;

    // Insert puppies if provided
    let puppies: unknown[] = [];
    if (puppiesData && Array.isArray(puppiesData) && puppiesData.length > 0) {
      const puppyRows = puppiesData.map((p: Record<string, unknown>, i: number) => ({
        litter_id: litter.id,
        ...p,
        sort_order: i,
      }));

      const { data: insertedPuppies, error: puppyError } = await supabase
        .from("puppies")
        .insert(puppyRows)
        .select();

      if (puppyError) throw puppyError;
      puppies = insertedPuppies ?? [];
    }

    return NextResponse.json({ ...litter, puppies }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Errore nella creazione cucciolata" }, { status: 500 });
  }
}
