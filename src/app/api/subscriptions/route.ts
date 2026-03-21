import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { SubscriptionPlan } from "@/types/database";

const STRIPE_PRICES: Record<string, string> = {
  premium: process.env.STRIPE_PREMIUM_PRICE_ID || "",
  elite: process.env.STRIPE_ELITE_PRICE_ID || "",
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { plan } = await request.json() as { plan: SubscriptionPlan };

    if (!STRIPE_PRICES[plan]) {
      return NextResponse.json({ error: "Piano non valido" }, { status: 400 });
    }

    // Check if Stripe is configured
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json(
        { error: "Stripe non configurato. Aggiorna le variabili d'ambiente." },
        { status: 503 }
      );
    }

    // Dynamic import of Stripe
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey);

    // Get or create Stripe customer
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: STRIPE_PRICES[plan], quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/abbonamento?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/abbonamento?canceled=true`,
      metadata: {
        user_id: user.id,
        plan,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "Errore nella creazione del checkout" }, { status: 500 });
  }
}
