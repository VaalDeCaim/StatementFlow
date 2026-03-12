"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {useForm, Controller} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Button, Card, CardBody, Input} from "@heroui/react";
import {Lock, Eye, EyeOff} from "lucide-react";
import {
  useUpdatePasswordMutation,
  useSignOutMutation,
} from "@/lib/queries/use-auth";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validations/auth";
import {resetPasswordDefaultValues} from "@/lib/demo-auth-defaults";

const labelClass = "text-xs font-medium text-default-700";

export function ResetPasswordForm() {
  const router = useRouter();
  const {mutateAsync, isPending, error} = useUpdatePasswordMutation();
  const signOutMutation = useSignOutMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: resetPasswordDefaultValues,
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setSubmitError(null);
    try {
      await mutateAsync(data.password);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    }
  };

  const displayError = submitError ?? error?.message ?? null;

  return (
    <Card shadow="sm" className="border border-default-200">
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {displayError ? (
            <p
              className="rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-600"
              role="alert"
            >
              {displayError}
            </p>
          ) : null}
          <Controller
            name="password"
            control={control}
            render={({field}) => (
              <Input
                {...field}
                value={field.value ?? ""}
                onValueChange={field.onChange}
                name="password"
                type={isPasswordVisible ? "text" : "password"}
                label="New password"
                autoComplete="new-password"
                placeholder="••••••••"
                labelPlacement="outside"
                classNames={{label: labelClass}}
                startContent={
                  <Lock className="size-4 text-default-400" aria-hidden />
                }
                endContent={
                  <button
                    type="button"
                    tabIndex={-1}
                    className="focus:outline-none"
                    onClick={() => setIsPasswordVisible((v) => !v)}
                    aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                  >
                    {isPasswordVisible ? (
                      <EyeOff className="size-4 text-default-400" aria-hidden />
                    ) : (
                      <Eye className="size-4 text-default-400" aria-hidden />
                    )}
                  </button>
                }
                isInvalid={!!errors.password}
                errorMessage={errors.password?.message}
              />
            )}
          />
          <Controller
            name="confirmPassword"
            control={control}
            render={({field}) => (
              <Input
                {...field}
                value={field.value ?? ""}
                onValueChange={field.onChange}
                name="confirmPassword"
                type={isPasswordVisible ? "text" : "password"}
                label="Confirm new password"
                autoComplete="new-password"
                startContent={
                  <Lock className="size-4 text-default-400" aria-hidden />
                }
                endContent={
                  <button
                    type="button"
                    tabIndex={-1}
                    className="focus:outline-none"
                    onClick={() => setIsPasswordVisible((v) => !v)}
                    aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                  >
                    {isPasswordVisible ? (
                      <EyeOff className="size-4 text-default-400" aria-hidden />
                    ) : (
                      <Eye className="size-4 text-default-400" aria-hidden />
                    )}
                  </button>
                }
                placeholder="••••••••"
                labelPlacement="outside"
                classNames={{label: labelClass}}
                isInvalid={!!errors.confirmPassword}
                errorMessage={errors.confirmPassword?.message}
              />
            )}
          />
          <div className="space-y-4 pt-2">
            <Button
              type="submit"
              color="primary"
              className="w-full"
              isDisabled={isPending}
              isLoading={isPending}
            >
              {isPending ? "Updating…" : "Set new password"}
            </Button>
            <Button
              type="button"
              variant="bordered"
              className="w-full text-xs"
              onPress={() => {
                signOutMutation.mutate();
              }}
            >
              Back to log in
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
