"use client";

import { useState } from "react";
import {
  CalendarDays,
  Mail,
  Phone,
  Dog as DogIcon,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock,
  Info,
} from "lucide-react";
import Card, { CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface Booking {
  id: string;
  boarding_id: string;
  requester_name: string;
  requester_email: string;
  requester_phone: string | null;
  check_in: string;
  check_out: string;
  dog_name: string;
  dog_breed: string | null;
  dog_size: string | null;
  notes: string | null;
  status: string;
  response_message: string | null;
  created_at: string;
}

interface Props {
  bookings: Booking[];
  boardingByIdMap: Record<string, { name: string; slug: string }>;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function diffNights(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m fa`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h fa`;
  const days = Math.floor(hours / 24);
  return `${days}g fa`;
}

const STATUS_LABEL: Record<string, { label: string; variant: "success" | "destructive" | "default" | "primary" }> = {
  pending: { label: "In attesa", variant: "primary" },
  confirmed: { label: "Confermata", variant: "success" },
  declined: { label: "Rifiutata", variant: "destructive" },
  cancelled: { label: "Annullata", variant: "default" },
  completed: { label: "Completata", variant: "default" },
};

export default function BookingsListClient({ bookings, boardingByIdMap }: Props) {
  return (
    <div className="space-y-4">
      {bookings.map((b) => (
        <BookingCard key={b.id} booking={b} structureName={boardingByIdMap[b.boarding_id]?.name} />
      ))}
    </div>
  );
}

function BookingCard({
  booking,
  structureName,
}: {
  booking: Booking;
  structureName?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState(booking.status);
  const [localResponse, setLocalResponse] = useState(booking.response_message);

  const isPending = localStatus === "pending";
  const nights = diffNights(booking.check_in, booking.check_out);
  const statusInfo = STATUS_LABEL[localStatus] ?? STATUS_LABEL.pending;

  async function changeStatus(status: "confirmed" | "declined") {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          response_message: responseMessage.trim() || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Errore durante l'aggiornamento");
        return;
      }
      setLocalStatus(status);
      setLocalResponse(responseMessage.trim() || null);
      setExpanded(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className={isPending ? "border-primary/30" : undefined}>
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              {structureName && (
                <span className="text-xs text-muted-foreground">
                  → {structureName}
                </span>
              )}
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeAgo(booking.created_at)}
              </span>
            </div>
            <h3 className="font-semibold text-base mt-2">{booking.requester_name}</h3>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm pt-2 border-t border-border">
          <DetailRow icon={CalendarDays} label="Date">
            <span className="font-medium">
              {fmtDate(booking.check_in)} → {fmtDate(booking.check_out)}
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              ({nights} nott{nights === 1 ? "e" : "i"})
            </span>
          </DetailRow>

          <DetailRow icon={DogIcon} label="Cane">
            <span className="font-medium">{booking.dog_name}</span>
            {booking.dog_breed && (
              <span className="text-muted-foreground"> · {booking.dog_breed}</span>
            )}
            {booking.dog_size && (
              <span className="text-muted-foreground"> · taglia {booking.dog_size}</span>
            )}
          </DetailRow>

          <DetailRow icon={Mail} label="Email">
            <a
              href={`mailto:${booking.requester_email}`}
              className="text-primary hover:underline break-all"
            >
              {booking.requester_email}
            </a>
          </DetailRow>

          {booking.requester_phone && (
            <DetailRow icon={Phone} label="Telefono">
              <a
                href={`tel:${booking.requester_phone.replace(/\s|-/g, "")}`}
                className="text-primary hover:underline"
              >
                {booking.requester_phone}
              </a>
            </DetailRow>
          )}
        </div>

        {booking.notes && (
          <div className="bg-muted/50 border border-border rounded-lg p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <Info className="h-3.5 w-3.5" />
              Note del cliente
            </p>
            <p className="text-sm text-foreground/90 whitespace-pre-line">{booking.notes}</p>
          </div>
        )}

        {localResponse && (
          <div className="bg-primary-light/30 border border-primary/20 rounded-lg p-3">
            <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              La tua risposta
            </p>
            <p className="text-sm text-foreground/90 whitespace-pre-line">{localResponse}</p>
          </div>
        )}

        {/* Actions: solo se pending */}
        {isPending && (
          <div className="pt-3 border-t border-border space-y-3">
            {expanded ? (
              <>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Messaggio (opzionale): conferma dettagli, chiedi documenti, ecc."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white"
                />
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                    {error}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setExpanded(false);
                      setResponseMessage("");
                      setError(null);
                    }}
                  >
                    Annulla
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => changeStatus("declined")}
                    isLoading={submitting}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Rifiuta
                  </Button>
                  <Button onClick={() => changeStatus("confirmed")} isLoading={submitting}>
                    <CheckCircle2 className="h-4 w-4" />
                    Conferma
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex justify-end">
                <Button onClick={() => setExpanded(true)}>Rispondi</Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CalendarDays;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}
