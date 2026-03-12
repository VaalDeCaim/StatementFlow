"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  realUploadInit,
  realUploadToStorage,
  realCreateJob,
} from "@/lib/convert-api";
import type { ExportFormat } from "@/lib/api-types";
import { queryKeys } from "@/lib/queries/keys";

export function useUploadInit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      filename,
      contentType,
    }: {
      filename: string;
      contentType: string;
    }) => realUploadInit(filename, contentType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
    },
  });
}

export function useUploadToStorage() {
  return useMutation({
    mutationFn: ({
      key,
      token,
      file,
    }: {
      key: string;
      token: string;
      file: File;
    }) => realUploadToStorage(key, token, file),
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      key,
      format,
    }: { key: string; format: ExportFormat }) =>
      realCreateJob(key, format),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
      queryClient.invalidateQueries({ queryKey: queryKeys.balance });
    },
  });
}
