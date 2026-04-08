import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const litterId = searchParams.get("litter_id");

  try {
    const supabase = await createClient();
    let query = supabase
      .from("puppies")
      .select("*")
      .order("sort_order");

    if (litterId) query = query.eq("litter_id", litterId);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Errore nel caricamento cuccioli" }, { status: 500 });
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

    // Get next sort_order
    const { data: lastPuppy } = await supabase
      .from("puppies")
      .select("sort_order")
      .eq("litter_id", body.litter_id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (lastPuppy?.sort_order ?? -1) + 1;

    const { data, error } = await supabase
      .from("puppies")
      .insert({
        ...body,
        sort_order: nextOrder,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Errore nella creazione cucciolo" }, { status: 500 });
  }
}
