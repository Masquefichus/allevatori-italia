import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
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

    const { ids } = await request.json() as { ids: string[] };
    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: "ids array richiesto" }, { status: 400 });
    }

    // Update sort_order only for dogs belonging to this breeder
    for (let i = 0; i < ids.length; i++) {
      await supabase
        .from("breeding_dogs")
        .update({ sort_order: i })
        .eq("id", ids[i])
        .eq("breeder_id", breeder.id);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Errore nel riordinamento" }, { status: 500 });
  }
}
