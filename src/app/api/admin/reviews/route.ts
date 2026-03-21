import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data?.role === "admin";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

    if (!(await verifyAdmin(supabase, user.id))) {
      return NextResponse.json({ error: "Accesso negato" }, { status: 403 });
    }

    let query = supabase
      .from("reviews")
      .select("*, author:profiles(*), breeder:breeder_profiles(kennel_name, slug)");

    if (status === "pending") {
      query = query.eq("is_approved", false).eq("is_reported", false);
    } else if (status === "approved") {
      query = query.eq("is_approved", true);
    } else if (status === "reported") {
      query = query.eq("is_reported", true);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Errore" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

    if (!(await verifyAdmin(supabase, user.id))) {
      return NextResponse.json({ error: "Accesso negato" }, { status: 403 });
    }

    const { review_id, action } = await request.json();

    if (action === "delete") {
      const { error } = await supabase.from("reviews").delete().eq("id", review_id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    const updateData = action === "approve"
      ? { is_approved: true, is_reported: false }
      : { is_approved: false };

    const { error } = await supabase
      .from("reviews")
      .update(updateData)
      .eq("id", review_id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Errore" }, { status: 500 });
  }
}
