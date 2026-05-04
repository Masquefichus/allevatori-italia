"use client";

import { useState, useEffect } from "react";
import { CalendarPlus, X, CheckCircle2, Loader2 } from "lucide-react";
import Card, { CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface Props {
  boardingId: string;
  boardingName: string;
}

export default function RequestBookingButton({ boardingId, boardingName }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
      >
        <CalendarPlus className="h-4 w-4" />
        Richiedi soggiorno
      </button>

      {open && (
        <BookingModal
          boardingId={boardingId}
          boardingName={boardingName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function BookingModal({
  boardingId,
  boardingName,
  onClose,
}: {
  boardingId: string;
  boardingName: string;
  onClose: () => void;
}) {
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
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boarding_id: boardingId,
          requester_name: requesterName,
          requester_email: requesterEmail,
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
        setError(json.error || "Errore durante l'invio");
        return;
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <Card>
          <CardContent className="p-6 space-y-4">
            {done ? (
              <div className="text-center space-y-3 py-6">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                </div>
                <h2 className="font-serif text-xl">Richiesta inviata</h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Abbiamo notificato {boardingName}. Riceverai una risposta a{" "}
                  <strong>{requesterEmail}</strong> appena la struttura
                  conferma o propone alternative.
                </p>
                <Button variant="outline" onClick={onClose}>
                  Chiudi
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-lg">Richiedi un soggiorno</h2>
                    <p className="text-sm text-muted-foreground">{boardingName}</p>
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
                    <FormField label="Check-in *">
                      <Input
                        type="date"
                        value={checkIn}
                        min={today}
                        onChange={(e) => setCheckIn(e.target.value)}
                        required
                      />
                    </FormField>
                    <FormField label="Check-out *">
                      <Input
                        type="date"
                        value={checkOut}
                        min={checkIn || today}
                        onChange={(e) => setCheckOut(e.target.value)}
                        required
                      />
                    </FormField>
                  </div>

                  <div className="border-t border-border pt-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Il tuo cane
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Nome *">
                        <Input
                          value={dogName}
                          onChange={(e) => setDogName(e.target.value)}
                          placeholder="Luna"
                          required
                        />
                      </FormField>
                      <FormField label="Razza">
                        <Input
                          value={dogBreed}
                          onChange={(e) => setDogBreed(e.target.value)}
                          placeholder="Labrador, meticcio..."
                        />
                      </FormField>
                    </div>
                    <FormField label="Taglia" className="mt-3">
                      <select
                        value={dogSize}
                        onChange={(e) =>
                          setDogSize(
                            e.target.value as "" | "piccola" | "media" | "grande" | "gigante"
                          )
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white"
                      >
                        <option value="">Seleziona...</option>
                        <option value="piccola">Piccola (&lt; 10 kg)</option>
                        <option value="media">Media (10-25 kg)</option>
                        <option value="grande">Grande (25-45 kg)</option>
                        <option value="gigante">Gigante (&gt; 45 kg)</option>
                      </select>
                    </FormField>
                  </div>

                  <div className="border-t border-border pt-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      I tuoi contatti
                    </p>
                    <FormField label="Nome e cognome *" className="mb-3">
                      <Input
                        value={requesterName}
                        onChange={(e) => setRequesterName(e.target.value)}
                        placeholder="Mario Rossi"
                        required
                      />
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Email *">
                        <Input
                          type="email"
                          value={requesterEmail}
                          onChange={(e) => setRequesterEmail(e.target.value)}
                          placeholder="mario@example.com"
                          required
                        />
                      </FormField>
                      <FormField label="Telefono">
                        <Input
                          type="tel"
                          value={requesterPhone}
                          onChange={(e) => setRequesterPhone(e.target.value)}
                          placeholder="+39 333 1234567"
                        />
                      </FormField>
                    </div>
                  </div>

                  <FormField
                    label="Note (opzionale)"
                    hint="Esigenze particolari, farmaci, comportamento, ecc."
                  >
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Es. il mio cane prende un farmaco al mattino..."
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white"
                    />
                  </FormField>

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
                          Invio...
                        </>
                      ) : (
                        "Invia richiesta"
                      )}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FormField({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
