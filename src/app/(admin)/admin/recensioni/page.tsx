"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Rating from "@/components/ui/Rating";
import { Search, CheckCircle, Trash2, Flag } from "lucide-react";

type ReviewFilter = "pending" | "approved" | "reported";

const demoReviews = [
  { id: "1", author: "Sara T.", breeder: "Allevamento Del Sole", rating: 5, content: "Allevatore serio e professionale. Il cucciolo è arrivato sano e con tutti i documenti in regola.", is_approved: false, is_reported: false, date: "2026-03-18" },
  { id: "2", author: "Paolo G.", breeder: "Casa dei Molossi", rating: 2, content: "Esperienza negativa. Il cucciolo aveva problemi di salute non dichiarati.", is_approved: false, is_reported: false, date: "2026-03-17" },
  { id: "3", author: "Chiara L.", breeder: "Lagotto dei Colli", rating: 4, content: "Buon allevatore, cucciolo bellissimo. Unica pecca i tempi di risposta ai messaggi.", is_approved: false, is_reported: false, date: "2026-03-15" },
  { id: "4", author: "Marco R.", breeder: "Villa dei Labrador", rating: 1, content: "Recensione sospetta con contenuti inappropriati.", is_approved: false, is_reported: true, date: "2026-03-14" },
  { id: "5", author: "Anna B.", breeder: "Cuccioli d'Oro", rating: 5, content: "Eccellente! Torneremo sicuramente.", is_approved: true, is_reported: false, date: "2026-03-10" },
];

export default function AdminRecensioniPage() {
  const [filter, setFilter] = useState<ReviewFilter>("pending");
  const [search, setSearch] = useState("");

  const filtered = demoReviews.filter((r) => {
    if (filter === "pending" && (r.is_approved || r.is_reported)) return false;
    if (filter === "approved" && !r.is_approved) return false;
    if (filter === "reported" && !r.is_reported) return false;
    if (search && !r.author.toLowerCase().includes(search.toLowerCase()) && !r.breeder.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
              {s === "reported" && (
                <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {demoReviews.filter((r) => r.is_reported).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((review) => (
          <Card key={review.id}>
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{review.author}</span>
                    <span className="text-muted-foreground">&rarr;</span>
                    <span className="font-medium">{review.breeder}</span>
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
                    <span className="text-xs text-muted-foreground">{review.date}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{review.content}</p>
              <div className="flex gap-2 pt-2 border-t border-border">
                {!review.is_approved && (
                  <Button size="sm" className="gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Approva
                  </Button>
                )}
                <Button size="sm" variant="destructive" className="gap-1">
                  <Trash2 className="h-4 w-4" />
                  Elimina
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Nessuna recensione trovata.
          </div>
        )}
      </div>
    </div>
  );
}
