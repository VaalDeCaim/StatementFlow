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

function mapRowToJob(row: JobRow): Job {
  const validationReport: ValidationReport | undefined =
    row.validation_errors != null || row.validation_warnings != null
      ? {
          accounts: row.account_count ?? 0,
          transactions: row.transaction_count ?? 0,
          warnings: Array.isArray(row.validation_warnings) ? row.validation_warnings : [],
          errors: Array.isArray(row.validation_errors) ? row.validation_errors : [],
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
  const { getSupabaseClient } = await import("./supabase/client");
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase not configured");
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) throw new Error("Not authenticated");
  // Refresh session so the access_token is not expired (avoids "Invalid JWT" at Edge Functions)
  const { data: { session: refreshed }, error: refreshError } = await supabase.auth.refreshSession();
  const token = refreshed?.access_token ?? session.access_token;
  if (refreshError && !token) throw new Error("Not authenticated");
  return token;
}

const getFunctionsUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL not set");
  return `${url}/functions/v1`;
};

export async function realUploadInit(
  filename: string,
  contentType: string
): Promise<UploadInitResponse> {
  const token = await getSessionToken();
  const res = await fetch(`${getFunctionsUrl()}/uploads-init`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ filename, contentType }),
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
  file: File
): Promise<void> {
  const { getSupabaseClient } = await import("./supabase/client");
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.storage
    .from("raw")
    .uploadToSignedUrl(key, token, file, { contentType: file.type });
  if (error) throw new Error(error.message);
}

export async function realCreateJob(
  key: string,
  format: ExportFormat
): Promise<CreateJobResponse> {
  const token = await getSessionToken();
  const res = await fetch(`${getFunctionsUrl()}/jobs-create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ key, format }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? res.statusText);
  }
  return res.json();
}

export async function realFetchJobs(): Promise<Job[]> {
  const { getSupabaseClient } = await import("./supabase/client");
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("jobs")
    .select("id, status, format, file_name, created_at, completed_at, validation_errors, validation_warnings, account_count, transaction_count")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRowToJob);
}

export async function realGetJobStatus(jobId: string): Promise<Job | null> {
  const { getSupabaseClient } = await import("./supabase/client");
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("jobs")
    .select("id, status, format, file_name, created_at, completed_at, validation_errors, validation_warnings, account_count, transaction_count")
    .eq("id", jobId)
    .single();
  if (error || !data) return null;
  return mapRowToJob(data as JobRow);
}

/** Returns a signed download URL; open in new tab or use <a download> to avoid CORS. */
export async function realDownloadExport(
  jobId: string,
  format: string
): Promise<string> {
  const token = await getSessionToken();
  const res = await fetch(`${getFunctionsUrl()}/exports-download`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ jobId, format }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? res.statusText);
  }
  const { url } = await res.json();
  if (!url) throw new Error("No download URL");
  return url;
}
