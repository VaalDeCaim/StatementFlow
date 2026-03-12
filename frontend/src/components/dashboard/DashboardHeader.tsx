"use client";

import { useRouter } from "next/navigation";
import { User, Coins } from "lucide-react";
import { useUser } from "@/lib/auth-context";
import {useBalance} from "@/lib/queries/use-balance";
import {ThemeSwitcher} from "@/components/ui/ThemeSwitcher";
import { Skeleton } from "@heroui/react";

export function DashboardHeader() {
  const router = useRouter();
  const {user} = useUser();
  const {data: balance, isLoading: balanceLoading} = useBalance();

  const goToTopUp = () => router.push("/dashboard/topup");
  const goToSettings = () => router.push("/dashboard/settings");

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-end border-b border-default-200 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
      <div className="flex items-center gap-4">
        <ThemeSwitcher />
        <button
          type="button"
          onClick={goToTopUp}
          className="flex h-10 cursor-pointer items-center gap-2 rounded-full border border-default-200 bg-default-100 px-3 py-1.5 text-sm font-medium text-default-700 hover:bg-default-200/80 transition-colors"
        >
          <Coins className="h-4 w-4 text-warning-500" />
          {balanceLoading ? (
            <Skeleton className="h-3 w-16 rounded-full" />
          ) : (
            <span>{balance?.coins ?? 0} coins</span>
          )}
        </button>
        <button
          type="button"
          onClick={goToSettings}
          className="flex h-10 cursor-pointer items-center gap-2 rounded-full border border-default-200 bg-default-100 pl-1 pr-3 py-1.5 hover:bg-default-200/80 transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/10 text-foreground">
            <User className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-default-700">
            {user?.name ?? "User"}
          </span>
        </button>
      </div>
    </header>
  );
}
