import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region");
  const breed = searchParams.get("breed");
  const search = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const sort = searchParams.get("sort") || "rating";

  try {
    const supabase = await createClient();
    let query = supabase
      .from("breeder_profiles")
      .select("*, profile:profiles(*)", { count: "exact" })
      .eq("is_approved", true);

    if (region) query = query.eq("region", region);
    if (breed) query = query.contains("breed_ids", [breed]);
    if (search) query = query.ilike("kennel_name", `%${search}%`);

    if (sort === "rating") {
      query = query.order("average_rating", { ascending: false });
    } else if (sort === "newest") {
      query = query.order("created_at", { ascending: false });
    } else if (sort === "reviews") {
      query = query.order("review_count", { ascending: false });
    }

    // Premium breeders first
    query = query.order("is_premium", { ascending: false });

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      breeders: data,
      total: count,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch {
    return NextResponse.json({ error: "Errore nel caricamento" }, { status: 500 });
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
    const { data, error } = await supabase
      .from("breeder_profiles")
      .insert({
        user_id: user.id,
        ...body,
        is_approved: false,
        is_premium: false,
      })
      .select()
      .single();

    if (error) throw error;

    // Update user role to breeder
    await supabase
      .from("profiles")
      .update({ role: "breeder" })
      .eq("id", user.id);

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Errore nella creazione" }, { status: 500 });
  }
}
