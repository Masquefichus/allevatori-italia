import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Get messages for a conversation
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    // Verify user is participant
    const { data: conv } = await supabase
      .from("conversations")
      .select("participant_1, participant_2")
      .eq("id", conversationId)
      .single();

    if (!conv || (conv.participant_1 !== user.id && conv.participant_2 !== user.id)) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("messages")
      .select("*, sender:profiles(full_name, avatar_url)")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Mark unread messages as read
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id)
      .eq("is_read", false);

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Errore nel caricamento messaggi" }, { status: 500 });
  }
}

// Send a message in conversation
export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { content } = await request.json();

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
      })
      .select("*, sender:profiles(full_name, avatar_url)")
      .single();

    if (error) throw error;

    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Errore nell'invio messaggio" }, { status: 500 });
  }
}
