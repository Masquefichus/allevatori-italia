import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
  return data?.role === "admin";
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    if (!(await verifyAdmin(supabase, user.id))) {
      return NextResponse.json({ error: "Accesso negato" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("breeds")
      .select("id, name_it, name_en, slug, group_fci, size_category, is_italian_breed, origin_country")
      .order("name_it");

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Errore" }, { status: 500 });
  }
}
