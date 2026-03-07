import Stripe from "stripe";

// Supabase Edge Function (Deno) example to create a Stripe Checkout session.
// Environment variables required:
// - STRIPE_SECRET : your Stripe secret key
// - SEASON_PASS_PRICE_ID : the Stripe Price ID for the one-time season pass
// - SITE_URL : your site URL used for success/cancel redirects

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET") || "", { apiVersion: "2022-11-15" });

export default async (req: Request) => {
  try {
    if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });

    const body = await req.json();
    const userId = body?.userId;
    if (!userId) return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });

    const price = Deno.env.get("SEASON_PASS_PRICE_ID");
    if (!price) return new Response(JSON.stringify({ error: "Missing SEASON_PASS_PRICE_ID env" }), { status: 500 });

    const siteUrl = Deno.env.get("SITE_URL") || "https://your-site.example";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price,
          quantity: 1,
        },
      ],
      metadata: { user_id: userId },
      success_url: `${siteUrl}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/settings`,
    });

    return new Response(JSON.stringify({ url: session.url }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as any)?.message || "unknown" }), { status: 500 });
  }
};
