"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import type { DashboardData } from "@/lib/mock-data";

async function fetchDashboard(): Promise<DashboardData | null> {
  const res = await fetch("/api/dashboard", { credentials: "include" });
  if (!res.ok) return null;
  const data = await res.json();
  return data as DashboardData;
}

export function useDashboardQuery(initialData?: DashboardData | null) {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: fetchDashboard,
    initialData,
    staleTime: 60 * 1000,
  });
}
