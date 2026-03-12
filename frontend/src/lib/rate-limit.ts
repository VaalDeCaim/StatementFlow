/**
 * In-memory per-IP rate limit for API routes. Used in middleware.
 * Per-instance in serverless/Edge; for stricter limits use an external store (e.g. Upstash).
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 100;

const store = new Map<
  string,
  { count: number; resetAt: number }
>();

function cleanup(): void {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.resetAt < now) store.delete(key);
  }
}

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  if (store.size > 1000) cleanup();

  const entry = store.get(ip);
  if (!entry || entry.resetAt < now) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_REQUESTS;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
