"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import { XCircle, Coins } from "lucide-react";

export default function TopUpCancelPage() {
  return (
    <div className="mx-auto max-w-md space-y-6 rounded-lg border border-default-200 bg-default-50/50 p-8 text-center dark:border-default-100 dark:bg-default-50/20">
      <XCircle className="mx-auto h-14 w-14 text-default-400" />
      <h1 className="text-xl font-semibold text-foreground">
        Payment cancelled
      </h1>
      <p className="text-sm text-default-600">
        You cancelled the payment. No charges were made. You can try again
        whenever you’re ready.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          as={Link}
          href="/dashboard/topup"
          color="primary"
          startContent={<Coins className="h-4 w-4" />}
        >
          Back to Top Up
        </Button>
        <Button as={Link} href="/dashboard" variant="flat">
          Go to dashboard
        </Button>
      </div>
    </div>
  );
}
