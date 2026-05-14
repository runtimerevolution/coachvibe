import { cookies } from "next/headers";

export const AUTH_SESSION_COOKIE = "coachvibe_session";
export const AUTH_ONBOARDED_COOKIE = "coachvibe_onboarded";

export type AuthRoute = "/sign-in" | "/sign-up" | "/onboarding" | "/dashboard";

export interface AuthState {
  loggedIn: boolean;
  onboarded: boolean;
  coachId: string | null;
}

export function parseBooleanCookie(value: string | null | undefined): boolean {
  return value === "true" || value === "1";
}

export function resolveAuthRoute(state: Pick<AuthState, "loggedIn" | "onboarded">): AuthRoute {
  if (!state.loggedIn) return "/sign-in";
  if (!state.onboarded) return "/onboarding";
  return "/dashboard";
}

export function readAuthState(): AuthState {
  const store = cookies();
  const coachId = store.get(AUTH_SESSION_COOKIE)?.value ?? null;
  return {
    loggedIn: Boolean(coachId),
    onboarded: parseBooleanCookie(store.get(AUTH_ONBOARDED_COOKIE)?.value),
    coachId,
  };
}

export function getCoachIdFromCookie(): string | null {
  return cookies().get(AUTH_SESSION_COOKIE)?.value ?? null;
}

export function normalizeName(name: string | null | undefined, email: string): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  const prefix = email.split("@")[0]?.trim();
  return prefix || "Coach";
}
