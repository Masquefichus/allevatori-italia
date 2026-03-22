"use client";

import { useState, useEffect } from "react";
import { Star, X, LogIn } from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";

interface ReviewFormProps {
  breederId: string;
  breederName: string;
}

export default function ReviewForm({ breederId, breederName }: ReviewFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) { setIsLoggedIn(false); return; }
    // getSession usa localStorage — rispecchia lo stato reale del client
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    // Ascolta i cambi di sessione (login/logout in tempo reale)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);
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
      const supabase = createClient();
      if (!supabase) {
        setError("Errore di configurazione. Riprova più tardi.");
        return;
      }

      // Verifica che l'utente sia loggato
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Devi essere autenticato per lasciare una recensione.");
        return;
      }

      // Controlla se ha già recensito questo allevatore
      const { data: existing } = await supabase
        .from("reviews")
        .select("id")
        .eq("breeder_id", breederId)
        .eq("author_id", user.id)
        .maybeSingle();

      if (existing) {
        setError("Hai già scritto una recensione per questo allevatore.");
        return;
      }

      // Inserisce la recensione (auto-approvata)
      const { error: insertError } = await supabase
        .from("reviews")
        .insert({
          breeder_id: breederId,
          author_id: user.id,
          rating,
          title: title || null,
          content,
          is_approved: true,
        });

      if (insertError) {
        if (insertError.message.includes("duplicate key") || insertError.code === "23505") {
          setError("Hai già scritto una recensione per questo allevatore.");
        } else {
          setError(`Errore: ${insertError.message}`);
        }
        return;
      }

      // Aggiorna review_count e average_rating via endpoint server (service role)
      await fetch("/api/reviews/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ breeder_id: breederId }),
      });

      setSuccess(true);
    } catch (err) {
      setError("Errore imprevisto. Riprova più tardi.");
      console.error(err);
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

  // Ancora in caricamento — non mostrare nulla
  if (isLoggedIn === null) return null;

  // Non loggato — mostra pulsante di accesso
  if (!isLoggedIn) {
    return (
      <a
        href="/accedi"
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground hover:bg-muted/80 transition-colors"
      >
        <LogIn className="h-4 w-4 shrink-0" />
        Accedi per recensire
      </a>
    );
  }

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

                  {rating === 0 && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      ⭐ Seleziona almeno una stella per procedere.
                    </p>
                  )}
                  {rating > 0 && !content.trim() && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      ✏️ Scrivi il testo della recensione per procedere.
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
                      disabled={isSubmitting || rating === 0 || !content.trim()}
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
