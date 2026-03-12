"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { useUser } from "@/lib/auth-context";
import { setDevUserCookie } from "@/lib/auth-config";

export function LoginHero() {
  const router = useRouter();
  const { user } = useUser();

  if (user) {
    router.replace("/dashboard");
    return null;
  }

  const handleDevContinue = () => {
    setDevUserCookie();
    router.push("/dashboard");
  };

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col gap-10 px-4 py-16 md:flex-row md:items-center md:justify-between md:py-24">
      <div className="max-w-xl space-y-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-default-500">
          StatementFlow · Developer Preview
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Convert MT940 & CAMT.053 to CSV, XLSX, or QBO.
        </h1>
        <p className="text-base text-default-600">
          Upload MT940 or CAMT.053 statements, get validated transactions and
          balances, and export to CSV, XLSX, or QuickBooks. No manual reformatting.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button color="primary" onPress={handleDevContinue}>
            Continue in dev mode
          </Button>
          <Button variant="ghost">View sample statement</Button>
        </div>
        <p className="text-xs text-default-500">
          This screen connects to authentication and uses your account data.
        </p>
      </div>
      <div className="mt-10 w-full max-w-md rounded-3xl border border-default-200 bg-default/80 p-6 shadow-sm backdrop-blur-sm md:mt-0">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-default-500">
          Preview
        </p>
        <p className="text-sm text-default-600">
          “We reduced our month-end close from 7 days to 2 by automating
          statement extraction with StatementFlow.”
        </p>
        <p className="mt-4 text-sm font-medium text-foreground">— CFO, ACME Studio</p>
      </div>
    </section>
  );
}

