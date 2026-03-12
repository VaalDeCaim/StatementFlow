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

    const body = await req.json().catch(() => ({}));
    const { jobId, format } = body as { jobId?: string; format?: string };
    if (!jobId || !format) {
      return new Response(
        JSON.stringify({ error: "Missing jobId or format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("id, user_id")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .single();

    if (jobErr || !job) {
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const path = `${job.user_id}/${jobId}/statement.${format}`;
    const { data: signed, error } = await supabase.storage
      .from("exports")
      .createSignedUrl(path, 300);

    if (error || !signed?.signedUrl) {
      return new Response(
        JSON.stringify({ error: "Export not found or expired" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Local Supabase returns signed URLs with internal host (e.g. kong:8000); rewrite so the browser can reach it
    const publicUrl = Deno.env.get("SUPABASE_URL") ?? "";
    let downloadUrl = signed.signedUrl;
    if (publicUrl) {
      try {
        const internal = new URL(downloadUrl);
        const publicOrigin = new URL(publicUrl).origin;
        if (internal.hostname === "kong" || internal.hostname?.includes("kong")) {
          downloadUrl = publicOrigin + internal.pathname + internal.search;
        }
      } catch {
        // keep original URL if rewrite fails
      }
    }

    return new Response(
      JSON.stringify({ url: downloadUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
