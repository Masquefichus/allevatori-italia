import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const breederId = searchParams.get("breeder_id");

  try {
    const supabase = await createClient();
    let query = supabase
      .from("breeding_dogs")
      .select("*, breed:breeds(id, name_it, slug)")
      .order("sort_order");

    if (breederId) query = query.eq("breeder_id", breederId);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Errore nel caricamento riproduttori" }, { status: 500 });
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

    const body = await request.json();

    // Get next sort_order
    const { data: lastDog } = await supabase
      .from("breeding_dogs")
      .select("sort_order")
      .eq("breeder_id", breeder.id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (lastDog?.sort_order ?? -1) + 1;

    const { data, error } = await supabase
      .from("breeding_dogs")
      .insert({
        breeder_id: breeder.id,
        ...body,
        sort_order: nextOrder,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Errore nella creazione riproduttore" }, { status: 500 });
  }
}
