// This file runs in Supabase Edge Functions (Deno).
declare const Deno: {
  env: {get(key: string): string | undefined};
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
import {corsHeaders} from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {headers: corsHeaders});
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({error: "Missing authorization"}),
        {
          status: 401,
          headers: {...corsHeaders, "Content-Type": "application/json"},
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return new Response(
        JSON.stringify({error: "Missing Supabase env config"}),
        {
          status: 500,
          headers: {...corsHeaders, "Content-Type": "application/json"},
        },
      );
    }

    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: {headers: {Authorization: authHeader}},
    });

    const {
      data: {user},
      error: userError,
    } = await supabaseAuth.auth.getUser(authHeader.replace("Bearer ", ""));

    if (userError || !user) {
      return new Response(
        JSON.stringify({error: "Unauthorized"}),
        {
          status: 401,
          headers: {...corsHeaders, "Content-Type": "application/json"},
        },
      );
    }

    const body = await req.json().catch(() => ({}));
    const {jobId} = body as {jobId?: string};
    if (!jobId) {
      return new Response(
        JSON.stringify({error: "Missing jobId"}),
        {
          status: 400,
          headers: {...corsHeaders, "Content-Type": "application/json"},
        },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: job,
      error: jobError,
    } = await supabaseAdmin
      .from("jobs")
      .select("id, user_id, raw_key, format")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({error: "Job not found"}),
        {
          status: 404,
          headers: {...corsHeaders, "Content-Type": "application/json"},
        },
      );
    }

    // Remove the original upload from the raw bucket.
    if (job.raw_key) {
      const {error: rawError} = await supabaseAdmin.storage
        .from("raw")
        .remove([job.raw_key as string]);
      if (rawError) {
        console.error("Failed to remove raw object for job", jobId, rawError);
      }
    }

    // Remove the generated export from the exports bucket, if it exists.
    const exportPath = `${job.user_id}/${jobId}/statement.${job.format}`;
    const {error: exportError} = await supabaseAdmin.storage
      .from("exports")
      .remove([exportPath]);
    if (exportError) {
      console.error(
        "Failed to remove export object for job",
        jobId,
        exportError,
      );
    }

    // Finally, delete the job row itself.
    const {error: deleteError} = await supabaseAdmin
      .from("jobs")
      .delete()
      .eq("id", jobId)
      .eq("user_id", user.id);

    if (deleteError) {
      return new Response(
        JSON.stringify({error: deleteError.message ?? "Failed to delete job"}),
        {
          status: 500,
          headers: {...corsHeaders, "Content-Type": "application/json"},
        },
      );
    }

    return new Response(
      JSON.stringify({success: true}),
      {
        status: 200,
        headers: {...corsHeaders, "Content-Type": "application/json"},
      },
    );
  } catch (e) {
    console.error("job-delete error", e);
    return new Response(
      JSON.stringify({error: String(e)}),
      {
        status: 500,
        headers: {...corsHeaders, "Content-Type": "application/json"},
      },
    );
  }
});

