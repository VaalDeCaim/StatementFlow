"use client";

import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useForm, Controller} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Button, Card, CardBody, Input, Checkbox} from "@heroui/react";
import {Eye, EyeOff} from "lucide-react";
import {setDevUserCookie, allowDevMode} from "@/lib/auth-config";
import {getSupabaseClient} from "@/lib/supabase/client";
import {useSignUpMutation} from "@/lib/queries/use-auth";
import {signupSchema, type SignupInput} from "@/lib/validations/auth";
import {signupDefaultValues} from "@/lib/demo-auth-defaults";

const labelClass = "text-xs font-medium text-default-700";

export function SignupForm() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const {mutateAsync, isPending, error} = useSignUpMutation();

  const [isSubmitting, setSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: signupDefaultValues,
  });

  const onSubmit = async (data: SignupInput) => {
    setSubmitting(true);
    try {
      await mutateAsync(data);
    } catch (error) {
      console.error(error);
    }
    setSubmitting(false);
  };

  const handleDevContinue = () => {
    setDevUserCookie();
    router.push("/dashboard");
  };

  return (
    <Card shadow="sm" className="border border-default-200">
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {error ? (
            <p
              className="rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-600"
              role="alert"
            >
              {error.message ?? "Oops! Something went wrong!"}
            </p>
          ) : null}
          <Controller
            name="name"
            control={control}
            render={({field}) => (
              <Input
                {...field}
                value={field.value ?? ""}
                onValueChange={field.onChange}
                name="name"
                type="text"
                label="Full name"
                autoComplete="name"
                placeholder="Ada Lovelace"
                labelPlacement="outside"
                classNames={{label: labelClass}}
                isInvalid={!!errors.name}
                errorMessage={errors.name?.message}
              />
            )}
          />
          <Controller
            name="email"
            control={control}
            render={({field}) => (
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
                classNames={{label: labelClass}}
                isInvalid={!!errors.email}
                errorMessage={errors.email?.message}
              />
            )}
          />
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
                label="Password"
                autoComplete="new-password"
                placeholder="••••••••"
                labelPlacement="outside"
                classNames={{label: labelClass}}
                isInvalid={!!errors.password}
                errorMessage={errors.password?.message}
                endContent={
                  <button
                    type="button"
                    tabIndex={-1}
                    className="focus:outline-none"
                    onClick={() => setIsPasswordVisible((v) => !v)}
                    aria-label={
                      isPasswordVisible ? "Hide password" : "Show password"
                    }
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
                label="Confirm password"
                autoComplete="new-password"
                placeholder="••••••••"
                labelPlacement="outside"
                classNames={{label: labelClass}}
                isInvalid={!!errors.confirmPassword}
                errorMessage={errors.confirmPassword?.message}
                endContent={
                  <button
                    type="button"
                    tabIndex={-1}
                    className="focus:outline-none"
                    onClick={() => setIsPasswordVisible((v) => !v)}
                    aria-label={
                      isPasswordVisible ? "Hide password" : "Show password"
                    }
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
          <Controller
            name="terms"
            control={control}
            render={({field}) => (
              <div className="space-y-1">
                <Checkbox
                  name="terms"
                  isSelected={!!field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  classNames={{
                    label: "text-[11px] text-default-600",
                  }}
                  isInvalid={!!errors.terms}
                >
                  I agree to the Terms &amp; Conditions and understand this is a
                  demo environment.
                </Checkbox>
                <p className="text-[11px] text-default-500">
                  You can read our{" "}
                  <Link
                    href="/terms"
                    className="underline underline-offset-2 hover:text-primary"
                  >
                    Terms &amp; Conditions
                  </Link>
                  .
                </p>
                {errors.terms?.message ? (
                  <p className="text-xs text-danger">{errors.terms.message}</p>
                ) : null}
              </div>
            )}
          />
          <div className="space-y-4 pt-2">
            <Button
              type="submit"
              color="primary"
              className="w-full"
              isDisabled={isPending || isSubmitting}
              isLoading={isPending || isSubmitting}
            >
              {isPending || isSubmitting
                ? "Creating account…"
                : "Create account"}
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
            <span>Already have an account?</span>
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
