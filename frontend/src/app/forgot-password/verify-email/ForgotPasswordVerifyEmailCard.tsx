"use client";

import { Card, CardBody } from "@heroui/react";
import { Mail } from "lucide-react";
import { VerifyRecoveryForm } from "@/components/auth/VerifyRecoveryForm";

type Props = {
  email?: string | null;
};

export function ForgotPasswordVerifyEmailCard({ email }: Props) {
  return (
    <Card shadow="sm" className="border border-default-200">
      <CardBody className="gap-6">
        <div className="flex justify-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary-100">
            <Mail className="size-7 text-primary-600" aria-hidden />
          </div>
        </div>
        {email ? (
          <p className="text-center text-sm text-default-600">
            Code sent to <strong className="text-foreground">{email}</strong>.
            <br />
            Check your inbox and spam folder.
          </p>
        ) : (
          <p className="text-center text-sm text-default-600">
            Enter the code from the password reset email, or use the link in the
            email. If you don&apos;t have it, go back and request a new code.
          </p>
        )}
        <VerifyRecoveryForm email={email} />
      </CardBody>
    </Card>
  );
}
