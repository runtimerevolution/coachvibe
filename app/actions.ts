"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_ONBOARDED_COOKIE,
  AUTH_SESSION_COOKIE,
} from "@/lib/auth";
import prisma from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function setSessionCookies(coachId: string, onboarded: boolean) {
  const store = cookies();
  store.set(AUTH_SESSION_COOKIE, coachId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  store.set(AUTH_ONBOARDED_COOKIE, onboarded ? "true" : "false", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export type ActionState = { error: string } | null;

export async function signInAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  const password = formData.get("password") as string | null;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const coach = await prisma.coach.findUnique({ where: { email } });
  if (!coach) {
    return { error: "Invalid email or password" };
  }

  if (!coach.password) {
    return { error: "Invalid email or password" };
  }

  const valid = await bcrypt.compare(password, coach.password);
  if (!valid) {
    return { error: "Invalid email or password" };
  }

  setSessionCookies(coach.id, coach.onboarded);
  redirect(coach.onboarded ? "/dashboard" : "/onboarding");
}

export async function signUpAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const name = (formData.get("name") as string | null)?.trim() || null;
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  const password = formData.get("password") as string | null;

  if (!email) return { error: "Email is required" };
  if (!password || password.length < 6) return { error: "Password must be at least 6 characters" };

  const existing = await prisma.coach.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const coach = await prisma.coach.create({
    data: {
      name: name ?? email.split("@")[0],
      email,
      password: passwordHash,
      credits: 500,
      onboarded: false,
    },
  });

  setSessionCookies(coach.id, false);
  redirect("/onboarding");
}

export async function completeOnboardingAction() {
  const store = cookies();
  const coachId = store.get(AUTH_SESSION_COOKIE)?.value;
  if (!coachId) redirect("/sign-in");

  await prisma.coach.update({
    where: { id: coachId },
    data: { onboarded: true },
  });

  // Seed a default product if coach has none
  const productCount = await prisma.product.count({ where: { coachId } });
  if (productCount === 0) {
    await prisma.product.create({
      data: {
        coachId,
        name: "My Coaching Program",
        description: "Helping ambitious people reach their goals.",
        type: "full_course",
        modules: [],
        embedScript: "",
      },
    });
  }

  await logActivity(coachId, "onboarding.completed", "Onboarding completed");
  await createNotification(coachId, {
    title: "Welcome to CoachOS!",
    body: "Your workspace is set up and ready to go.",
    type: "success",
  });

  store.set(AUTH_ONBOARDED_COOKIE, "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/dashboard");
}

export async function signOutAction() {
  const store = cookies();
  store.delete(AUTH_SESSION_COOKIE);
  store.delete(AUTH_ONBOARDED_COOKIE);
  redirect("/sign-in");
}
