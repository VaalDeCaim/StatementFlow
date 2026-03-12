"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";

export function GoToDashboardButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const goToDashboard = () => {
    startTransition(() => {
      router.push("/dashboard");
    });
  };

  return (
    <Button
      type="button"
      color="primary"
      size="lg"
      className="w-full"
      isLoading={isPending}
      onPress={goToDashboard}
    >
      Go to dashboard
    </Button>
  );
}
