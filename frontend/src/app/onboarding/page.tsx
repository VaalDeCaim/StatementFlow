import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server-data";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const displayName =
    user.name ?? user.email?.split("@")[0] ?? "there";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background text-foreground">
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-20 md:pt-24">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome, {displayName}
          </h1>
          <p className="mt-2 text-default-600">
            Your StatementFlow account is ready. Here’s how to get started.
          </p>
        </div>

        <OnboardingCard />
      </main>
    </div>
  );
}
