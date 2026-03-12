// This file runs in Supabase Edge Functions (Deno).
// Minimal declarations for the Deno environment.
declare const Deno: {
  env: { get(key: string): string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const BUNDLES = [
  { id: "pkg_1", coins: 10, priceCents: 990, label: "Starter" },
  { id: "pkg_2", coins: 50, priceCents: 3990, label: "Standard" },
  { id: "pkg_3", coins: 150, priceCents: 9990, label: "Business" },
] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase env config" }),
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

    // Client scoped to the authenticated user (from the incoming JWT)
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

    const userId = user.id;

    if (req.method === "GET") {
      // Return static bundle definitions.
      return new Response(
        JSON.stringify({ bundles: BUNDLES }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { bundleId } = body as { bundleId?: string };

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

      // Service-role client for updating profile balance.
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("balance")
        .eq("id", userId)
        .single();

      if (profileError || !profile) {
        return new Response(
          JSON.stringify({ error: "Profile not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const currentBalance = typeof profile.balance === "number"
        ? profile.balance
        : 0;
      const newBalance = currentBalance + bundle.coins;

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", userId);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Failed to update balance" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({ balance: newBalance }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  } catch (e) {
    console.error("topup-bundles error", e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

