import type { Metadata } from "next";
import { redirect } from "next/navigation";
import CoachOS from "@/components/coachos/CoachOS";
import { readAuthState } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notifications — CoachOS" };

export default function NotificationsPage() {
  const auth = readAuthState();
  if (!auth.loggedIn) redirect("/sign-in");
  if (!auth.onboarded) redirect("/onboarding");
  return <CoachOS />;
}
