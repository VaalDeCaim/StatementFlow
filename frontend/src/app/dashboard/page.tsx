import { redirect } from "next/navigation";
import { isAuthDisabled } from "@/lib/auth-config";
import { getCurrentUser, getDashboardData } from "@/lib/server-data";
import { DashboardView } from "@/components/dashboard/DashboardView";

export default async function DashboardPage() {
  const [user, data] = await Promise.all([
    getCurrentUser(),
    getDashboardData(),
  ]);

  const noAuth = isAuthDisabled();

  if (!noAuth && !user) {
    redirect("/");
  }

  return <DashboardView initialData={data} />;
}

