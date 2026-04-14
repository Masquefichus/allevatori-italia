"use client";

import { useState, useEffect } from "react";
import Card, { CardContent } from "@/components/ui/Card";
import Rating from "@/components/ui/Rating";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  is_approved: boolean;
  created_at: string;
  author: { full_name: string | null } | null;
}

export default function RecensioniPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();
    if (!supabase) return;

    // Get breeder profile first, then fetch reviews
    (supabase as any)
      .from("breeder_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()
      .then(({ data: breeder }: { data: { id: string } | null }) => {
        if (!breeder) { setLoading(false); return; }

        return (supabase as any)
          .from("reviews")
          .select("id, rating, title, content, is_approved, created_at, author:profiles(full_name)")
          .eq("breeder_id", breeder.id)
          .order("created_at", { ascending: false });
      })
      .then((res: { data: Review[] | null } | undefined) => {
        if (res?.data) setReviews(res.data);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const avgRating = reviews.length
    ? reviews.filter((r) => r.is_approved).reduce((sum, r) => sum + r.rating, 0) /
      (reviews.filter((r) => r.is_approved).length || 1)
    : 0;

  const approved = reviews.filter((r) => r.is_approved);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Recensioni</h1>
          <p className="text-muted-foreground">Le recensioni ricevute dai tuoi clienti</p>
        </div>
        <div className="text-center py-12 text-muted-foreground">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recensioni</h1>
        <p className="text-muted-foreground">Le recensioni ricevute dai tuoi clienti</p>
      </div>

      {/* Summary */}
      {reviews.length > 0 && (
        <Card>
          <CardContent className="py-6 flex items-center gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold">{approved.length ? avgRating.toFixed(1) : "—"}</div>
              {approved.length > 0 && <Rating value={avgRating} size="sm" />}
              <p className="text-sm text-muted-foreground mt-1">
                {approved.length} approvate · {reviews.length - approved.length} in attesa
              </p>
            </div>
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = approved.filter((r) => r.rating === stars).length;
                const pct = approved.length ? (count / approved.length) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-2 text-sm">
                    <span className="w-3">{stars}</span>
                    <span className="text-yellow-400 text-xs">★</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-xs text-muted-foreground text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nessuna recensione ricevuta ancora.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-sm font-semibold text-primary-dark">
                      {(review.author?.full_name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {review.author?.full_name ?? "Utente"}
                        </span>
                        {!review.is_approved && (
                          <Badge variant="secondary">In attesa di approvazione</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString("it-IT")}
                      </p>
                    </div>
                  </div>
                  <Rating value={review.rating} size="sm" />
                </div>
                {review.title && (
                  <h3 className="font-medium text-sm mb-1">{review.title}</h3>
                )}
                {review.content && (
                  <p className="text-sm text-muted-foreground">{review.content}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
