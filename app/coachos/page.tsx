import { redirect } from "next/navigation";
import { readAuthState, resolveAuthRoute } from "@/lib/auth";

export const metadata = { title: "CoachOS — CoachOS" };

export default function CoachflowPage() {
  const auth = readAuthState();
  redirect(resolveAuthRoute(auth));
}
