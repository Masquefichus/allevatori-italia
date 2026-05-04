import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface BookingInput {
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

function validate(input: BookingInput): { ok: true; data: Required<Pick<BookingInput, "boarding_id" | "requester_name" | "requester_email" | "check_in" | "check_out" | "dog_name">> & BookingInput } | { ok: false; error: string } {
  const required: (keyof BookingInput)[] = [
    "boarding_id",
    "requester_name",
    "requester_email",
    "check_in",
    "check_out",
    "dog_name",
  ];
  for (const k of required) {
    if (!input[k] || (typeof input[k] === "string" && (input[k] as string).trim() === "")) {
      return { ok: false, error: `Campo obbligatorio mancante: ${k}` };
    }
  }
  // Email basic check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.requester_email!)) {
    return { ok: false, error: "Email non valida" };
  }
  // Date check
  const ci = new Date(input.check_in!);
  const co = new Date(input.check_out!);
  if (Number.isNaN(ci.getTime()) || Number.isNaN(co.getTime())) {
    return { ok: false, error: "Date non valide" };
  }
  if (co <= ci) {
    return { ok: false, error: "Check-out deve essere successivo al check-in" };
  }
  // Size enum
  if (input.dog_size && !["piccola", "media", "grande", "gigante"].includes(input.dog_size)) {
    return { ok: false, error: "Taglia cane non valida" };
  }
  return { ok: true, data: input as Required<Pick<BookingInput, "boarding_id" | "requester_name" | "requester_email" | "check_in" | "check_out" | "dog_name">> & BookingInput };
}

export async function POST(request: Request) {
  let payload: BookingInput;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload JSON non valido" }, { status: 400 });
  }

  const result = validate(payload);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const data = result.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Verifica che la pensione esista ed è approvata
  const { data: boarding, error: bErr } = await supabase
    .from("boarding_profiles")
    .select("id, is_approved")
    .eq("id", data.boarding_id)
    .single();
  if (bErr || !boarding) {
    return NextResponse.json({ error: "Pensione non trovata" }, { status: 404 });
  }
  if (!boarding.is_approved) {
    return NextResponse.json(
      { error: "Pensione non disponibile per prenotazioni" },
      { status: 400 }
    );
  }

  const { data: inserted, error } = await supabase
    .from("bookings")
    .insert({
      boarding_id: data.boarding_id,
      requester_id: user?.id ?? null,
      requester_name: data.requester_name.trim(),
      requester_email: data.requester_email.trim().toLowerCase(),
      requester_phone: data.requester_phone?.trim() || null,
      check_in: data.check_in,
      check_out: data.check_out,
      dog_name: data.dog_name.trim(),
      dog_breed: data.dog_breed?.trim() || null,
      dog_size: data.dog_size || null,
      notes: data.notes?.trim() || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: inserted.id }, { status: 201 });
}
