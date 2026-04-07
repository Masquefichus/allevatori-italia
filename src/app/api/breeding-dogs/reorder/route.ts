import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { ids } = await request.json() as { ids: string[] };
    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: "ids array richiesto" }, { status: 400 });
    }

    // Update sort_order for each dog
    for (let i = 0; i < ids.length; i++) {
      await supabase
        .from("breeding_dogs")
        .update({ sort_order: i })
        .eq("id", ids[i]);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Errore nel riordinamento" }, { status: 500 });
  }
}
