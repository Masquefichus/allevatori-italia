import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { slugify } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region");
  const specialization = searchParams.get("specialization");
  const emergency = searchParams.get("emergency");
  const houseVisits = searchParams.get("house_visits");
  const search = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");

  try {
    const supabase = await createClient();
    let query = supabase
      .from("vet_profiles")
      .select("*", { count: "exact" })
      .eq("is_approved", true);

    if (region) query = query.eq("region", region);
    if (specialization) query = query.contains("specializations", [specialization]);
    if (emergency === "true") query = query.eq("emergency_available", true);
    if (houseVisits === "true") query = query.eq("house_visits", true);
    if (search) query = query.ilike("name", `%${search}%`);

    query = query.order("created_at", { ascending: false });

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      vets: data,
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type, full_name")
      .eq("id", user.id)
      .single();

    if (profile?.account_type !== "vet") {
      return NextResponse.json(
        { error: "Solo gli account veterinari possono creare un profilo veterinario" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const baseName = body.name?.trim() || profile.full_name || "Veterinario";
    const baseSlug = slugify(baseName);

    const { data: existing } = await supabase
      .from("vet_profiles")
      .select("id")
      .eq("slug", baseSlug)
      .maybeSingle();
    const finalSlug = existing ? `${baseSlug}-${user.id.slice(0, 8)}` : baseSlug;

    const { data, error } = await supabase
      .from("vet_profiles")
      .insert({
        user_id: user.id,
        name: baseName,
        slug: finalSlug,
        ...body,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Errore nella creazione" }, { status: 500 });
  }
}
