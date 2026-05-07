"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import Card, { CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface Props {
  boardingId: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function BlockDatesModal({ boardingId, onClose, onCreated }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/boarding-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boarding_id: boardingId,
          date_from: dateFrom,
          date_to: dateTo,
          reason: reason || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Errore durante il blocco");
        return;
      }
      onCreated();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-md my-8" onClick={(e) => e.stopPropagation()}>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-lg">Blocca date</h2>
                <p className="text-sm text-muted-foreground">
                  Periodo in cui la struttura non accetta prenotazioni (ferie,
                  manutenzione…).
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Chiudi"
                className="text-muted-foreground hover:text-foreground -mt-1 -mr-1 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-sm font-medium">Dal *</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    min={today}
                    onChange={(e) => setDateFrom(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium">Al *</label>
                  <Input
                    type="date"
                    value={dateTo}
                    min={dateFrom || today}
                    onChange={(e) => setDateTo(e.target.value)}
                    required
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-1">
                Il blocco copre dal giorno &quot;Dal&quot; (incluso) al giorno
                &quot;Al&quot; (escluso).
              </p>

              <div className="space-y-1">
                <label className="block text-sm font-medium">Motivo (opzionale)</label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ferie estive, ristrutturazione..."
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  {error}
                </p>
              )}

              <div className="flex gap-2 justify-end pt-2 border-t border-border">
                <Button variant="outline" onClick={onClose} type="button">
                  Annulla
                </Button>
                <Button type="submit" isLoading={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Blocco...
                    </>
                  ) : (
                    "Blocca date"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
