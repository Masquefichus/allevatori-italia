import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    // Verifica che la richiesta arrivi da un utente autenticato
    const serverSupabase = await createClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { breeder_id } = await request.json();
    if (!breeder_id) {
      return NextResponse.json({ error: "breeder_id mancante" }, { status: 400 });
    }

    // Usa il client admin (service role) per aggirare RLS
    const admin = createAdminClient();

    // Calcola media e conteggio dalle recensioni approvate
    const { data: reviews, error } = await admin
      .from("reviews")
      .select("rating")
      .eq("breeder_id", breeder_id)
      .eq("is_approved", true);

    if (error) throw error;

    const count = reviews?.length ?? 0;
    const avg = count > 0
      ? Math.round((reviews!.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
      : 0;

    await admin
      .from("breeder_profiles")
      .update({ review_count: count, average_rating: avg })
      .eq("id", breeder_id);

    return NextResponse.json({ review_count: count, average_rating: avg });
  } catch (err) {
    console.error("Stats update error:", err);
    return NextResponse.json({ error: "Errore aggiornamento statistiche" }, { status: 500 });
  }
}
