import type { NextRequest } from "next/server";
import { AUTH_SESSION_COOKIE } from "./auth";

export function requireAuth(req: NextRequest): string | null {
  const value = req.cookies.get(AUTH_SESSION_COOKIE)?.value;
  return value || null;
}
