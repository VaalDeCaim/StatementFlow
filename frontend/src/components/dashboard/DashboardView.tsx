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
      <div className="flex items-center justify-center px-4 py-16">
        <p className="text-sm text-default-600">
          We couldn&apos;t load your dashboard data yet. Try again in a moment.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <DashboardHero />
      <MetricsGrid metrics={data?.metrics ?? null} isLoading={isLoading && !data} />
      <RecentItems items={data?.recent ?? null} isLoading={isLoading && !data} />
    </div>
  );
}
