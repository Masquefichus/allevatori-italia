import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Get conversations for current user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("conversations")
      .select("*, listing:listings(title, breed:breeds(name_it))")
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (error) throw error;

    // Fetch other participant profiles and last messages
    const enriched = await Promise.all(
      (data || []).map(async (conv) => {
        const otherId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;

        const [{ data: otherProfile }, { data: lastMsg }, { count: unreadCount }] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", otherId).single(),
          supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single(),
          supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("is_read", false)
            .neq("sender_id", user.id),
        ]);

        return {
          ...conv,
          other_participant: otherProfile,
          last_message: lastMsg,
          unread_count: unreadCount || 0,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch {
    return NextResponse.json({ error: "Errore nel caricamento messaggi" }, { status: 500 });
  }
}

// Start a new conversation
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { recipient_id, listing_id, message } = await request.json();

    // Check for existing conversation
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(
        `and(participant_1.eq.${user.id},participant_2.eq.${recipient_id}),and(participant_1.eq.${recipient_id},participant_2.eq.${user.id})`
      )
      .single();

    let conversationId: string;

    if (existing) {
      conversationId = existing.id;
    } else {
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .insert({
          participant_1: user.id,
          participant_2: recipient_id,
          listing_id,
        })
        .select()
        .single();

      if (convError) throw convError;
      conversationId = conv.id;
    }

    // Send message
    const { data: msg, error: msgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: message,
      })
      .select()
      .single();

    if (msgError) throw msgError;

    // Update last_message_at
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    return NextResponse.json({ conversation_id: conversationId, message: msg }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Errore nell'invio messaggio" }, { status: 500 });
  }
}
