import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

    const admin = createAdminClient();

    const [
      { count: totalUsers },
      { count: totalBreeders },
      { count: pendingBreeders },
      { count: totalReviews },
      { count: pendingReviews },
      { count: premiumSubs },
    ] = await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("breeder_profiles").select("id", { count: "exact", head: true }),
      admin.from("breeder_profiles").select("id", { count: "exact", head: true }).eq("is_approved", false),
      admin.from("reviews").select("id", { count: "exact", head: true }),
      admin.from("reviews").select("id", { count: "exact", head: true }).eq("is_approved", false),
      admin.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
    ]);

    return NextResponse.json({
      totalUsers: totalUsers ?? 0,
      totalBreeders: totalBreeders ?? 0,
      pendingBreeders: pendingBreeders ?? 0,
      totalReviews: totalReviews ?? 0,
      pendingReviews: pendingReviews ?? 0,
      premiumSubs: premiumSubs ?? 0,
    });
  } catch {
    return NextResponse.json({ error: "Errore" }, { status: 500 });
  }
}
