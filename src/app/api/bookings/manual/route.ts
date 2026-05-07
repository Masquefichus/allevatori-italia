import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/bookings/manual
// Solo l'owner della pensione può creare una prenotazione "confirmed"
// direttamente (clienti offline, walk-in, telefonata).
//
// Body: { boarding_id, check_in, check_out, dog_name, requester_name,
//         requester_email?, requester_phone?, dog_breed?, dog_size?, notes? }

interface ManualInput {
  boarding_id?: string;
  requester_name?: string;
  requester_email?: string;
  requester_phone?: string;
  check_in?: string;
  check_out?: string;
  dog_name?: string;
  dog_breed?: string;
  dog_size?: "piccola" | "media" | "grande" | "gigante";
  notes?: string;
}

export async function POST(request: Request) {
  let payload: ManualInput;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload JSON non valido" }, { status: 400 });
  }

  const required: (keyof ManualInput)[] = [
    "boarding_id",
    "requester_name",
    "check_in",
    "check_out",
    "dog_name",
  ];
  for (const k of required) {
    if (!payload[k] || (typeof payload[k] === "string" && (payload[k] as string).trim() === "")) {
      return NextResponse.json({ error: `Campo obbligatorio mancante: ${k}` }, { status: 400 });
    }
  }

  const ci = new Date(payload.check_in!);
  const co = new Date(payload.check_out!);
  if (Number.isNaN(ci.getTime()) || Number.isNaN(co.getTime())) {
    return NextResponse.json({ error: "Date non valide" }, { status: 400 });
  }
  if (co <= ci) {
    return NextResponse.json(
      { error: "Check-out deve essere successivo al check-in" },
      { status: 400 }
    );
  }
  if (payload.dog_size && !["piccola", "media", "grande", "gigante"].includes(payload.dog_size)) {
    return NextResponse.json({ error: "Taglia cane non valida" }, { status: 400 });
  }
  if (
    payload.requester_email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.requester_email)
  ) {
    return NextResponse.json({ error: "Email non valida" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  // Verifica ownership della pensione
  const { data: boarding, error: bErr } = await supabase
    .from("boarding_profiles")
    .select("id, user_id")
    .eq("id", payload.boarding_id)
    .single();
  if (bErr || !boarding) {
    return NextResponse.json({ error: "Pensione non trovata" }, { status: 404 });
  }
  if (boarding.user_id !== user.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  // Verifica capacità
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: avail, error: aErr } = await (supabase as any).rpc("check_availability", {
    p_boarding_id: payload.boarding_id,
    p_from: payload.check_in,
    p_to: payload.check_out,
  });
  if (aErr) {
    return NextResponse.json({ error: aErr.message }, { status: 500 });
  }
  type AvailRow = { day: string; occupied: number; capacity: number; is_blocked: boolean };
  const rows = (avail ?? []) as AvailRow[];
  const blocked = rows.find((r) => r.is_blocked);
  if (blocked) {
    return NextResponse.json(
      { error: `Date sovrapposte a un blocco (${blocked.day}). Rimuovi il blocco prima di prenotare.` },
      { status: 409 }
    );
  }
  const full = rows.find((r) => r.occupied >= r.capacity);
  if (full) {
    return NextResponse.json(
      { error: `Capienza esaurita il ${full.day} (${full.occupied}/${full.capacity}).` },
      { status: 409 }
    );
  }

  const { data: inserted, error } = await supabase
    .from("bookings")
    .insert({
      boarding_id: payload.boarding_id,
      requester_id: null,
      requester_name: payload.requester_name!.trim(),
      requester_email:
        payload.requester_email?.trim().toLowerCase() || "manuale@offline.local",
      requester_phone: payload.requester_phone?.trim() || null,
      check_in: payload.check_in,
      check_out: payload.check_out,
      dog_name: payload.dog_name!.trim(),
      dog_breed: payload.dog_breed?.trim() || null,
      dog_size: payload.dog_size || null,
      notes: payload.notes?.trim() || null,
      status: "confirmed",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: inserted.id }, { status: 201 });
}
