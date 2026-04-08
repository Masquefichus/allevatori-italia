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
      .from("litters")
      .select(`
        *,
        mother:breeding_dogs!mother_id(id, name, call_name, affisso, photo_url, sex, breed_id, color, titles, health_screenings, pedigree_number),
        father:breeding_dogs!father_id(id, name, call_name, affisso, photo_url, sex, breed_id, color, titles, health_screenings, pedigree_number, is_external, external_kennel_name),
        puppies(*)
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Cucciolata non trovata" }, { status: 404 });
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

    const { puppies: puppiesData, ...litterBody } = await request.json();

    // Update litter fields
    const { data: litter, error: litterError } = await supabase
      .from("litters")
      .update(litterBody)
      .eq("id", id)
      .select()
      .single();

    if (litterError) throw litterError;

    // Handle puppies if provided
    if (puppiesData && Array.isArray(puppiesData)) {
      // Get existing puppy IDs
      const { data: existingPuppies } = await supabase
        .from("puppies")
        .select("id")
        .eq("litter_id", id);

      const existingIds = new Set((existingPuppies ?? []).map((p) => p.id));
      const incomingIds = new Set(puppiesData.filter((p: { id?: string }) => p.id).map((p: { id: string }) => p.id));

      // Delete removed puppies
      const toDelete = [...existingIds].filter((pid) => !incomingIds.has(pid));
      if (toDelete.length > 0) {
        await supabase.from("puppies").delete().in("id", toDelete);
      }

      // Upsert puppies
      for (let i = 0; i < puppiesData.length; i++) {
        const p = puppiesData[i];
        if (p.id && existingIds.has(p.id)) {
          // Update existing
          const { id: _pid, litter_id: _lid, created_at: _ca, updated_at: _ua, ...updateFields } = p;
          await supabase.from("puppies").update({ ...updateFields, sort_order: i }).eq("id", p.id);
        } else {
          // Insert new
          const { id: _pid, ...insertFields } = p;
          await supabase.from("puppies").insert({ ...insertFields, litter_id: id, sort_order: i });
        }
      }
    }

    // Return updated litter with puppies
    const { data: result } = await supabase
      .from("litters")
      .select(`
        *,
        mother:breeding_dogs!mother_id(id, name, call_name, affisso, photo_url, sex, breed_id, color, titles, health_screenings, pedigree_number),
        father:breeding_dogs!father_id(id, name, call_name, affisso, photo_url, sex, breed_id, color, titles, health_screenings, pedigree_number, is_external, external_kennel_name),
        puppies(*)
      `)
      .eq("id", id)
      .single();

    return NextResponse.json(result);
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

    const { error } = await supabase
      .from("litters")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Errore nell'eliminazione" }, { status: 500 });
  }
}
