"use client";

import { useDashboardQuery } from "@/lib/queries/use-dashboard";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { MetricsGrid } from "@/components/dashboard/MetricsGrid";
import { RecentItems } from "@/components/dashboard/RecentItems";
import type { DashboardData } from "@/lib/mock-data";

type Props = {
  initialData?: DashboardData | null;
};

export function DashboardView({ initialData }: Props) {
  const { data, isLoading, isError } = useDashboardQuery(initialData);

  if (isError || (!data && !isLoading)) {
    return (
      <div className="px-4 py-10">
        <p className="text-sm text-default-600">
          Auth is not wired yet. Set <code>NO_AUTH=true</code> in{" "}
          <code>.env.local</code> to see a mock dashboard with sample data.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center px-4 py-16">
        <p className="text-sm text-default-500">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardHero />
      <MetricsGrid metrics={data.metrics} />
      <RecentItems items={data.recent} />
    </div>
  );
}
