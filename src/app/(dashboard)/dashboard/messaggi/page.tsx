"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageCircle, Search, Loader2 } from "lucide-react";
import Card from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import ChatInline from "@/components/chat/ChatInline";

interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string | null;
  other_user_id: string;
  other_user_name: string;
  last_message: string;
  last_message_is_mine: boolean;
  unread: boolean;
}

export default function MessaggiPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filtered, setFiltered] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeOtherUserId, setActiveOtherUserId] = useState<string | null>(null);
  const [activeOtherName, setActiveOtherName] = useState<string>("");

  const loadConversations = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const { data: convRows } = await supabase
      .from("conversations")
      .select("id, participant_1, participant_2, last_message_at")
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (!convRows || convRows.length === 0) { setLoading(false); return; }

    const enriched: Conversation[] = await Promise.all(
      convRows.map(async (conv) => {
        const otherId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;

        const [{ data: profile }, { data: lastMsgArr }, { count: unreadCount }] = await Promise.all([
          supabase.from("profiles").select("full_name").eq("id", otherId).single(),
          supabase.from("messages").select("content, sender_id").eq("conversation_id", conv.id)
            .order("created_at", { ascending: false }).limit(1),
          supabase.from("messages").select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id).eq("is_read", false).neq("sender_id", user.id),
        ]);

        const lastMsg = lastMsgArr?.[0];
        const otherName = profile?.full_name ?? "Utente";
        return {
          id: conv.id,
          participant_1: conv.participant_1,
          participant_2: conv.participant_2,
          last_message_at: conv.last_message_at,
          other_user_id: otherId,
          other_user_name: otherName,
          last_message: lastMsg?.content ?? "Nessun messaggio",
          last_message_is_mine: lastMsg?.sender_id === user.id,
          unread: (unreadCount ?? 0) > 0,
        };
      })
    );

    setConversations(enriched);
    setFiltered(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(conversations); return; }
    const q = search.toLowerCase();
    setFiltered(conversations.filter(c =>
      c.other_user_name.toLowerCase().includes(q) ||
      c.last_message.toLowerCase().includes(q)
    ));
  }, [search, conversations]);

  const openConversation = (conv: Conversation) => {
    setActiveConvId(conv.id);
    setActiveOtherUserId(conv.other_user_id);
    setActiveOtherName(conv.other_user_name);
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    if (diffH < 1) return "Adesso";
    if (diffH < 24) return `${diffH}h fa`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return "Ieri";
    if (diffD < 7) return `${diffD} giorni fa`;
    return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Messaggi</h1>
        <p className="text-muted-foreground">Le tue conversazioni private</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cerca conversazioni..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium mb-1">Nessun messaggio</h3>
          <p className="text-sm text-muted-foreground">
            Le conversazioni appariranno qui
          </p>
        </div>
      ) : (
        <Card>
          <div className="divide-y divide-border">
            {filtered.map((conv) => (
              <button
                key={conv.id}
                onClick={() => openConversation(conv)}
                className={`w-full flex items-start gap-3 p-4 hover:bg-muted transition-colors text-left ${
                  activeConvId === conv.id ? "bg-primary-light" : ""
                }`}
              >
                <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-sm font-semibold text-primary-dark shrink-0">
                  {conv.other_user_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      {conv.other_user_name}
                      {conv.unread && <span className="w-2 h-2 bg-primary rounded-full inline-block" />}
                    </h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTime(conv.last_message_at)}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${conv.unread ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                    {conv.last_message_is_mine ? "Tu: " : `${conv.other_user_name}: `}{conv.last_message}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Chat inline aperta quando si seleziona una conversazione */}
      {activeConvId && activeOtherUserId && currentUserId && (
        <ChatInline
          conversationId={activeConvId}
          otherUserId={activeOtherUserId}
          otherUserName={activeOtherName}
          currentUserId={currentUserId}
          onClose={() => { setActiveConvId(null); loadConversations(); }}
        />
      )}
    </div>
  );
}
