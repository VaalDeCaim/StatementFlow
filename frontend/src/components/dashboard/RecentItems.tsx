"use client";

import Link from "next/link";
import { Button, Tooltip, Skeleton } from "@heroui/react";
import { FileUp, FileDown, Settings2, ChevronRight } from "lucide-react";
import type { RecentItem } from "@/lib/mock-data";

type Props = {
  items: RecentItem[] | null;
  isLoading?: boolean;
};

function iconForTitle(title: string) {
  if (title.toLowerCase().includes("upload")) return FileUp;
  if (title.toLowerCase().includes("export")) return FileDown;
  return Settings2;
}

const SKELETON_ITEMS = Array.from({ length: 3 }).map((_, i) => i);

export function RecentItems({ items, isLoading }: Props) {
  const showSkeletons = isLoading || !items;
  const list = showSkeletons ? SKELETON_ITEMS : items;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Recent activity
        </h2>
        <Button
          as={Link}
          href="/dashboard/history"
          variant="light"
          size="sm"
          className="min-w-0 gap-1 text-default-500"
          endContent={<ChevronRight className="size-4" />}
        >
          View all
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-default-200/80 bg-background shadow-sm">
        {list && list.length === 0 && !showSkeletons ? (
          <div className="px-4 py-6 text-sm text-default-500">
            No recent activity yet. Run a conversion to see it here.
          </div>
        ) : (
          <ul className="divide-y divide-default-100">
            {list.map((item, index) => {
              const recent = showSkeletons ? null : (item as RecentItem);
              const Icon = recent ? iconForTitle(recent.title) : Settings2;
              return (
                <li key={recent?.id ?? `recent-skeleton-${index}`}>
                  <div className="flex min-w-0 items-center gap-4 px-4 py-3 transition-colors hover:bg-default-50/80">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-default-100 text-default-600">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      {recent ? (
                        <>
                          <Tooltip content={recent.title} delay={300} closeDelay={0}>
                            <p className="truncate text-sm font-medium text-foreground">
                              {recent.title}
                            </p>
                          </Tooltip>
                          <Tooltip content={recent.subtitle} delay={300} closeDelay={0}>
                            <p className="truncate text-xs text-default-500">
                              {recent.subtitle}
                            </p>
                          </Tooltip>
                        </>
                      ) : (
                        <>
                          <Skeleton className="h-3 w-40 rounded-full" />
                          <Skeleton className="mt-1 h-3 w-28 rounded-full" />
                        </>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-default-400">
                      {recent ? (
                        recent.timestamp
                      ) : (
                        <Skeleton className="h-3 w-12 rounded-full" />
                      )}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
