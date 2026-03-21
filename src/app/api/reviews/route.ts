import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const breederId = searchParams.get("breeder_id");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  try {
    const supabase = await createClient();
    let query = supabase
      .from("reviews")
      .select("*, author:profiles(*)", { count: "exact" })
      .eq("is_approved", true);

    if (breederId) query = query.eq("breeder_id", breederId);

    query = query.order("created_at", { ascending: false });

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      reviews: data,
      total: count,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch {
    return NextResponse.json({ error: "Errore nel caricamento recensioni" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const body = await request.json();

    // Check if user already reviewed this breeder
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("breeder_id", body.breeder_id)
      .eq("author_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Hai già scritto una recensione per questo allevatore" },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        breeder_id: body.breeder_id,
        author_id: user.id,
        rating: body.rating,
        title: body.title,
        content: body.content,
        is_approved: false, // Requires admin moderation
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Errore nell'invio recensione" }, { status: 500 });
  }
}
