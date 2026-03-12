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

    const userId = user.id;

    // Service-role client for destructive operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Delete storage files in raw and exports buckets under this user's folder.
    const buckets = ["raw", "exports"] as const;

    for (const bucket of buckets) {
      const { data: objects, error: listError } = await supabaseAdmin.storage
        .from(bucket)
        .list(userId, { limit: 1000, offset: 0, sortBy: { column: "name", order: "asc" } });

      if (listError) {
        // Log and continue; storage cleanup failures shouldn't block account deletion.
        console.error(`Failed to list ${bucket} objects for user`, userId, listError);
      } else if (objects && objects.length > 0) {
        const paths = objects.map((o) => `${userId}/${o.name}`);
        const { error: removeError } = await supabaseAdmin.storage
          .from(bucket)
          .remove(paths);

        if (removeError) {
          console.error(`Failed to remove ${bucket} objects for user`, userId, removeError);
        }
      }
    }

    // Optionally delete all jobs explicitly (also covered by ON DELETE CASCADE).
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

