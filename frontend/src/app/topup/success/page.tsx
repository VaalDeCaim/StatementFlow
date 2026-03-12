"use client";

import {useEffect} from "react";
import Link from "next/link";
import {useQueryClient} from "@tanstack/react-query";
import {queryKeys} from "@/lib/queries/keys";
import {Button} from "@heroui/react";
import {CheckCircle2, Coins} from "lucide-react";

export default function TopUpSuccessPage() {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({queryKey: queryKeys.balance});
  }, [queryClient]);

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-lg border border-default-200 bg-default-50/50 p-8 text-center dark:border-default-100 dark:bg-default-50/20 mt-16">
      <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
      <h1 className="text-xl font-semibold text-foreground">
        Payment received
      </h1>
      <p className="text-sm text-default-600">
        Your coins have been added to your balance. It may take a moment to
        update—refresh the dashboard if needed.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          as={Link}
          href="/dashboard/topup"
          variant="flat"
          startContent={<Coins className="h-4 w-4" />}
        >
          Buy more coins
        </Button>
        <Button as={Link} href="/dashboard" color="primary">
          Go to dashboard
        </Button>
      </div>
    </div>
  );
}
