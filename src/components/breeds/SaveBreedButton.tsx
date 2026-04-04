"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

interface Props {
  breedSlug: string;
  breedName: string;
}

export default function SaveBreedButton({ breedSlug, breedName }: Props) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    if (!supabase) return;
    (supabase as any)
      .from("breed_favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("breed_slug", breedSlug)
      .maybeSingle()
      .then(({ data }: { data: { id: string } | null }) => setIsSaved(!!data));
  }, [user, breedSlug]);

  async function toggle() {
    if (!user) {
      window.location.href = `/accedi?redirect=/razze/${breedSlug}`;
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    setLoading(true);
    if (isSaved) {
      await (supabase as any)
        .from("breed_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("breed_slug", breedSlug);
      setIsSaved(false);
    } else {
      await (supabase as any)
        .from("breed_favorites")
        .insert({ user_id: user.id, breed_slug: breedSlug, breed_name: breedName });
      setIsSaved(true);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
        isSaved
          ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
          : "border-border bg-white text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Heart className={`h-4 w-4 ${isSaved ? "fill-rose-500 text-rose-500" : ""}`} />
      {isSaved ? "Salvata" : "Salva razza"}
    </button>
  );
}
