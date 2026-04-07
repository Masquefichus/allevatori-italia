import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/messages/read  { conversationId }
// Marca come letti tutti i messaggi non inviati dall'utente corrente.
// Usa l'admin client perché la RLS non ha policy UPDATE per i messaggi.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fallback: leggi il token dal body per il pattern localStorage di questo progetto
  const body = await request.json();
  const { conversationId, userId } = body;

  const currentUserId = user?.id ?? userId;
  if (!currentUserId || !conversationId) {
    return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 });
  }

  // Verifica che l'utente sia partecipante alla conversazione
  const { data: conv } = await supabase
    .from("conversations")
    .select("participant_1, participant_2")
    .eq("id", conversationId)
    .single();

  if (!conv || (conv.participant_1 !== currentUserId && conv.participant_2 !== currentUserId)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const admin = createAdminClient();
  await admin
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", currentUserId)
    .eq("is_read", false);

  return NextResponse.json({ ok: true });
}
