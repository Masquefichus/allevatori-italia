"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: { full_name: string } | null;
}

interface ChatInlineProps {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  currentUserId: string;
  onClose: () => void;
}

export default function ChatInline({
  conversationId,
  otherUserName,
  currentUserId,
  onClose,
}: ChatInlineProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMessages = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, content, created_at, sender:profiles(full_name)")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data as unknown as Message[]);
      // Marca come letti via API (RLS non ha policy UPDATE sui messaggi)
      fetch("/api/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, userId: currentUserId }),
      }).catch(() => {});
    }
    setLoading(false);
  }, [conversationId, currentUserId]);

  useEffect(() => {
    loadMessages();
    pollRef.current = setInterval(loadMessages, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadMessages]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100);
  }, []);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const content = text.trim();
    setText("");
    setSending(true);
    const supabase = createClient();
    if (!supabase) { setSending(false); return; }
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
    });
    await supabase.from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);
    await loadMessages();
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    if (isToday) return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" }) +
      " " + d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="border border-border rounded-2xl overflow-hidden shadow-md bg-white flex flex-col h-[480px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
            {otherUserName.charAt(0).toUpperCase()}
          </div>
          <p className="font-semibold text-sm">{otherUserName}</p>
        </div>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messaggi */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">Nessun messaggio ancora.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId;
            const senderName = isMine
              ? "Tu"
              : ((msg.sender as { full_name: string } | null)?.full_name ?? otherUserName);
            return (
              <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                <span className="text-[10px] text-muted-foreground mb-0.5 px-1 font-medium">
                  {senderName}
                </span>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                  isMine
                    ? "bg-primary text-white rounded-br-sm"
                    : "bg-white text-foreground rounded-bl-sm shadow-sm border border-border"
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? "text-white/60 text-right" : "text-muted-foreground"}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-border bg-white shrink-0 flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scrivi un messaggio... (Invio per inviare)"
          rows={1}
          className="flex-1 resize-none rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary max-h-24 overflow-y-auto"
          style={{ minHeight: "40px" }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
