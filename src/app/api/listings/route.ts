import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const breederId = searchParams.get("breeder_id");
  const breedId = searchParams.get("breed_id");
  const status = searchParams.get("status") || "attivo";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");

  try {
    const supabase = await createClient();
    let query = supabase
      .from("listings")
      .select("*, breed:breeds(*), breeder:breeder_profiles(kennel_name, slug)", { count: "exact" })
      .eq("status", status);

    if (breederId) query = query.eq("breeder_id", breederId);
    if (breedId) query = query.eq("breed_id", breedId);

    query = query
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      listings: data,
      total: count,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch {
    return NextResponse.json({ error: "Errore nel caricamento annunci" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    // Get breeder profile
    const { data: breeder } = await supabase
      .from("breeder_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!breeder) {
      return NextResponse.json({ error: "Profilo allevatore non trovato" }, { status: 403 });
    }

    const body = await request.json();
    const { data, error } = await supabase
      .from("listings")
      .insert({
        breeder_id: breeder.id,
        ...body,
        status: "attivo",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Errore nella creazione annuncio" }, { status: 500 });
  }
}
