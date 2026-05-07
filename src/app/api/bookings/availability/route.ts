import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/bookings/availability?boarding_id=...&from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns one row per day in [from, to) with { day, occupied, capacity, is_blocked }.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const boardingId = searchParams.get("boarding_id");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!boardingId || !from || !to) {
    return NextResponse.json(
      { error: "Parametri mancanti: boarding_id, from, to" },
      { status: 400 }
    );
  }

  // Range cap: max 6 mesi alla volta per evitare query enormi
  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return NextResponse.json({ error: "Date non valide" }, { status: 400 });
  }
  if (toDate <= fromDate) {
    return NextResponse.json({ error: "to deve essere successivo a from" }, { status: 400 });
  }
  const days = Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  if (days > 200) {
    return NextResponse.json({ error: "Range troppo ampio (max 200 giorni)" }, { status: 400 });
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("check_availability", {
    p_boarding_id: boardingId,
    p_from: from,
    p_to: to,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, days: data ?? [] });
}
