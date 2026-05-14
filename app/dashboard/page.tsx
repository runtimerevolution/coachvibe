import type { Metadata } from "next";
import { redirect } from "next/navigation";
import CoachOS from "@/components/coachos/CoachOS";
import { readAuthState, resolveAuthRoute } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard — CoachOS",
};

export default function DashboardPage() {
  const auth = readAuthState();
  if (!auth.loggedIn) redirect("/sign-in");
  if (!auth.onboarded) redirect(resolveAuthRoute(auth));

  return <CoachOS />;
}
