export type JobStatus = "pending" | "processing" | "completed" | "failed";

export type ExportFormat = "csv" | "xlsx" | "qbo";

export type Job = {
  id: string;
  status: JobStatus;
  format: ExportFormat;
  fileName: string;
  createdAt: string;
  completedAt?: string;
  validationReport?: ValidationReport;
};

export type ValidationReport = {
  accounts: number;
  transactions: number;
  warnings: string[];
  errors: string[];
};

export type PricingPackage = {
  id: string;
  name: string;
  coins: number;
  priceCents: number;
  popular?: boolean;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  balance: number;
  subscriptionStatus: "free" | "pro" | "none";
  proCheckoutUrl?: string;
};

export type UploadInitResponse = {
  uploadId: string;
  presignedUrl: string;
  /** Storage path in raw bucket; use with uploadToSignedUrl and pass to jobs-create as key */
  key: string;
};

export type CreateJobResponse = {
  jobId: string;
  status: JobStatus;
};
