"use client";

import { useState } from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { useResendConfirmationMutation } from "@/lib/queries/use-auth";

type Props = {
  /** When provided, a "Resend confirmation email" button is shown. */
  email?: string | null;
};

export function VerifyEmailButtons({ email }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [navLoading, setNavLoading] = useState(false);
  const resendMutation = useResendConfirmationMutation();
  const busy = navLoading || isPending || resendMutation.isPending;

  const goToLogin = () => {
    setNavLoading(true);
    startTransition(() => {
      router.push("/login");
    });
  };

  const handleResend = () => {
    if (!email) return;
    resendMutation.mutate(email, {
      onError: () => {},
    });
  };

  return (
    <div className="space-y-3 pt-2">
      {email ? (
        <Button
          type="button"
          variant="bordered"
          className="w-full"
          isLoading={resendMutation.isPending}
          isDisabled={busy}
          onPress={handleResend}
        >
          {resendMutation.isSuccess ? "Email sent" : "Resend confirmation email"}
        </Button>
      ) : null}
      <Button
        type="button"
        color="primary"
        className="w-full"
        isLoading={navLoading}
        isDisabled={busy}
        onPress={goToLogin}
      >
        Back to log in
      </Button>
      <p className="text-center text-xs text-default-500">
        Already confirmed?{" "}
        <Button
          type="button"
          variant="light"
          size="sm"
          className="min-w-0 px-1 font-medium text-foreground"
          isDisabled={busy}
          onPress={goToLogin}
        >
          Log in
        </Button>
      </p>
    </div>
  );
}
