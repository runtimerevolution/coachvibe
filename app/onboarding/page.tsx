import type { Metadata } from "next";
import { redirect } from "next/navigation";
import OnboardingWizard from "@/components/auth/OnboardingWizard";
import { completeOnboardingAction } from "@/app/actions";
import { readAuthState } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Onboarding — CoachOS",
};

export default function OnboardingPage() {
  const auth = readAuthState();
  if (!auth.loggedIn) redirect("/sign-in");
  if (auth.onboarded) redirect("/dashboard");

  return (
    <OnboardingWizard
      coachId={auth.coachId!}
      completeAction={completeOnboardingAction}
    />
  );
}
