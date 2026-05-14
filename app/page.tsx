import { redirect } from "next/navigation";
import { readAuthState, resolveAuthRoute } from "@/lib/auth";

export const metadata = { title: "CoachOS — CoachOS" };

export default function Home() {
  const auth = readAuthState();
  redirect(resolveAuthRoute(auth));
}
