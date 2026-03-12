export type MockUser = {
  id: string;
  name: string;
  email: string;
};

export type DashboardMetric = {
  id: string;
  label: string;
  value: string;
  trend?: "up" | "down" | "flat";
};

export type RecentItem = {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
};

export type DashboardData = {
  user: MockUser;
  metrics: DashboardMetric[];
  recent: RecentItem[];
};

export const mockUser: MockUser = {
  id: "user_mock_1",
  name: "Founder",
  email: "founder@example.com",
};

export const mockDashboardData: DashboardData = {
  user: mockUser,
  metrics: [
    { id: "m1", label: "Statement Conversions", value: "12" },
  ],
  recent: [
    {
      id: "r1",
      title: "Uploaded bank_statement_march.pdf",
      subtitle: "ACME Bank · 3 accounts",
      timestamp: "2 min ago",
    },
    {
      id: "r2",
      title: "Exported monthly cashflow",
      subtitle: "CSV · QuickBooks-ready",
      timestamp: "27 min ago",
    },
    {
      id: "r3",
      title: "New rule: Ignore transfers",
      subtitle: "Automation · Rules engine",
      timestamp: "Yesterday",
    },
  ],
};

