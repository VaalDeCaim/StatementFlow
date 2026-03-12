"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * Handles Supabase email confirmation redirect when tokens are in the URL hash
 * (e.g. #access_token=...&refresh_token=...&type=signup). The server never
 * sees the hash, so we must set the session and redirect on the client.
 */
export function AuthHashHandler() {
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current || typeof window === "undefined") return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const hash = window.location.hash?.slice(1);
    if (!hash) return;

    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    const type = params.get("type");
    const next = params.get("next") ?? (type === "recovery" ? "/reset-password" : "/onboarding");

    if (!access_token || !refresh_token) return;
    // signup = email confirmation, recovery = password reset
    if (type !== "signup" && type !== "recovery") return;

    handled.current = true;

    supabase.auth
      .setSession({ access_token, refresh_token })
      .then(() => {
        // Remove hash from URL without triggering navigation
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        router.refresh();
        router.push(next);
      })
      .catch(() => {
        handled.current = false;
        router.replace("/login?error=Invalid+confirmation+link");
      });
  }, [router]);

  return null;
}
