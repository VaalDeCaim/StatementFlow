"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {useForm, Controller} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Button, Card, CardBody, Input} from "@heroui/react";
import {Eye, EyeOff} from "lucide-react";
import {setDevUserCookie, allowDevMode} from "@/lib/auth-config";
import {getSupabaseClient} from "@/lib/supabase/client";
import {
  useSignInMutation,
  EmailNotConfirmedError,
} from "@/lib/queries/use-auth";
import {loginSchema, type LoginInput} from "@/lib/validations/auth";
import {loginDefaultValues} from "@/lib/demo-auth-defaults";

const labelClass = "text-xs font-medium text-default-700";

export function LoginForm() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const signInMutation = useSignInMutation();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: loginDefaultValues,
  });

  const onSubmit = (data: LoginInput) => {
    setAuthError(null);
    signInMutation.mutate(data, {
      onError: (err) => {
        if (err instanceof EmailNotConfirmedError) {
          router.push(
            `/signup/verify-email?email=${encodeURIComponent(err.email)}`
          );
          return;
        }
        setAuthError(err.message ?? "Invalid email or password");
      },
    });
  };

  const handleDevContinue = () => {
    setDevUserCookie();
    router.push("/dashboard");
  };

  return (
    <Card shadow="sm" className="border border-default-200">
      <CardBody>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          {authError ? (
            <p className="rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-600" role="alert">
              {authError}
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
                classNames={{ label: labelClass }}
                isInvalid={!!errors.email}
                errorMessage={errors.email?.message}
              />
            )}
          />
          <div className="space-y-1">
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  name="password"
                  type={isPasswordVisible ? "text" : "password"}
                  label="Password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  labelPlacement="outside"
                  classNames={{ label: labelClass }}
                  isInvalid={!!errors.password}
                  errorMessage={errors.password?.message}
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
                />
              )}
            />
            <div className="flex justify-end">
              <Button
                as="button"
                type="button"
                variant="light"
                size="sm"
                className="min-w-0 px-0 text-xs font-medium text-default-500"
                onPress={() => router.push("/forgot-password")}
              >
                Forgot password?
              </Button>
            </div>
          </div>
          <div className="space-y-4 pt-2">
            <Button
              type="submit"
              color="primary"
              className="w-full"
              isDisabled={signInMutation.isPending}
              isLoading={signInMutation.isPending}
            >
              {signInMutation.isPending ? "Logging in…" : "Log in"}
            </Button>
            {supabase || !allowDevMode() ? null : (
              <Button
                type="button"
                variant="bordered"
                className="w-full text-xs"
                onPress={handleDevContinue}
              >
                Continue in dev mode
              </Button>
            )}
          </div>
          <p className="mt-1 flex flex-wrap items-center justify-center gap-x-1 text-center text-xs text-default-500">
            <span>Don&apos;t have an account?</span>
            <Button
              as="button"
              type="button"
              variant="light"
              className="min-w-0 px-1 font-medium text-foreground"
              onPress={() => router.push("/signup")}
            >
              Sign up
            </Button>
          </p>
        </form>
      </CardBody>
    </Card>
  );
}
