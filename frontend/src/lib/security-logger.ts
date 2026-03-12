/**
 * Central place for security-relevant logging. In production this can be
 * wired to an APM or logging provider; for now we use console with
 * minimal structure so auth/DB issues are observable.
 */

const isProduction = () =>
  typeof process !== "undefined" && process.env.NODE_ENV === "production";

export function logAuthBypass(reason: "NO_AUTH" | "DEV_USER_COOKIE"): void {
  if (isProduction()) {
    console.warn("[security] Auth bypass used in production", { reason });
  } else {
    console.warn("[security] Auth bypass active (dev)", { reason });
  }
}

export function logServerDataFailure(
  context: "getCurrentUser" | "getDashboardData",
  error: unknown,
): void {
  const message = error instanceof Error ? error.message : "Unknown error";
  if (isProduction()) {
    console.warn(`[security] ${context} failed`, { message });
  }
}
