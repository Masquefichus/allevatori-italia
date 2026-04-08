"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Conversation, Message } from "@/types/database";

interface EnrichedConversation extends Conversation {
  unread_count: number;
}

export function useMessages() {
  const [conversations, setConversations] = useState<EnrichedConversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const res = await fetch(`/api/messages/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch {
      // ignore
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!activeConversation) return;

    try {
      const res = await fetch(`/api/messages/${activeConversation}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => [...prev, newMsg]);
        fetchConversations(); // refresh conversation list
      }
    } catch {
      // ignore
    }
  }, [activeConversation, fetchConversations]);

  const startConversation = useCallback(async (recipientId: string, message: string, litterId?: string) => {
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_id: recipientId,
          litter_id: litterId,
          message,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveConversation(data.conversation_id);
        fetchConversations();
        fetchMessages(data.conversation_id);
        return data.conversation_id;
      }
    } catch {
      // ignore
    }
    return null;
  }, [fetchConversations, fetchMessages]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!supabase || !activeConversation) return;

    const channel = supabase
      .channel(`messages:${activeConversation}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConversation}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, activeConversation]);

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const openConversation = useCallback((conversationId: string) => {
    setActiveConversation(conversationId);
    fetchMessages(conversationId);
  }, [fetchMessages]);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return {
    conversations,
    messages,
    activeConversation,
    loading,
    totalUnread,
    openConversation,
    sendMessage,
    startConversation,
    fetchConversations,
  };
}
