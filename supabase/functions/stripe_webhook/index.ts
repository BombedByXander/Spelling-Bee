import Stripe from "stripe";

// Supabase Edge Function (Deno) example to handle Stripe webhooks.
// Environment variables required:
// - STRIPE_SECRET : your Stripe secret key
// - STRIPE_WEBHOOK_SECRET : your Stripe webhook signing secret
// - SUPABASE_SERVICE_ROLE : your Supabase service_role key (to update profiles)
// - SUPABASE_URL : your Supabase project URL

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET") || "", { apiVersion: "2022-11-15" });

export default async (req: Request) => {
  try {
    const buf = await req.arrayBuffer();
    const rawBody = new Uint8Array(buf);
    const sig = req.headers.get("stripe-signature") || "";
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    let event: Stripe.Event;

    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(Buffer.from(rawBody), sig, webhookSecret);
    } else {
      event = JSON.parse(new TextDecoder().decode(rawBody));
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const userId = session.metadata?.user_id;
      const paymentIntent = session.payment_intent;

      // TODO: validate amount, price id, etc.

      if (userId) {
        // Update Supabase to mark season pass purchased for this user
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE");
        if (supabaseUrl && serviceRole) {
          await fetch(`${supabaseUrl}/rest/v1/season_pass_purchases`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceRole}`,
              Prefer: "return=representation",
            },
            body: JSON.stringify({ user_id: userId, purchased_at: new Date().toISOString(), stripe_payment_id: paymentIntent }),
          });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as any)?.message || "unknown" }), { status: 400 });
  }
};
