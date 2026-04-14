import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
  return data?.role === "admin";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const role = searchParams.get("role") ?? "";

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    if (!(await verifyAdmin(supabase, user.id))) {
      return NextResponse.json({ error: "Accesso negato" }, { status: 403 });
    }

    const admin = createAdminClient();

    let query = admin
      .from("profiles")
      .select("id, full_name, role, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (role) query = query.eq("role", role);
    if (search) query = query.ilike("full_name", `%${search}%`);

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

    const { user_id, role } = await request.json();

    if (!["user", "breeder", "admin"].includes(role)) {
      return NextResponse.json({ error: "Ruolo non valido" }, { status: 400 });
    }

    // Prevent self-demotion
    if (user_id === user.id) {
      return NextResponse.json({ error: "Non puoi modificare il tuo stesso ruolo" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from("profiles").update({ role }).eq("id", user_id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Errore" }, { status: 500 });
  }
}
