"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Loader2, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: { full_name: string };
}

interface ChatModalProps {
  breederUserId: string;
  breederName: string;
}

export default function ChatModal({ breederUserId, breederName }: ChatModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) { setIsLoggedIn(false); return; }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = useCallback(async (convId: string, supabase: NonNullable<ReturnType<typeof createClient>>) => {
    const { data, error } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, content, created_at, sender:profiles(full_name)")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data as unknown as Message[]);
    }
  }, []);

  const initChat = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    if (!supabase) { setError("Errore configurazione."); setLoading(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setNotLoggedIn(true); setLoading(false); return; }
    currentUserIdRef.current = user.id;
    setCurrentUserId(user.id);

    // Cerca conversazione esistente tra i due utenti
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(
        `and(participant_1.eq.${user.id},participant_2.eq.${breederUserId}),` +
        `and(participant_1.eq.${breederUserId},participant_2.eq.${user.id})`
      )
      .maybeSingle();

    let convId: string;

    if (existing) {
      convId = existing.id;
    } else {
      // Crea nuova conversazione
      const { data: newConv, error: convErr } = await supabase
        .from("conversations")
        .insert({ participant_1: user.id, participant_2: breederUserId })
        .select("id")
        .single();

      if (convErr || !newConv) {
        setError("Impossibile aprire la chat. Riprova più tardi.");
        setLoading(false);
        return;
      }
      convId = newConv.id;
    }

    setConversationId(convId);
    await loadMessages(convId, supabase);
    setLoading(false);
  }, [breederUserId, loadMessages]);

  // Avvia polling ogni 3 secondi quando la chat è aperta
  useEffect(() => {
    if (!isOpen || !conversationId) return;

    const supabase = createClient();
    if (!supabase) return;

    pollRef.current = setInterval(() => {
      loadMessages(conversationId, supabase);
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isOpen, conversationId, loadMessages]);

  // Scroll in fondo a ogni nuovo messaggio
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus sull'input quando si apre
  useEffect(() => {
    if (isOpen && !loading) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, loading]);

  const handleOpen = () => {
    setIsOpen(true);
    if (!conversationId) initChat();
  };

  const handleClose = () => {
    setIsOpen(false);
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const handleSend = async () => {
    if (!text.trim() || !conversationId || sending) return;

    const supabase = createClient();
    if (!supabase) return;

    const content = text.trim();
    setText("");
    setSending(true);

    const { error: sendErr } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: currentUserId!, content });

    if (sendErr) {
      setError("Errore nell'invio. Riprova.");
      setText(content); // Ripristina il testo
    } else {
      // Aggiorna last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);

      await loadMessages(conversationId, supabase);
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    if (isToday) return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" }) +
      " " + d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  };

  // Caricamento auth — non mostrare nulla
  if (isLoggedIn === null) return null;

  // Non loggato — pulsante che porta al login
  if (!isLoggedIn) {
    return (
      <a
        href="/accedi"
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
      >
        <LogIn className="h-4 w-4" />
        Accedi per inviare un messaggio
      </a>
    );
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleOpen}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
        Invia Messaggio
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
          <div className="w-full sm:w-[420px] h-[85vh] sm:h-[560px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-primary text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-semibold text-sm">
                  {breederName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm">{breederName}</p>
                  <p className="text-xs text-white/70">Allevatore</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-1 rounded-full hover:bg-white/20 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
              {notLoggedIn ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                  <MessageCircle className="h-12 w-12 text-muted-foreground/40" />
                  <p className="font-medium text-sm">Accedi per inviare messaggi</p>
                  <a href="/accedi" className="text-sm text-primary underline">Vai al login</a>
                </div>
              ) : loading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="h-full flex items-center justify-center text-center">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-2">
                  <MessageCircle className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    Inizia la conversazione con <strong>{breederName}</strong>
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === (currentUserIdRef.current ?? currentUserId);
                  const senderName = isMine
                    ? "Tu"
                    : ((msg.sender as { full_name: string } | null)?.full_name ?? breederName);
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
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            {!notLoggedIn && !loading && (
              <div className="px-3 py-3 border-t border-border bg-white shrink-0 flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Scrivi un messaggio... (Invio per inviare)"
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary max-h-28 overflow-y-auto"
                  style={{ minHeight: "40px" }}
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || sending}
                  className="shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors"
                >
                  {sending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Send className="h-4 w-4" />
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
