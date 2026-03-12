import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server-data";
import { Card, CardBody } from "@heroui/react";
import { CheckCircle2 } from "lucide-react";
import { GoToDashboardButton } from "@/components/onboarding/GoToDashboardButton";

export default async function OnboardingCompletePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background text-foreground">
      <main className="mx-auto max-w-md px-4 pb-16 pt-20 md:pt-24">
        <Card shadow="sm" className="border border-default-200">
          <CardBody className="gap-6 pb-8 pt-8">
            <div className="flex justify-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-success-100">
                <CheckCircle2 className="size-9 text-success-600" aria-hidden />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-xl font-semibold tracking-tight">
                You&apos;re all set
              </h1>
              <p className="mt-2 text-sm text-default-600">
                Your account is ready. Head to the dashboard to upload your first statement.
              </p>
            </div>
            <GoToDashboardButton />
          </CardBody>
        </Card>
      </main>
    </div>
  );
}
