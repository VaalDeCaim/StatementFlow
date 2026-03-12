"use client";

import { Card, CardBody, Skeleton } from "@heroui/react";
import { FileBarChart } from "lucide-react";
import type { DashboardMetric } from "@/lib/mock-data";

type Props = {
  metrics: DashboardMetric[] | null;
  isLoading?: boolean;
};

const metricIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Statement Conversions": FileBarChart,
};

const SKELETON_METRICS = Array.from({ length: 3 }).map((_, i) => i);

export function MetricsGrid({ metrics, isLoading }: Props) {
  const showSkeletons = isLoading || !metrics || metrics.length === 0;
  const items = showSkeletons ? SKELETON_METRICS : metrics;

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => {
        const metric = showSkeletons ? null : (item as DashboardMetric);
        const Icon = metric ? metricIcons[metric.label] ?? FileBarChart : FileBarChart;
        return (
          <Card
            key={metric?.id ?? `metric-skeleton-${index}`}
            shadow="none"
            className="border border-default-200/80 bg-background/60 transition-colors hover:border-default-300 hover:bg-default-50/50"
          >
            <CardBody className="flex flex-row items-start justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                {metric ? (
                  <>
                    <p className="text-xs font-medium text-default-500">
                      {metric.label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                      {metric.value}
                    </p>
                  </>
                ) : (
                  <>
                    <Skeleton className="h-3 w-24 rounded-full" />
                    <Skeleton className="mt-3 h-6 w-16 rounded-md" />
                  </>
                )}
              </div>
              <div className="flex shrink-0 items-center">
                <span className="flex size-9 items-center justify-center rounded-lg bg-default-100">
                  <Icon className="size-4 text-default-600" aria-hidden />
                </span>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </section>
  );
}
