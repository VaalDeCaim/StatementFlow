"use client";

import type {
  Job,
  UploadInitResponse,
  CreateJobResponse,
  ValidationReport,
  ExportFormat,
} from "./api-types";

type JobRow = {
  id: string;
  status: string;
  format: string;
  file_name: string;
  created_at: string;
  completed_at: string | null;
  validation_errors: string[] | null;
  validation_warnings: string[] | null;
  account_count: number | null;
  transaction_count: number | null;
};

export type JobsPage = {
  items: Job[];
  nextCursor: string | null;
};

function mapRowToJob(row: JobRow): Job {
  const validationReport: ValidationReport | undefined =
    row.validation_errors != null || row.validation_warnings != null
      ? {
          accounts: row.account_count ?? 0,
          transactions: row.transaction_count ?? 0,
          warnings: Array.isArray(row.validation_warnings)
            ? row.validation_warnings
            : [],
          errors: Array.isArray(row.validation_errors)
            ? row.validation_errors
            : [],
        }
      : undefined;

  return {
    id: row.id,
    status: row.status as Job["status"],
    format: row.format as Job["format"],
    fileName: row.file_name,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
    validationReport,
  };
}

async function getSessionToken(): Promise<string> {
  const {getSupabaseClient} = await import("./supabase/client");
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase not configured");
  const {
    data: {session},
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token)
    throw new Error("Not authenticated");
  // Refresh session so the access_token is not expired (avoids "Invalid JWT" at Edge Functions)
  const {
    data: {session: refreshed},
    error: refreshError,
  } = await supabase.auth.refreshSession();
  const token = refreshed?.access_token ?? session.access_token;
  if (refreshError && !token) throw new Error("Not authenticated");
  return token;
}

const getFunctionsUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL not set");
  return `${url}/functions/v1`;
};

/** Headers for Edge Function calls: user JWT + project anon key (gateway requires apikey). */
async function getEdgeFunctionHeaders(): Promise<Record<string, string>> {
  const token = await getSessionToken();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY not set");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    apikey: anonKey,
  };
}

export async function realUploadInit(
  filename: string,
  contentType: string,
): Promise<UploadInitResponse> {
  const headers = await getEdgeFunctionHeaders();
  const res = await fetch(`${getFunctionsUrl()}/uploads-init`, {
    method: "POST",
    headers,
    body: JSON.stringify({filename, contentType}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? res.statusText);
  }
  return res.json();
}

export async function realUploadToStorage(
  key: string,
  token: string,
  file: File,
): Promise<void> {
  const {getSupabaseClient} = await import("./supabase/client");
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase not configured");
  const {error} = await supabase.storage
    .from("raw")
    .uploadToSignedUrl(key, token, file, {contentType: file.type});
  if (error) throw new Error(error.message);
}

export async function realCreateJob(
  key: string,
  format: ExportFormat,
): Promise<CreateJobResponse> {
  const headers = await getEdgeFunctionHeaders();
  const res = await fetch(`${getFunctionsUrl()}/jobs-create`, {
    method: "POST",
    headers,
    body: JSON.stringify({key, format}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? res.statusText);
  }
  return res.json();
}

export async function realFetchJobsPage(params?: {
  cursor?: string | null;
  limit?: number;
}): Promise<JobsPage> {
  const {getSupabaseClient} = await import("./supabase/client");
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase not configured");

  const limit = params?.limit ?? 20;

  let query = supabase
    .from("jobs")
    .select(
      "id, status, format, file_name, created_at, completed_at, validation_errors, validation_warnings, account_count, transaction_count",
    )
    .order("created_at", {ascending: false})
    .limit(limit + 1);

  if (params?.cursor) {
    query = query.lt("created_at", params.cursor);
  }

  const {data, error} = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as JobRow[];
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const items = pageRows.map(mapRowToJob);
  const nextCursor =
    hasMore && items.length > 0 ? items[items.length - 1]!.createdAt : null;

  return {items, nextCursor};
}

type TopupBundle = {
  id: string;
  coins: number;
  priceCents: number;
  label: string;
};

export async function realFetchTopupBundles(): Promise<TopupBundle[]> {
  const headers = await getEdgeFunctionHeaders();
  const res = await fetch(`${getFunctionsUrl()}/topup-bundles`, {
    method: "GET",
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? res.statusText);
  }
  const json = (await res.json()) as {bundles?: TopupBundle[]};
  return json.bundles ?? [];
}

export async function realTopUp(bundleId: string): Promise<{balance: number}> {
  const headers = await getEdgeFunctionHeaders();
  const res = await fetch(`${getFunctionsUrl()}/topup-bundles`, {
    method: "POST",
    headers,
    body: JSON.stringify({bundleId}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? res.statusText);
  }
  return (await res.json()) as {balance: number};
}

/** Creates a Stripe Checkout session for a coin bundle and returns the redirect URL. */
export async function realCreateStripeCheckout(
  bundleId: string,
): Promise<{url: string}> {
  const successBaseUrl =
    typeof window !== "undefined" ? window.location.origin : "";
  const headers = await getEdgeFunctionHeaders();
  const res = await fetch(`${getFunctionsUrl()}/stripe-create-checkout`, {
    method: "POST",
    headers,
    body: JSON.stringify({bundleId, successBaseUrl}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error ?? res.statusText ?? "Failed to create checkout",
    );
  }
  const data = (await res.json()) as {url?: string};
  if (!data?.url) throw new Error("No checkout URL returned");
  return {url: data.url};
}

export async function realGetJobStatus(jobId: string): Promise<Job | null> {
  const {getSupabaseClient} = await import("./supabase/client");
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase not configured");
  const {data, error} = await supabase
    .from("jobs")
    .select(
      "id, status, format, file_name, created_at, completed_at, validation_errors, validation_warnings, account_count, transaction_count",
    )
    .eq("id", jobId)
    .single();
  if (error || !data) return null;
  return mapRowToJob(data as JobRow);
}

/** Returns a signed download URL; open in new tab or use <a download> to avoid CORS. */
export async function realDownloadExport(
  jobId: string,
  format: string,
): Promise<string> {
  const headers = await getEdgeFunctionHeaders();
  const res = await fetch(`${getFunctionsUrl()}/exports-download`, {
    method: "POST",
    headers,
    body: JSON.stringify({jobId, format}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? res.statusText);
  }
  const {url} = await res.json();
  if (!url) throw new Error("No download URL");
  return url;
}

/** Fetches export file content for in-app preview. Returns text for csv/qbo, ArrayBuffer for xlsx. */
export async function realPreviewExport(
  jobId: string,
  format: string,
): Promise<string | ArrayBuffer> {
  const headers = await getEdgeFunctionHeaders();
  const res = await fetch(`${getFunctionsUrl()}/exports-preview`, {
    method: "POST",
    headers,
    body: JSON.stringify({jobId, format}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? res.statusText);
  }
  const fmt = format.toLowerCase();
  if (fmt === "xlsx") {
    return res.arrayBuffer();
  }
  return res.text();
}

/** Calls delete-user Edge Function with a refreshed JWT and OTP. Backend verifies OTP before deleting. */
export async function realDeleteAccount(otp: string): Promise<void> {
  const headers = await getEdgeFunctionHeaders();
  const res = await fetch(`${getFunctionsUrl()}/delete-user`, {
    method: "POST",
    headers,
    body: JSON.stringify({otp: otp.trim()}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? res.statusText ?? "Failed to delete account");
  }
}

export async function realDeleteJob(jobId: string): Promise<void> {
  const headers = await getEdgeFunctionHeaders();
  const res = await fetch(`${getFunctionsUrl()}/job-delete`, {
    method: "POST",
    headers,
    body: JSON.stringify({jobId}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? res.statusText ?? "Failed to delete job");
  }
}
