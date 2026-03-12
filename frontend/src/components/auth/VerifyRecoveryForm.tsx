"use client";

import { useState, useRef } from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import {
  useVerifyRecoveryOtpMutation,
  useResendRecoveryMutation,
} from "@/lib/queries/use-auth";

const labelClass = "text-xs font-medium text-default-700";
const CODE_LENGTH = 6;

type Props = {
  /** Email address the code was sent to. Required for verify and resend. */
  email?: string | null;
};

export function VerifyRecoveryForm({ email }: Props) {
  const router = useRouter();
  const [code, setCode] = useState<string[]>(() => Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [navLoading, setNavLoading] = useState(false);
  const cellRefs = useRef<(HTMLInputElement | null)[]>([]);
  const verifyMutation = useVerifyRecoveryOtpMutation();
  const resendMutation = useResendRecoveryMutation();
  const busy =
    navLoading ||
    isPending ||
    verifyMutation.isPending ||
    resendMutation.isPending;

  const codeString = code.join("");

  const goToLogin = () => {
    setNavLoading(true);
    startTransition(() => {
      router.push("/login");
    });
  };

  const handleCellChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, CODE_LENGTH).split("");
      const next = [...code];
      digits.forEach((d, i) => {
        if (index + i < CODE_LENGTH) next[index + i] = d;
      });
      setCode(next);
      setError(null);
      const focusIndex = Math.min(index + digits.length, CODE_LENGTH - 1);
      cellRefs.current[focusIndex]?.focus();
      return;
    }
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    setError(null);
    if (digit && index < CODE_LENGTH - 1) {
      cellRefs.current[index + 1]?.focus();
    }
  };

  const handleCellKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      cellRefs.current[index - 1]?.focus();
    }
  };

  const handleCellPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH);
    if (!pasted) return;
    const digits = pasted.split("");
    const next = [...code];
    digits.forEach((d, i) => {
      if (i < CODE_LENGTH) next[i] = d;
    });
    setCode(next);
    setError(null);
    const focusIndex = Math.min(digits.length, CODE_LENGTH - 1);
    cellRefs.current[focusIndex]?.focus();
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError(
        "Email is missing. Use the link from your email or request a new code."
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
      }
    );
  };

  const handleResend = () => {
    if (!email) return;
    setError(null);
    resendMutation.mutate(email, {
      onSuccess: () => setCode(Array(CODE_LENGTH).fill("")),
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
              <div className="flex justify-center gap-2">
                {Array.from({ length: CODE_LENGTH }, (_, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      cellRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    maxLength={CODE_LENGTH}
                    aria-label={`Digit ${i + 1}`}
                    value={code[i]}
                    onChange={(e) => handleCellChange(i, e.target.value)}
                    onKeyDown={(e) => handleCellKeyDown(i, e)}
                    onPaste={handleCellPaste}
                    className={`h-12 w-11 rounded-lg border bg-transparent text-center text-lg font-semibold outline-none transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                      error
                        ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/20"
                        : "border-default-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    }`}
                  />
                ))}
              </div>
              {error ? (
                <p className="text-xs text-danger" role="alert">
                  {error}
                </p>
              ) : (
                <p className="text-xs text-default-500">
                  Enter the 6-digit code from the password reset email.
                </p>
              )}
            </div>
            <Button
              type="submit"
              color="primary"
              className="w-full"
              isLoading={verifyMutation.isPending}
              isDisabled={busy || !codeString.trim()}
            >
              Verify and set new password
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
