import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/boarding-blocks?boarding_id=...
// Lista i blocchi (ferie/manutenzione) di una pensione.
// - Pubblico: solo le date_from/date_to/reason (servono al form pubblico per evidenziare le date)
// - Owner: anche id (per cancellarli)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const boardingId = searchParams.get("boarding_id");
  if (!boardingId) {
    return NextResponse.json({ error: "boarding_id mancante" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boarding_blocks")
    .select("id, boarding_id, date_from, date_to, reason")
    .eq("boarding_id", boardingId)
    .gte("date_to", new Date().toISOString().slice(0, 10))
    .order("date_from", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, blocks: data ?? [] });
}

// POST /api/boarding-blocks
// Solo l'owner della pensione può creare un blocco.
// Body: { boarding_id, date_from, date_to, reason? }
export async function POST(request: Request) {
  let payload: {
    boarding_id?: string;
    date_from?: string;
    date_to?: string;
    reason?: string;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload JSON non valido" }, { status: 400 });
  }

  if (!payload.boarding_id || !payload.date_from || !payload.date_to) {
    return NextResponse.json(
      { error: "Campi obbligatori: boarding_id, date_from, date_to" },
      { status: 400 }
    );
  }
  const df = new Date(payload.date_from);
  const dt = new Date(payload.date_to);
  if (Number.isNaN(df.getTime()) || Number.isNaN(dt.getTime())) {
    return NextResponse.json({ error: "Date non valide" }, { status: 400 });
  }
  if (dt <= df) {
    return NextResponse.json(
      { error: "date_to deve essere successivo a date_from" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

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

  const { data: inserted, error } = await supabase
    .from("boarding_blocks")
    .insert({
      boarding_id: payload.boarding_id,
      date_from: payload.date_from,
      date_to: payload.date_to,
      reason: payload.reason?.trim() || null,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: inserted.id }, { status: 201 });
}
