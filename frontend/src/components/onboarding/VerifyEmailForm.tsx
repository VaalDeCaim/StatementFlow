"use client";

import { useState } from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { InputOtp } from "@heroui/input-otp";
import {
  useVerifyOtpMutation,
  useResendConfirmationMutation,
} from "@/lib/queries/use-auth";

const labelClass = "text-xs font-medium text-default-700";
const CODE_LENGTH = 6;

type Props = {
  /** Email address the code was sent to. Required for verify and resend. */
  email?: string | null;
};

export function VerifyEmailForm({ email }: Props) {
  const router = useRouter();
  const [code, setCode] = useState<string>(() => "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [navLoading, setNavLoading] = useState(false);
  const verifyMutation = useVerifyOtpMutation();
  const resendMutation = useResendConfirmationMutation();
  const busy =
    navLoading ||
    isPending ||
    verifyMutation.isPending ||
    resendMutation.isPending;

  const codeString = code;

  const goToLogin = () => {
    setNavLoading(true);
    startTransition(() => {
      router.push("/login");
    });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError(
        "Email is missing. Use the link from your email or request a new code.",
      );
      return;
    }
    if (!codeString.trim()) {
      setError("Enter the code from the email.");
      return;
    }
    verifyMutation.mutate(
      { email, token: codeString },
      {
        onError: (err) => setError(err.message ?? "Invalid or expired code"),
      },
    );
  };

  const handleResend = () => {
    if (!email) return;
    setError(null);
    resendMutation.mutate(email, {
      onSuccess: () => setCode(""),
      onError: (err) => setError(err.message ?? "Failed to resend"),
    });
  };

  return (
    <div className="space-y-4 pt-2">
      <form onSubmit={handleVerify} className="space-y-4">
        {email ? (
          <>
            <div className="justify-center flex flex-col items-center space-y-2">
              <label className={labelClass}>Verification code</label>
              <InputOtp
                length={CODE_LENGTH}
                value={code}
                onValueChange={(value) => {
                  setCode(value);
                  setError(null);
                }}
                autoFocus
                autoComplete="one-time-code"
                isInvalid={!!error}
              />
              {error ? (
                <p className="text-xs text-danger" role="alert">
                  {error}
                </p>
              ) : (
                <p className="text-xs text-default-500">
                  Enter the 6-digit code from the email we sent you.
                </p>
              )}
            </div>
            <Button
              type="submit"
              color="primary"
              className="w-full"
              isLoading={verifyMutation.isPending || isPending}
              isDisabled={busy || !codeString.trim()}
            >
              Verify and continue
            </Button>
          </>
        ) : (
          error && (
            <p
              className="rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-600"
              role="alert"
            >
              {error}
            </p>
          )
        )}
      </form>
      {email ? (
        <Button
          type="button"
          variant="bordered"
          className="w-full"
          isLoading={resendMutation.isPending}
          isDisabled={busy}
          onPress={handleResend}
        >
          {resendMutation.isSuccess ? "Code sent" : "Resend code"}
        </Button>
      ) : null}
      <div className="flex justify-center">
        <Button
          as="button"
          type="button"
          variant="light"
          isDisabled={busy}
          onPress={goToLogin}
          className="min-w-0 px-1 font-medium text-foreground"
        >
          Back to log in
        </Button>
      </div>
    </div>
  );
}
