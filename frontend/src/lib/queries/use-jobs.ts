"use client";

import { useQuery } from "@tanstack/react-query";
import { realFetchJobs, realGetJobStatus } from "@/lib/convert-api";
import type { Job } from "@/lib/api-types";
import { queryKeys } from "@/lib/queries/keys";

export function useJobs() {
  return useQuery({
    queryKey: queryKeys.jobs,
    queryFn: realFetchJobs,
  });
}

export function useJobStatus(jobId: string | null) {
  return useQuery({
    queryKey: queryKeys.job(jobId),
    queryFn: () => (jobId ? realGetJobStatus(jobId) : null),
    enabled: !!jobId,
  });
}

export function usePollJobStatus(jobId: string | null) {
  return useQuery<Job | null>({
    queryKey: queryKeys.job(jobId),
    queryFn: () => (jobId ? realGetJobStatus(jobId) : Promise.resolve(null)),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === "completed" || data.status === "failed"))
        return false;
      return 2000;
    },
  });
}
