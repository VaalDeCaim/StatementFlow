import type {
  Job,
  PricingPackage,
  UserProfile,
  UploadInitResponse,
  CreateJobResponse,
  ValidationReport,
} from "./api-types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const mockJobs: Job[] = [
  {
    id: "job_1",
    status: "completed",
    format: "csv",
    fileName: "statement_march_2025.csv",
    createdAt: "2025-03-10T14:30:00Z",
    completedAt: "2025-03-10T14:30:12Z",
    validationReport: {
      accounts: 2,
      transactions: 156,
      warnings: [],
      errors: [],
    },
  },
  {
    id: "job_2",
    status: "completed",
    format: "xlsx",
    fileName: "acme_bank_q1.xlsx",
    createdAt: "2025-03-09T09:15:00Z",
    completedAt: "2025-03-09T09:15:08Z",
    validationReport: {
      accounts: 1,
      transactions: 89,
      warnings: ["1 duplicate transaction skipped"],
      errors: [],
    },
  },
  {
    id: "job_3",
    status: "failed",
    format: "qbo",
    fileName: "bad_file.mt940",
    createdAt: "2025-03-08T16:00:00Z",
    validationReport: {
      accounts: 0,
      transactions: 0,
      warnings: [],
      errors: ["Invalid MT940 structure", "Missing :20: transaction reference"],
    },
  },
];

const mockPricing: PricingPackage[] = [
  { id: "pkg_1", name: "Starter", coins: 10, priceCents: 990 },
  { id: "pkg_2", name: "Standard", coins: 50, priceCents: 3990, popular: true },
  { id: "pkg_3", name: "Business", coins: 150, priceCents: 9990 },
];

const mockProfile: UserProfile = {
  id: "user_mock_1",
  name: "Founder",
  email: "founder@example.com",
  balance: 42,
  subscriptionStatus: "free",
  proCheckoutUrl: "https://checkout.stripe.com/mock-pro",
};

export async function mockFetchJobs(): Promise<Job[]> {
  await delay(400);
  return [...mockJobs];
}

export async function mockFetchPricing(): Promise<PricingPackage[]> {
  await delay(300);
  return [...mockPricing];
}

export async function mockFetchMe(): Promise<UserProfile> {
  await delay(200);
  return { ...mockProfile };
}

export async function mockUploadInit(): Promise<UploadInitResponse> {
  await delay(500);
  return {
    uploadId: `upload_${Date.now()}`,
    presignedUrl: "https://s3.mock.example/presigned",
    key: `mock/${Date.now()}`,
  };
}

export async function mockCreateJob(
  _uploadId: string,
  format: "csv" | "xlsx" | "qbo"
): Promise<CreateJobResponse> {
  await delay(600);
  const jobId = `job_${Date.now()}`;
  return { jobId, status: "processing" };
}

export async function mockGetJobStatus(jobId: string): Promise<Job | null> {
  await delay(400);
  const existing = mockJobs.find((j) => j.id === jobId);
  if (existing) return { ...existing };
  return {
    id: jobId,
    status: "completed",
    format: "csv",
    fileName: "uploaded_statement.csv",
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    validationReport: {
      accounts: 1,
      transactions: 24,
      warnings: [],
      errors: [],
    },
  };
}

export async function mockGetBalance(): Promise<{ coins: number }> {
  await delay(150);
  return { coins: mockProfile.balance };
}

export async function mockDownloadExport(
  _jobId: string,
  _format: string
): Promise<Blob> {
  await delay(300);
  return new Blob(["mock,csv,data"], { type: "text/csv" });
}
