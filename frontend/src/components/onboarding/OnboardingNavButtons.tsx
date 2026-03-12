"use client";

import {useState} from "react";
import {useTransition} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@heroui/react";
import {ArrowRight} from "lucide-react";

export function OnboardingNavButtons() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingNext, setLoadingNext] = useState(false);
  const [loadingSkip, setLoadingSkip] = useState(false);
  const busy = loadingNext || loadingSkip || isPending;

  const goToDashboard = () => {
    setLoadingSkip(true);
    startTransition(() => {
      router.push("/dashboard");
    });
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button
        type="button"
        color="primary"
        size="lg"
        className="flex-1"
        endContent={
          !loadingNext ? <ArrowRight className="size-4" aria-hidden /> : null
        }
        isLoading={loadingNext}
        isDisabled={busy}
        onPress={goToDashboard}
      >
        Go to dashboard
      </Button>
    </div>
  );
}
