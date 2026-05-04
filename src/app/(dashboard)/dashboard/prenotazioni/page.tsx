import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Inbox } from "lucide-react";
import Card, { CardContent } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import BookingsListClient from "./BookingsListClient";

export const dynamic = "force-dynamic";

export default async function PrenotazioniPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/accedi?redirect=/dashboard/prenotazioni");

  // Recupera le pensioni dell'utente
  const { data: boardings } = await supabase
    .from("boarding_profiles")
    .select("id, name, slug")
    .eq("user_id", user.id);

  if (!boardings || boardings.length === 0) {
    return (
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-2xl font-bold">Prenotazioni</h1>
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <Inbox className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <p className="text-base font-medium">Nessuna pensione attiva</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Per ricevere prenotazioni devi prima attivare il servizio pensione sul tuo
              account.
            </p>
            <Link
              href="/dashboard/aggiungi-servizio"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Vai al hub servizi
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const boardingIds = boardings.map((b) => b.id);
  const boardingByIdMap: Record<string, { name: string; slug: string }> = {};
  for (const b of boardings) {
    boardingByIdMap[b.id] = { name: b.name, slug: b.slug };
  }

  // Carica tutte le prenotazioni delle pensioni dell'utente
  const { data: bookingsRaw } = await supabase
    .from("bookings")
    .select(
      "id, boarding_id, requester_name, requester_email, requester_phone, check_in, check_out, dog_name, dog_breed, dog_size, notes, status, response_message, created_at"
    )
    .in("boarding_id", boardingIds)
    .order("check_in", { ascending: true });

  const bookings = bookingsRaw ?? [];

  // Conta per stato
  const counts = {
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    archive: bookings.filter((b) =>
      ["declined", "cancelled", "completed"].includes(b.status)
    ).length,
  };

  const tab = (sp.tab ?? "pending") as "pending" | "confirmed" | "archive";

  const filtered = bookings.filter((b) => {
    if (tab === "pending") return b.status === "pending";
    if (tab === "confirmed") return b.status === "confirmed";
    return ["declined", "cancelled", "completed"].includes(b.status);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6" />
            Prenotazioni
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestisci le richieste di soggiorno per la tua pensione.
          </p>
        </div>
      </div>

      {/* Tab */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        <TabLink
          href="/dashboard/prenotazioni?tab=pending"
          active={tab === "pending"}
          label="In attesa"
          count={counts.pending}
          highlight={counts.pending > 0}
        />
        <TabLink
          href="/dashboard/prenotazioni?tab=confirmed"
          active={tab === "confirmed"}
          label="Confermate"
          count={counts.confirmed}
        />
        <TabLink
          href="/dashboard/prenotazioni?tab=archive"
          active={tab === "archive"}
          label="Archivio"
          count={counts.archive}
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            {tab === "pending"
              ? "Nessuna richiesta in attesa. Le nuove prenotazioni compariranno qui."
              : tab === "confirmed"
                ? "Nessuna prenotazione confermata."
                : "Archivio vuoto."}
          </CardContent>
        </Card>
      ) : (
        <BookingsListClient bookings={filtered} boardingByIdMap={boardingByIdMap} />
      )}
    </div>
  );
}

function TabLink({
  href,
  active,
  label,
  count,
  highlight = false,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      {count > 0 && (
        <span
          className={`text-xs rounded-full px-1.5 py-0.5 tabular-nums ${
            highlight ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground"
          }`}
        >
          {count}
        </span>
      )}
    </Link>
  );
}
