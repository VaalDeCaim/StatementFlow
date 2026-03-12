"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/keys";

async function fetchBalance(): Promise<{ coins: number }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Auth not configured");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to load balance");
  }

  return { coins: typeof data.balance === "number" ? data.balance : 0 };
}

export function useBalance() {
  return useQuery({
    queryKey: queryKeys.balance,
    queryFn: fetchBalance,
  });
}

