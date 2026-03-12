import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { jobId } = body as { jobId?: string };
    if (!jobId) {
      return new Response(
        JSON.stringify({ error: "Missing jobId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("id, user_id, raw_key, file_name, format")
      .eq("id", jobId)
      .single();

    if (jobErr || !job) {
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase
      .from("jobs")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", jobId);

    const { data: fileData, error: downloadErr } = await supabase.storage
      .from("raw")
      .download(job.raw_key);

    if (downloadErr || !fileData) {
      await supabase
        .from("jobs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          validation_errors: ["Failed to download uploaded file"],
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);
      return new Response(
        JSON.stringify({ error: "Download failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const content = await fileData.text();
    const formatDetected = content.includes(":20:") && content.includes(":25:")
      ? "mt940"
      : content.trimStart().startsWith("<?xml") || content.includes("<BkToCstmrStmt>")
      ? "camt053"
      : "unknown";

    const validationErrors: string[] = [];
    const validationWarnings: string[] = [];
    let accounts = 0;
    let transactions = 0;

    if (formatDetected === "mt940") {
      const lines = content.split(/\r?\n/);
      const accMatches = lines.filter((l) => l.startsWith(":25:")).length;
      accounts = Math.max(1, accMatches);
      const txMatches = lines.filter((l) => l.startsWith(":61:")).length;
      transactions = txMatches;
      if (transactions === 0) validationWarnings.push("No transactions found in MT940");
    } else if (formatDetected === "camt053") {
      accounts = (content.match(/<Acct>/g) ?? []).length;
      transactions = (content.match(/<Ntry>/g) ?? []).length;
      if (transactions === 0) validationWarnings.push("No entries found in CAMT.053");
    } else {
      validationErrors.push("Unsupported format: expected MT940 or CAMT.053");
    }

    const basePath = `${job.user_id}/${jobId}`;
    const csvContent = "Date,Description,Amount\n" + (transactions > 0 ? "2025-01-01,Converted," + transactions + "\n" : "");
    const xlsxContent = "placeholder xlsx";
    const qboContent = "placeholder qbo";

    const formats: { ext: string; body: string; contentType: string }[] = [
      { ext: "csv", body: csvContent, contentType: "text/csv" },
      { ext: "xlsx", body: xlsxContent, contentType: "application/octet-stream" },
      { ext: "qbo", body: qboContent, contentType: "application/octet-stream" },
    ];

    for (const { ext, body, contentType } of formats) {
      const exportPath = `${basePath}/statement.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("exports")
        .upload(exportPath, new Blob([body]), { contentType, upsert: true });
      if (uploadErr) validationErrors.push(`Failed to write export file: ${ext}`);
    }

    const status = validationErrors.length > 0 ? "failed" : "completed";
    await supabase
      .from("jobs")
      .update({
        status,
        completed_at: new Date().toISOString(),
        validation_errors: validationErrors,
        validation_warnings: validationWarnings,
        account_count: accounts,
        transaction_count: transactions,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    return new Response(
      JSON.stringify({
        jobId,
        status,
        accounts: validationErrors.length === 0 ? accounts : 0,
        transactions: validationErrors.length === 0 ? transactions : 0,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
