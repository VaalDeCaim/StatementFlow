import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const COIN_COST_PER_JOB = 1;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { key, format } = body as { key?: string; format?: string };
    if (!key || typeof key !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing key" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const validFormats = ["csv", "xlsx", "qbo"];
    const outFormat = validFormats.includes(format) ? format : "csv";
    const fileName = key.split("/").pop() ?? "statement";

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check user balance before creating a job
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("balance")
      .eq("id", user.id)
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

    const currentBalance =
      typeof profile.balance === "number" ? profile.balance : 0;

    if (currentBalance < COIN_COST_PER_JOB) {
      return new Response(
        JSON.stringify({ error: "Insufficient balance" }),
        {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: job, error: insertError } = await supabaseAdmin
      .from("jobs")
      .insert({
        user_id: user.id,
        status: "pending",
        format: outFormat,
        raw_key: key,
        file_name: fileName,
      })
      .select("id, status")
      .single();

    if (insertError) {
      return new Response(
        JSON.stringify({ error: insertError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Deduct coins for this job
    const { error: balanceUpdateError } = await supabaseAdmin
      .from("profiles")
      .update({ balance: currentBalance - COIN_COST_PER_JOB })
      .eq("id", user.id);

    if (balanceUpdateError) {
      await supabaseAdmin
        .from("jobs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          validation_errors: ["Failed to update balance"],
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      return new Response(
        JSON.stringify({ error: "Failed to update balance" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const functionsUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/process-job`;
    const processRes = await fetch(functionsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({ jobId: job.id }),
    });

    if (!processRes.ok) {
      const errBody = await processRes.text();
      await supabaseAdmin
        .from("jobs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          validation_errors: ["Conversion failed to start: " + (errBody || processRes.statusText)],
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    }

    return new Response(
      JSON.stringify({ jobId: job.id, status: job.status as string }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
