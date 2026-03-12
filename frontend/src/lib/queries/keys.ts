export const queryKeys = {
  user: ["user"] as const,
  dashboard: ["dashboard"] as const,
  jobs: ["jobs"] as const,
  job: (id: string | null) => ["job", id] as const,
  balance: ["balance"] as const,
  pricing: ["pricing"] as const,
};
