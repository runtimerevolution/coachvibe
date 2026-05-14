import { NextResponse } from "next/server";
import { AUTH_SESSION_COOKIE, AUTH_ONBOARDED_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(AUTH_SESSION_COOKIE);
  res.cookies.delete(AUTH_ONBOARDED_COOKIE);
  return res;
}
