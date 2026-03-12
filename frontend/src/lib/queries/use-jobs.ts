"use client";

import {useInfiniteQuery, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {realDeleteJob, realFetchJobsPage, realGetJobStatus} from "@/lib/convert-api";
import type {Job} from "@/lib/api-types";
import {queryKeys} from "@/lib/queries/keys";

export function useJobs(pageSize = 20) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.jobs, pageSize],
    initialPageParam: null as string | null,
    queryFn: ({pageParam}) =>
      realFetchJobsPage({
        cursor: pageParam,
        limit: pageSize,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useDeleteJobMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => realDeleteJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.jobs});
    },
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
