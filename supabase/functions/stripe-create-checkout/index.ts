// This file runs in Supabase Edge Functions (Deno).
declare const Deno: {
  env: { get(key: string): string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { corsHeaders } from "../_shared/cors.ts";

const BUNDLES = [
  { id: "pkg_1", coins: 10, priceCents: 990, label: "Starter" },
  { id: "pkg_2", coins: 50, priceCents: 3990, label: "Standard" },
  { id: "pkg_3", coins: 150, priceCents: 9990, label: "Business" },
] as const;

function getStripePriceId(bundleId: string): string | null {
  const key = `stripe_price_${bundleId.replace("-", "_")}`;
  return Deno.env.get(key) ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const stripeSecretKey = Deno.env.get("stripe_secret_key") ?? "";
  const siteUrl = Deno.env.get("site_url") ?? "";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase env config" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  if (!stripeSecretKey) {
    return new Response(
      JSON.stringify({
        error:
          "Stripe is not configured. Set stripe_secret_key in Edge Function secrets or in supabase/functions/.env for local dev.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json().catch(() => ({})) as {
      bundleId?: string;
      successBaseUrl?: string;
    };
    const { bundleId, successBaseUrl } = body;

    if (!bundleId) {
      return new Response(
        JSON.stringify({ error: "Missing bundleId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const bundle = BUNDLES.find((b) => b.id === bundleId);
    if (!bundle) {
      return new Response(
        JSON.stringify({ error: "Unknown bundle" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const priceId = getStripePriceId(bundleId);
    if (!priceId) {
      return new Response(
        JSON.stringify({
          error: `Stripe price not configured for bundle ${bundleId}. Set STRIPE_PRICE_${bundleId.toUpperCase().replace("-", "_")} in Supabase secrets.`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const baseUrl =
      (typeof successBaseUrl === "string" && successBaseUrl.trim())
        ? successBaseUrl.trim().replace(/\/$/, "")
        : siteUrl;
    if (!baseUrl) {
      return new Response(
        JSON.stringify({
          error: "Missing redirect base URL. Set SITE_URL or pass successBaseUrl in the request body.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia",
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/topup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/topup/cancel`,
      customer_email: user.email ?? undefined,
      metadata: {
        user_id: user.id,
        bundle_id: bundleId,
        coins: String(bundle.coins),
      },
    });

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { error: insertError } = await supabaseAdmin.from("payments").insert({
      user_id: user.id,
      bundle_id: bundleId,
      coins: bundle.coins,
      amount_cents: bundle.priceCents,
      stripe_session_id: session.id,
      status: "pending",
    });

    if (insertError) {
      console.error("stripe-create-checkout: failed to insert payment row", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to record payment session" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const url = session.url ?? null;
    if (!url) {
      return new Response(
        JSON.stringify({ error: "Stripe did not return a checkout URL" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ url }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("stripe-create-checkout error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
