"use client";

import {
  Coins,
  Zap,
  FileSpreadsheet,
  Shield,
  Download,
  Sparkles,
  Target,
  Building2,
  CircleStar,
} from "lucide-react";
import { useBalance, useTopupBundles, useTopUpMutation } from "@/lib/queries";
import { Button, Card, CardBody, Spinner, Alert, addToast } from "@heroui/react";

const BUNDLE_ADVANTAGES: Record<
  string,
  Array<{ icon: React.ComponentType<{ className?: string }>; text: string }>
> = {
  pkg_1: [
    { icon: Zap, text: "Instant delivery" },
    { icon: FileSpreadsheet, text: "CSV, XLSX & QBO export" },
    { icon: Shield, text: "Secure & simple" },
    { icon: Sparkles, text: "Just enough for a couple of conversions" },
    { icon: Download, text: "Perfect to try it out—no commitment" },
  ],
  pkg_2: [
    { icon: Zap, text: "Instant delivery" },
    { icon: FileSpreadsheet, text: "CSV, XLSX & QBO export" },
    { icon: Shield, text: "Secure & simple" },
    { icon: Target, text: "For when you know what you want to do" },
    { icon: Download, text: "Sweet spot for regular use" },
  ],
  pkg_3: [
    { icon: Zap, text: "Instant delivery" },
    { icon: FileSpreadsheet, text: "CSV, XLSX & QBO export" },
    { icon: Shield, text: "Secure & simple" },
    { icon: Building2, text: "Tons of conversions for real business use" },
    { icon: Download, text: "Built for teams and serious volume" },
  ],
};

export default function TopUpPage() {
  const { data: balanceData } = useBalance();
  const { data: bundles, isLoading, error } = useTopupBundles();
  const topUp = useTopUpMutation();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Spinner size="lg" color="default" label="Loading pricing…" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        color="danger"
        title="Error"
        description="Failed to load pricing."
        className="max-w-xl"
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-foreground">Top Up</h1>
        <p className="mt-1 text-sm text-default-600">
          Buy coin packages to run conversions. Your current balance is{" "}
          <span className="font-semibold">
            {balanceData?.coins ?? 0} coins
          </span>
          .
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3 items-stretch">
        {bundles?.map((pkg) => {
          const isSilver = pkg.id === "pkg_2";
          const isGold = pkg.id === "pkg_3";
          const popular = (pkg as { popular?: boolean }).popular;

          return (
            <Card
              key={pkg.id}
              className={`relative overflow-hidden border flex flex-col h-full ${
                isSilver
                  ? "border-slate-400 dark:border-slate-500 shadow-lg shadow-slate-400/25 dark:shadow-slate-500/20"
                  : isGold
                    ? "border-amber-400 dark:border-amber-500 shadow-lg shadow-amber-400/25 dark:shadow-amber-500/20"
                    : popular
                      ? "border-foreground bg-default-50"
                      : "border-default-200"
              }`}
            >
              {isSilver && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <CircleStar
                      key={i}
                      className="absolute h-2.5 w-2.5 text-slate-200/85 dark:text-slate-100/85 animate-coin-fall"
                      style={{
                        left: `${5 + ((i * 41) % 88)}%`,
                        top: `${-16 + ((i * 31) % 118)}%`,
                        animationDelay: `${i * 0.3}s`,
                        animationDuration: `${5 + (i % 3) * 0.8}s`,
                      }}
                    />
                  ))}
                </div>
              )}
              {isGold && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <CircleStar
                      key={i}
                      className="absolute h-2.5 w-2.5 text-amber-200/90 dark:text-amber-100/90 animate-coin-fall"
                      style={{
                        left: `${8 + ((i * 47) % 84)}%`,
                        top: `${-18 + ((i * 27) % 120)}%`,
                        animationDelay: `${i * 0.28}s`,
                        animationDuration: `${5.2 + (i % 3) * 0.9}s`,
                      }}
                    />
                  ))}
                </div>
              )}
              {popular && (
                <span className="absolute right-4 top-3 z-10 rounded-full bg-foreground px-2.5 py-0.5 text-xs font-medium text-background">
                  Popular
                </span>
              )}
              <CardBody className="relative z-10 flex flex-col flex-1 gap-0">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-warning-500 shrink-0" />
                  <span className="font-semibold text-foreground">
                    {pkg.label ?? (pkg as { name?: string }).name}
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">
                  ${(pkg.priceCents / 100).toFixed(2)}
                </p>
                <p className="text-sm text-default-600">
                  {pkg.coins} coins
                </p>
                <Button
                  className="mt-4 w-full"
                  color="primary"
                  variant="solid"
                  isLoading={topUp.isLoading && topUp.variables === pkg.id}
                  isDisabled={topUp.isLoading}
                  onPress={async () => {
                    try {
                      const result = await topUp.mutateAsync(pkg.id);
                      addToast({
                        title: `Added ${pkg.coins} coins`,
                        description: `New balance: ${result.balance} coins`,
                        color: "success",
                        timeout: 3000,
                      });
                    } catch (e) {
                      addToast({
                        title: "Top up failed",
                        description:
                          e instanceof Error ? e.message : "Please try again.",
                        color: "danger",
                        timeout: 4000,
                      });
                    }
                  }}
                >
                  Buy
                </Button>
                <ul className="mt-4 min-h-[8.5rem] space-y-2 border-t border-default-200 dark:border-default-100 pt-4">
                  {(BUNDLE_ADVANTAGES[pkg.id] ?? []).map(({ icon: Icon, text }) => (
                    <li
                      key={text}
                      className="flex items-center gap-2 text-sm text-default-600"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-primary" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
