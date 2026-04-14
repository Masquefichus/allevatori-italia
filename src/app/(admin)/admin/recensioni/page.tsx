"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Rating from "@/components/ui/Rating";
import { Search, CheckCircle, Trash2, Flag } from "lucide-react";

type ReviewFilter = "pending" | "approved" | "reported";

interface Review {
  id: string;
  rating: number;
  content: string | null;
  is_approved: boolean;
  is_reported: boolean;
  created_at: string;
  author: { full_name: string | null } | null;
  breeder: { kennel_name: string; slug: string } | null;
}

export default function AdminRecensioniPage() {
  const [filter, setFilter] = useState<ReviewFilter>("pending");
  const [search, setSearch] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportedCount, setReportedCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/reviews?status=${filter}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    fetch("/api/admin/reviews?status=reported")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setReportedCount(Array.isArray(data) ? data.length : 0));
  }, []);

  const filtered = reviews.filter((r) => {
    if (!search) return true;
    const authorName = r.author?.full_name ?? "";
    const breederName = r.breeder?.kennel_name ?? "";
    return (
      authorName.toLowerCase().includes(search.toLowerCase()) ||
      breederName.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleAction = async (review_id: string, action: "approve" | "delete") => {
    const r = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review_id, action }),
    });
    if (r.ok) {
      setReviews((prev) => prev.filter((rev) => rev.id !== review_id));
      // Refresh reported count
      fetch("/api/admin/reviews?status=reported")
        .then((r) => r.ok ? r.json() : [])
        .then((data) => setReportedCount(Array.isArray(data) ? data.length : 0));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Moderazione Recensioni</h1>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cerca per autore o allevatore..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          {(["pending", "reported", "approved"] as ReviewFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === s
                  ? "bg-primary text-white"
                  : "bg-white border border-border hover:bg-muted"
              }`}
            >
              {s === "pending" ? "Da moderare" : s === "reported" ? "Segnalate" : "Approvate"}
              {s === "reported" && reportedCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {reportedCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Caricamento...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nessuna recensione trovata.
          </div>
        ) : (
          filtered.map((review) => (
            <Card key={review.id}>
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{review.author?.full_name ?? "Utente"}</span>
                      <span className="text-muted-foreground">&rarr;</span>
                      <span className="font-medium">{review.breeder?.kennel_name ?? "—"}</span>
                      {review.is_reported && (
                        <Badge variant="destructive" className="gap-1">
                          <Flag className="h-3 w-3" />
                          Segnalata
                        </Badge>
                      )}
                      {review.is_approved && (
                        <Badge variant="success">Approvata</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Rating value={review.rating} readonly size="sm" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString("it-IT")}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{review.content}</p>
                <div className="flex gap-2 pt-2 border-t border-border">
                  {!review.is_approved && (
                    <Button size="sm" className="gap-1" onClick={() => handleAction(review.id, "approve")}>
                      <CheckCircle className="h-4 w-4" />
                      Approva
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleAction(review.id, "delete")}>
                    <Trash2 className="h-4 w-4" />
                    Elimina
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
