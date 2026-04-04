import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ breeds: [], breeders: [] });

  const supabase = await createClient();

  const [{ data: breeds }, { data: breeders }] = await Promise.all([
    supabase
      .from("breeds")
      .select("name_it, slug")
      .ilike("name_it", `%${q}%`)
      .order("name_it")
      .limit(6),
    supabase
      .from("breeder_profiles")
      .select("kennel_name, slug")
      .eq("is_approved", true)
      .ilike("kennel_name", `%${q}%`)
      .order("kennel_name")
      .limit(4),
  ]);

  return NextResponse.json({ breeds: breeds ?? [], breeders: breeders ?? [] });
}
