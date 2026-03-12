// This file runs in Supabase Edge Functions (Deno).
// Stripe webhook: verify signature, then fulfill (credit balance) on checkout.session.completed.
declare const Deno: {
  env: { get(key: string): string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const webhookSecret = Deno.env.get("stripe_webhook_secret") ?? "";
  const stripeSecretKey = Deno.env.get("stripe_secret_key") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!webhookSecret || !stripeSecretKey) {
    console.error("stripe-webhook: stripe_webhook_secret or stripe_secret_key not set");
    return new Response(
      JSON.stringify({ error: "Stripe webhook or secret key not configured" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase env config" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const signature = req.headers.get("Stripe-Signature");
  if (!signature) {
    return new Response(
      JSON.stringify({ error: "Missing Stripe-Signature header" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (e) {
    console.error("stripe-webhook: failed to read body", e);
    return new Response(
      JSON.stringify({ error: "Invalid body" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia",
    });
    event = (await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret,
    )) as Stripe.Event;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("stripe-webhook: signature verification failed", message);
    return new Response(
      JSON.stringify({ error: `Webhook signature verification failed: ${message}` }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  if (event.type !== "checkout.session.completed") {
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const sessionId = session.id;
  if (!sessionId) {
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: payment, error: fetchError } = await supabase
    .from("payments")
    .select("id, user_id, coins, status")
    .eq("stripe_session_id", sessionId)
    .single();

  if (fetchError || !payment) {
    console.error("stripe-webhook: payment not found for session", sessionId, fetchError);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (payment.status !== "pending") {
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", payment.user_id)
    .single();

  if (profileError || !profile) {
    console.error("stripe-webhook: profile not found for user", payment.user_id);
    const { error: failError } = await supabase
      .from("payments")
      .update({ status: "failed" })
      .eq("id", payment.id);
    if (failError) console.error("stripe-webhook: failed to mark payment failed", failError);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const currentBalance = typeof profile.balance === "number" ? profile.balance : 0;
  const newBalance = currentBalance + payment.coins;

  const { error: updateProfileError } = await supabase
    .from("profiles")
    .update({ balance: newBalance })
    .eq("id", payment.user_id);

  if (updateProfileError) {
    console.error("stripe-webhook: failed to update profile balance", updateProfileError);
    return new Response(
      JSON.stringify({ error: "Failed to update balance" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const { error: updatePaymentError } = await supabase
    .from("payments")
    .update({ status: "completed" })
    .eq("id", payment.id);

  if (updatePaymentError) {
    console.error("stripe-webhook: failed to mark payment completed", updatePaymentError);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
