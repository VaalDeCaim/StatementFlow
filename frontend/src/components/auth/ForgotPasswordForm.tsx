"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, CardBody, Input } from "@heroui/react";
import { Mail, ArrowLeft } from "lucide-react";
import { useForgotPasswordMutation } from "@/lib/queries/use-auth";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";

const labelClass = "text-xs font-medium text-default-700";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const forgotPasswordMutation = useForgotPasswordMutation();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: ForgotPasswordInput) => {
    setSubmitError(null);
    forgotPasswordMutation.mutate(data.email, {
      onSuccess: () => {
        router.push(
          `/forgot-password/verify-email?email=${encodeURIComponent(data.email)}`
        );
      },
      onError: (err) => setSubmitError(err.message ?? "Failed to send reset email"),
    });
  };

  return (
    <Card shadow="sm" className="border border-default-200">
      <CardBody>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          {submitError ? (
            <p className="rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-600" role="alert">
              {submitError}
            </p>
          ) : null}
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                onValueChange={field.onChange}
                name="email"
                type="email"
                label="Email"
                autoComplete="email"
                placeholder="you@company.com"
                labelPlacement="outside"
                description="Enter the email you use to sign in. We'll send a 6-digit code to reset your password."
                startContent={<Mail className="size-4 text-default-400" aria-hidden />}
                classNames={{ label: labelClass }}
                isInvalid={!!errors.email}
                errorMessage={errors.email?.message}
              />
            )}
          />
          <div className="space-y-4 pt-2">
            <Button
              type="submit"
              color="primary"
              className="w-full"
              isDisabled={forgotPasswordMutation.isPending}
              isLoading={forgotPasswordMutation.isPending}
            >
              {forgotPasswordMutation.isPending ? "Sending…" : "Send code"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full gap-2 text-xs"
              startContent={<ArrowLeft className="size-4" aria-hidden />}
              onPress={() => router.push("/login")}
            >
              Back to log in
            </Button>
          </div>
          <p className="mt-1 flex flex-wrap items-center justify-center gap-x-1 text-center text-xs text-default-500">
            <span>Remember your password?</span>
            <Button
              as="button"
              type="button"
              variant="light"
              className="min-w-0 px-1 font-medium text-foreground"
              onPress={() => router.push("/login")}
            >
              Log in
            </Button>
          </p>
        </form>
      </CardBody>
    </Card>
  );
}
