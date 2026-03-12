"use client";

import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex min-h-screen flex-col min-w-0 pl-56">
        <DashboardHeader />
        <main className="h-[calc(100vh-3.5rem)] overflow-hidden p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
