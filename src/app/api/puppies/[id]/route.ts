import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("puppies")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Cucciolo non trovato" }, { status: 404 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

    // Verify ownership via litter (puppies don't have a direct breeder_id)
    const { data: puppy } = await supabase
      .from("puppies")
      .select("litter_id")
      .eq("id", id)
      .single();

    if (!puppy) {
      return NextResponse.json({ error: "Cucciolo non trovato" }, { status: 404 });
    }

    const { count } = await supabase
      .from("litters")
      .select("id", { count: "exact", head: true })
      .eq("id", puppy.litter_id)
      .eq("breeder_id", breeder.id);

    if (!count) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const body = await request.json();
    const { data, error } = await supabase
      .from("puppies")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Errore nell'aggiornamento" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

    // Verify ownership via litter (puppies don't have a direct breeder_id)
    const { data: puppy } = await supabase
      .from("puppies")
      .select("litter_id")
      .eq("id", id)
      .single();

    if (!puppy) {
      return NextResponse.json({ error: "Cucciolo non trovato" }, { status: 404 });
    }

    const { count } = await supabase
      .from("litters")
      .select("id", { count: "exact", head: true })
      .eq("id", puppy.litter_id)
      .eq("breeder_id", breeder.id);

    if (!count) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const { error } = await supabase
      .from("puppies")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Errore nell'eliminazione" }, { status: 500 });
  }
}
