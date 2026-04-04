import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ success: false, error: "Token mancante" }, { status: 400 });
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Se non configurato, lascia passare (dev senza chiavi)
    return NextResponse.json({ success: true });
  }

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, response: token }),
  });

  const data = await res.json();

  if (!data.success) {
    return NextResponse.json({ success: false, error: "Verifica CAPTCHA fallita" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
