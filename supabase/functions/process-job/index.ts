// This file runs in Supabase Edge Functions (Deno).
// Our TS tooling doesn't load Deno global types, so declare the minimal surface we use.
declare const Deno: {
  env: { get(key: string): string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";
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
    const exportPath = `${basePath}/statement.${job.format}`;

    if (job.format === "csv") {
      const csvContent =
        "Date,Description,Amount\n" +
        (transactions > 0 ? `2025-01-01,Converted,${transactions}\n` : "");
      const { error: uploadErr } = await supabase.storage
        .from("exports")
        .upload(exportPath, new Blob([csvContent]), {
          contentType: "text/csv",
          upsert: true,
        });
      if (uploadErr) validationErrors.push("Failed to write export file: csv");
    } else if (job.format === "xlsx") {
      const xlsxBytes = (() => {
        const aoa: (string | number)[][] = [
          ["Date", "Description", "Amount"],
          ...(transactions > 0 ? [["2025-01-01", "Converted", transactions]] : []),
        ];
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Statement");
        const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
        return new Uint8Array(out);
      })();
      const { error: uploadErr } = await supabase.storage
        .from("exports")
        .upload(exportPath, new Blob([xlsxBytes]), {
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          upsert: true,
        });
      if (uploadErr) validationErrors.push("Failed to write export file: xlsx");
    } else if (job.format === "qbo") {
      const qboContent = (() => {
        const now = new Date();
        const fmt = (d: Date) => {
          const pad = (n: number) => String(n).padStart(2, "0");
          return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(
            d.getUTCHours()
          )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
        };

        const dtServer = fmt(now) + ".000[-0:UTC]";
        const dtPosted = fmt(now);
        const acctId = "0000000000";
        const bankId = "000000000";
        const txnList = transactions > 0
          ? `
      <STMTTRN>
        <TRNTYPE>OTHER
        <DTPOSTED>${dtPosted}
        <TRNAMT>${Number(transactions).toFixed(2)}
        <FITID>${jobId}
        <NAME>Converted transactions
        <MEMO>${transactions} transaction(s)
      </STMTTRN>`
          : "";

        return [
          "OFXHEADER:100",
          "DATA:OFXSGML",
          "VERSION:102",
          "SECURITY:NONE",
          "ENCODING:UTF-8",
          "CHARSET:NONE",
          "COMPRESSION:NONE",
          "OLDFILEUID:NONE",
          "NEWFILEUID:NONE",
          "",
          "<OFX>",
          "  <SIGNONMSGSRSV1>",
          "    <SONRS>",
          "      <STATUS>",
          "        <CODE>0",
          "        <SEVERITY>INFO",
          "      </STATUS>",
          `      <DTSERVER>${dtServer}`,
          "      <LANGUAGE>ENG",
          "    </SONRS>",
          "  </SIGNONMSGSRSV1>",
          "  <BANKMSGSRSV1>",
          "    <STMTTRNRS>",
          `      <TRNUID>${jobId}`,
          "      <STATUS>",
          "        <CODE>0",
          "        <SEVERITY>INFO",
          "      </STATUS>",
          "      <STMTRS>",
          "        <CURDEF>USD",
          "        <BANKACCTFROM>",
          `          <BANKID>${bankId}`,
          `          <ACCTID>${acctId}`,
          "          <ACCTTYPE>CHECKING",
          "        </BANKACCTFROM>",
          "        <BANKTRANLIST>",
          `          <DTSTART>${dtPosted}`,
          `          <DTEND>${dtPosted}`,
          txnList,
          "        </BANKTRANLIST>",
          "      </STMTRS>",
          "    </STMTTRNRS>",
          "  </BANKMSGSRSV1>",
          "</OFX>",
          "",
        ].join("\n");
      })();

      const { error: uploadErr } = await supabase.storage
        .from("exports")
        .upload(exportPath, new Blob([qboContent]), {
          contentType: "application/vnd.intu.qbo",
          upsert: true,
        });
      if (uploadErr) validationErrors.push("Failed to write export file: qbo");
    } else {
      validationErrors.push("Unsupported export format");
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
