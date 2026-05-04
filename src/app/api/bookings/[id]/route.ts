import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_STATUSES = ["confirmed", "declined", "cancelled", "completed"] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

interface PatchInput {
  status?: AllowedStatus;
  response_message?: string;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  let payload: PatchInput;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload JSON non valido" }, { status: 400 });
  }

  if (payload.status && !ALLOWED_STATUSES.includes(payload.status)) {
    return NextResponse.json({ error: "Status non valido" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  // Recupera la booking + verifica ownership della pensione
  const { data: booking, error: bErr } = await supabase
    .from("bookings")
    .select("id, boarding_id, status, boarding:boarding_profiles!inner(user_id)")
    .eq("id", id)
    .single();

  if (bErr || !booking) {
    return NextResponse.json({ error: "Prenotazione non trovata" }, { status: 404 });
  }

  // boarding può essere object o array; gestisco entrambi
  const ownerId = Array.isArray(booking.boarding)
    ? (booking.boarding[0] as { user_id: string } | undefined)?.user_id
    : (booking.boarding as { user_id: string } | null)?.user_id;

  if (ownerId !== user.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const update: Record<string, unknown> = {};
  if (payload.status) update.status = payload.status;
  if (typeof payload.response_message === "string") {
    update.response_message = payload.response_message.trim() || null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nessun campo da aggiornare" }, { status: 400 });
  }

  const { error: uErr } = await supabase.from("bookings").update(update).eq("id", id);
  if (uErr) {
    return NextResponse.json({ error: uErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
