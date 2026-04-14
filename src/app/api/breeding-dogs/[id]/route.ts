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
      .from("breeding_dogs")
      .select("*, breed:breeds(id, name_it, slug)")
      .eq("id", id)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Riproduttore non trovato" }, { status: 404 });
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

    const body = await request.json();
    const { data, error } = await supabase
      .from("breeding_dogs")
      .update(body)
      .eq("id", id)
      .eq("breeder_id", breeder.id)
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

    const { error } = await supabase
      .from("breeding_dogs")
      .delete()
      .eq("id", id)
      .eq("breeder_id", breeder.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Errore nell'eliminazione" }, { status: 500 });
  }
}
