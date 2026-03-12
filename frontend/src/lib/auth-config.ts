const NO_AUTH_FLAG = process.env.NO_AUTH;
const isProduction = () =>
  typeof process !== "undefined" && process.env.NODE_ENV === "production";

export const DEV_USER_COOKIE = "statementflow_dev_user";

/**
 * True only when NO_AUTH is set and we are not in production.
 * In production, auth is never disabled regardless of env.
 */
export function isAuthDisabled(): boolean {
  if (isProduction()) return false;
  return NO_AUTH_FLAG === "true";
}

/**
 * True when dev-mode UI (e.g. "Continue in dev mode") is allowed.
 * Only in non-production when Supabase is not configured.
 */
export function allowDevMode(): boolean {
  return !isProduction();
}

/** Call before navigating to dashboard when using "Continue in dev mode" so the server treats the user as logged in. */
export function setDevUserCookie(): void {
  if (typeof document === "undefined" || isProduction()) return;
  document.cookie = `${DEV_USER_COOKIE}=1; path=/; max-age=${86400 * 7}`;
}

/** Call on logout to clear the dev user cookie. */
export function clearDevUserCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${DEV_USER_COOKIE}=; path=/; max-age=0`;
}

