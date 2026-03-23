import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret || !sig) {
    return NextResponse.json({ error: "Stripe non configurato" }, { status: 503 });
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey);

    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    const supabase = createAdminClient();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan;

        if (userId && plan) {
          // Upsert subscription
          await supabase
            .from("subscriptions")
            .upsert({
              user_id: userId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              plan: plan as "premium" | "elite",
              status: "active",
            }, { onConflict: "user_id" });

          // Get breeder profile and update premium status
          const { data: breeder } = await supabase
            .from("breeder_profiles")
            .select("id")
            .eq("user_id", userId)
            .single();

          if (breeder) {
            await supabase
              .from("breeder_profiles")
              .update({ is_premium: true })
              .eq("id", breeder.id);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = event.data.object as any;
        await supabase
          .from("subscriptions")
          .update({
            status: (sub.status as string) === "active" ? "active" : "canceled",
            current_period_start: new Date((sub.current_period_start as number) * 1000).toISOString(),
            current_period_end: new Date((sub.current_period_end as number) * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", sub.id as string);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await supabase
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", subscription.id);

        // Remove premium status
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (sub) {
          const { data: breeder } = await supabase
            .from("breeder_profiles")
            .select("id")
            .eq("user_id", sub.user_id)
            .single();

          if (breeder) {
            await supabase
              .from("breeder_profiles")
              .update({ is_premium: false })
              .eq("id", breeder.id);
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
