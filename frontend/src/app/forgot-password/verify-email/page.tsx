import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Lock, Mail, Shield } from "lucide-react";
import { getCurrentUser } from "@/lib/server-data";
import { ForgotPasswordVerifyEmailCard } from "./ForgotPasswordVerifyEmailCard";

const iconClass = "size-5 shrink-0 text-default-500";

type Props = {
  searchParams: Promise<{ email?: string }>;
};

function BenefitItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-default-100">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-default-600">{description}</p>
      </div>
    </div>
  );
}

export default async function ForgotPasswordVerifyEmailPage({
  searchParams,
}: Props) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }
  const { email } = await searchParams;

  return (
    <AuthLayout
      title="Enter verification code"
      subtitle="We sent a 6-digit code to your email. Enter it below to continue to set a new password."
      leftContent={
        <div className="flex flex-col justify-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Enter verification code
            </h1>
            <p className="text-sm text-default-600">
              We sent a 6-digit code to your email. Enter it below to continue to
              set a new password.
            </p>
          </div>
          <div className="space-y-6">
            <BenefitItem
              icon={<Shield className={iconClass} aria-hidden />}
              title="Secure verification"
              description="The code confirms only you have access to this email. We never share it."
            />
            <BenefitItem
              icon={<Lock className={iconClass} aria-hidden />}
              title="One-time use"
              description="Each code works only once. Request a new code if it expires or you didn't receive it."
            />
            <BenefitItem
              icon={<Mail className={iconClass} aria-hidden />}
              title="Check your inbox"
              description="The code was sent to the email you entered. Look in spam or promotions if you don't see it."
            />
          </div>
        </div>
      }
    >
      <ForgotPasswordVerifyEmailCard email={email} />
    </AuthLayout>
  );
}
