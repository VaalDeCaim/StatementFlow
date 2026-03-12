import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { getCurrentUser } from "@/lib/server-data";
import { KeyRound, Lock, Shield } from "lucide-react";

const iconClass = "size-5 shrink-0 text-default-500";

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

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Choose a new password for your account. You'll be logged in after saving."
      leftContent={
        <div className="flex flex-col justify-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Set new password
            </h1>
            <p className="text-sm text-default-600">
              Choose a new password for your account. You&apos;ll be logged in
              after saving.
            </p>
          </div>
          <div className="space-y-6">
            <BenefitItem
              icon={<Lock className={iconClass} aria-hidden />}
              title="Strong password"
              description="Use a mix of letters, numbers and symbols. Longer passwords are harder to guess."
            />
            <BenefitItem
              icon={<Shield className={iconClass} aria-hidden />}
              title="Don't reuse passwords"
              description="Avoid using the same password on other sites. A unique password keeps this account safer."
            />
            <BenefitItem
              icon={<KeyRound className={iconClass} aria-hidden />}
              title="Private and secure"
              description="We never store your password in plain text. You'll be signed in automatically after saving."
            />
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}
