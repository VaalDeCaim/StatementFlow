"use client";

import { Card, CardBody } from "@heroui/react";
import { Mail } from "lucide-react";
import { VerifyEmailForm } from "./VerifyEmailForm";

export function VerifyEmailCard({ email }: { email?: string }) {
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
            Open the signup email and enter the code, or use the link in the
            email to confirm. If you don’t have the email, go back and sign up
            again.
          </p>
        )}
        <VerifyEmailForm email={email} />
      </CardBody>
    </Card>
  );
}
