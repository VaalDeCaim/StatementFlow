// This file runs in Supabase Edge Functions (Deno).
// Minimal declarations for the Deno environment.
declare const Deno: {
  env: { get(key: string): string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

    let body: { otp?: string } = {};
    try {
      body = (await req.json()) ?? {};
    } catch {
      // ignore invalid JSON
    }
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";
    if (!otp) {
      return new Response(
        JSON.stringify({ error: "OTP code is required to delete the account" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
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

    const userEmail = user.email;
    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verify email OTP with Auth before allowing delete (re-auth step)
    const verifyRes = await fetch(`${supabaseUrl}/auth/v1/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
      },
      body: JSON.stringify({
        type: "email",
        token: otp,
        email: userEmail,
      }),
    });
    if (!verifyRes.ok) {
      const verifyErr = await verifyRes.json().catch(() => ({}));
      const message =
        (verifyErr as { msg?: string }).msg ??
        (verifyErr as { error_description?: string }).error_description ??
        "Invalid or expired verification code. Request a new code and try again.";
      return new Response(
        JSON.stringify({ error: message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const userId = user.id;

    // Service-role client for destructive operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Fetch all jobs for this user so we can delete their raw uploads and exports.
    const { data: jobs, error: jobsFetchError } = await supabaseAdmin
      .from("jobs")
      .select("id, raw_key, format")
      .eq("user_id", userId);

    if (!jobsFetchError && jobs && jobs.length > 0) {
      const rawPaths: string[] = [];
      const exportPaths: string[] = [];
      for (const job of jobs) {
        if (job.raw_key && typeof job.raw_key === "string") {
          rawPaths.push(job.raw_key);
        }
        const exportPath = `${userId}/${job.id}/statement.${job.format ?? "csv"}`;
        exportPaths.push(exportPath);
      }
      if (rawPaths.length > 0) {
        const { error: rawRemoveError } = await supabaseAdmin.storage
          .from("raw")
          .remove(rawPaths);
        if (rawRemoveError) {
          console.error("Failed to remove raw objects for user", userId, rawRemoveError);
        }
      }
      if (exportPaths.length > 0) {
        const { error: exportRemoveError } = await supabaseAdmin.storage
          .from("exports")
          .remove(exportPaths);
        if (exportRemoveError) {
          console.error("Failed to remove export objects for user", userId, exportRemoveError);
        }
      }
    }

    // Remove any remaining storage under user folder (e.g. orphaned or list-only uploads).
    const buckets = ["raw", "exports"] as const;
    for (const bucket of buckets) {
      const { data: topLevel, error: listError } = await supabaseAdmin.storage
        .from(bucket)
        .list(userId, { limit: 1000 });

      if (listError) {
        console.error(`Failed to list ${bucket} for user`, userId, listError);
        continue;
      }
      if (!topLevel?.length) continue;

      const toRemove: string[] = [];
      for (const item of topLevel) {
        const prefix = `${userId}/${item.name}`;
        if (item.id != null) {
          toRemove.push(prefix);
        } else {
          const { data: nested } = await supabaseAdmin.storage.from(bucket).list(prefix, { limit: 500 });
          if (nested?.length) {
            for (const file of nested) {
              toRemove.push(`${prefix}/${file.name}`);
            }
          }
        }
      }
      if (toRemove.length > 0) {
        const { error: removeError } = await supabaseAdmin.storage.from(bucket).remove(toRemove);
        if (removeError) console.error(`Failed to remove ${bucket} remainder for user`, userId, removeError);
      }
    }

    // Delete all jobs for this user.
    const { error: jobsError } = await supabaseAdmin
      .from("jobs")
      .delete()
      .eq("user_id", userId);
    if (jobsError) {
      console.error("Failed to delete jobs for user", userId, jobsError);
    }

    // Delete the auth user; cascades to profiles and any other dependent rows.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      return new Response(
        JSON.stringify({ error: deleteError.message ?? "Failed to delete user" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("delete-user error", e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

