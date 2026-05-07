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

export default function ManualBookingModal({ boardingId, onClose, onCreated }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [requesterPhone, setRequesterPhone] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [dogName, setDogName] = useState("");
  const [dogBreed, setDogBreed] = useState("");
  const [dogSize, setDogSize] = useState<"" | "piccola" | "media" | "grande" | "gigante">("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boarding_id: boardingId,
          requester_name: requesterName,
          requester_email: requesterEmail || undefined,
          requester_phone: requesterPhone || undefined,
          check_in: checkIn,
          check_out: checkOut,
          dog_name: dogName,
          dog_breed: dogBreed || undefined,
          dog_size: dogSize || undefined,
          notes: notes || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Errore durante l'inserimento");
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
      <div className="w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-lg">Aggiungi prenotazione</h2>
                <p className="text-sm text-muted-foreground">
                  Registra un soggiorno per un cliente offline (verrà confermato
                  automaticamente).
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
                <Field label="Check-in *">
                  <Input
                    type="date"
                    value={checkIn}
                    min={today}
                    onChange={(e) => setCheckIn(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Check-out *">
                  <Input
                    type="date"
                    value={checkOut}
                    min={checkIn || today}
                    onChange={(e) => setCheckOut(e.target.value)}
                    required
                  />
                </Field>
              </div>

              <div className="border-t border-border pt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Cane
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nome *">
                    <Input
                      value={dogName}
                      onChange={(e) => setDogName(e.target.value)}
                      placeholder="Luna"
                      required
                    />
                  </Field>
                  <Field label="Razza">
                    <Input
                      value={dogBreed}
                      onChange={(e) => setDogBreed(e.target.value)}
                      placeholder="Meticcio, Labrador..."
                    />
                  </Field>
                </div>
                <Field label="Taglia" className="mt-3">
                  <select
                    value={dogSize}
                    onChange={(e) =>
                      setDogSize(
                        e.target.value as "" | "piccola" | "media" | "grande" | "gigante"
                      )
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white"
                  >
                    <option value="">—</option>
                    <option value="piccola">Piccola (&lt; 10 kg)</option>
                    <option value="media">Media (10–25 kg)</option>
                    <option value="grande">Grande (25–45 kg)</option>
                    <option value="gigante">Gigante (&gt; 45 kg)</option>
                  </select>
                </Field>
              </div>

              <div className="border-t border-border pt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Cliente
                </p>
                <Field label="Nome cliente *" className="mb-3">
                  <Input
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                    placeholder="Mario Rossi"
                    required
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Email">
                    <Input
                      type="email"
                      value={requesterEmail}
                      onChange={(e) => setRequesterEmail(e.target.value)}
                      placeholder="opzionale"
                    />
                  </Field>
                  <Field label="Telefono">
                    <Input
                      type="tel"
                      value={requesterPhone}
                      onChange={(e) => setRequesterPhone(e.target.value)}
                      placeholder="+39 333..."
                    />
                  </Field>
                </div>
              </div>

              <Field label="Note (opzionale)">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Caparra ricevuta, esigenze del cane..."
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white"
                />
              </Field>

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
                      Salvataggio...
                    </>
                  ) : (
                    "Conferma prenotazione"
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

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}
