import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// DELETE /api/boarding-blocks/[id]
// Solo l'owner del boarding può cancellare il blocco. RLS lo garantisce
// ma facciamo anche un check espicito per restituire 403 leggibile.
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { data: block, error: bErr } = await supabase
    .from("boarding_blocks")
    .select("id, boarding_id, boarding:boarding_profiles!inner(user_id)")
    .eq("id", id)
    .single();
  if (bErr || !block) {
    return NextResponse.json({ error: "Blocco non trovato" }, { status: 404 });
  }
  const ownerId = Array.isArray(block.boarding)
    ? (block.boarding[0] as { user_id: string } | undefined)?.user_id
    : (block.boarding as { user_id: string } | null)?.user_id;
  if (ownerId !== user.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { error } = await supabase.from("boarding_blocks").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
