"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";

interface ReviewFormProps {
  breederId: string;
  breederName: string;
}

export default function ReviewForm({ breederId, breederName }: ReviewFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!breederId) {
      setError("Questo allevatore non è ancora registrato nel sistema e non può ricevere recensioni.");
      return;
    }
    if (rating === 0) {
      setError("Seleziona una valutazione.");
      return;
    }
    if (!content.trim()) {
      setError("Scrivi il testo della recensione.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ breeder_id: breederId, rating, title, content }),
      });

      if (res.status === 401) {
        setError("Devi essere autenticato per lasciare una recensione.");
        return;
      }
      if (res.status === 409) {
        setError("Hai già scritto una recensione per questo allevatore.");
        return;
      }
      if (!res.ok) {
        setError("Errore nell'invio. Riprova più tardi.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Errore di rete. Riprova più tardi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setRating(0);
    setHoverRating(0);
    setTitle("");
    setContent("");
    setError(null);
    setSuccess(false);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        Scrivi una recensione
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Recensisci {breederName}
                </h2>
                <button
                  onClick={handleClose}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>

            <CardContent>
              {success ? (
                <div className="text-center py-6 space-y-3">
                  <div className="text-4xl">🎉</div>
                  <p className="font-semibold text-lg">Recensione inviata!</p>
                  <p className="text-sm text-muted-foreground">
                    La tua recensione è in attesa di approvazione da parte degli
                    amministratori. Grazie per il tuo contributo!
                  </p>
                  <Button onClick={handleClose} className="mt-2">
                    Chiudi
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Stelle */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Valutazione <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-8 w-8 transition-colors ${
                              star <= (hoverRating || rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {rating > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {["", "Pessimo", "Scarso", "Nella media", "Buono", "Eccellente"][rating]}
                      </p>
                    )}
                  </div>

                  {/* Titolo */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Titolo (opzionale)
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Es. Esperienza fantastica!"
                      maxLength={100}
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Testo */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      La tua recensione <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Descrivi la tua esperienza con questo allevatore..."
                      rows={4}
                      maxLength={1000}
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                    <p className="text-xs text-muted-foreground text-right mt-1">
                      {content.length}/1000
                    </p>
                  </div>

                  {error && (
                    <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {error}
                    </p>
                  )}

                  <div className="flex gap-3 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={handleClose}
                    >
                      Annulla
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Invio in corso..." : "Invia recensione"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
