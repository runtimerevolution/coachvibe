import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { AUTH_SESSION_COOKIE, AUTH_ONBOARDED_COOKIE } from "@/lib/auth";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: COOKIE_MAX_AGE,
};

function errorRedirect(msg: string) {
  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=${encodeURIComponent(msg)}`
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");

  if (errorParam || !code) {
    return errorRedirect("Google sign-in was cancelled");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return errorRedirect("Failed to authenticate with Google");
  }

  const tokens = await tokenRes.json();

  // Get user profile
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!profileRes.ok) {
    return errorRedirect("Failed to get Google profile");
  }

  const profile = await profileRes.json() as {
    id: string;
    email: string;
    name?: string;
    picture?: string;
  };

  if (!profile.email) {
    return errorRedirect("Google account has no email address");
  }

  // Find existing coach by googleId or email, then upsert
  let coach = await prisma.coach.findFirst({
    where: { OR: [{ googleId: profile.id }, { email: profile.email }] },
  });

  if (!coach) {
    coach = await prisma.coach.create({
      data: {
        email: profile.email,
        name: profile.name ?? profile.email.split("@")[0],
        googleId: profile.id,
        imageUrl: profile.picture ?? null,
        credits: 500,
        onboarded: false,
      },
    });
  } else if (!coach.googleId) {
    // Link Google to an existing email/password account
    coach = await prisma.coach.update({
      where: { id: coach.id },
      data: { googleId: profile.id },
    });
  }

  const dest = coach.onboarded
    ? `${appUrl}/dashboard`
    : `${appUrl}/onboarding`;

  const response = NextResponse.redirect(dest);
  response.cookies.set(AUTH_SESSION_COOKIE, coach.id, cookieOptions);
  response.cookies.set(AUTH_ONBOARDED_COOKIE, String(coach.onboarded), cookieOptions);

  return response;
}
