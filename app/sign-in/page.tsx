"use client";

import { useFormState } from "react-dom";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInAction } from "@/app/actions";

export default function SignInPage() {
  const router = useRouter();
  const [state, action] = useFormState(signInAction, null);

  // If no error state it means we got redirected — nothing to do.
  // On mount check if already logged in via a quick redirect guard handled server-side.
  useEffect(() => {
    // nothing — redirect is handled in the server action
  }, [router]);

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>⚡</div>
          <span style={styles.logoText}>CoachOS</span>
        </div>
        <p style={styles.eyebrow}>Welcome back</p>
        <h1 style={styles.title}>Sign in to CoachOS</h1>
        <p style={styles.description}>
          Get back to the dashboard, continue onboarding, and keep the coaching workspace moving.
        </p>

        {state?.error && (
          <div style={styles.errorBanner}>{state.error}</div>
        )}

        <a href="/api/auth/google" style={styles.googleButton}>
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </a>

        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine} />
        </div>

        <form action={action} style={styles.form}>
          <label style={styles.label}>
            <span style={styles.labelText}>Email</span>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            <span style={styles.labelText}>Password</span>
            <input
              name="password"
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              required
              style={styles.input}
            />
          </label>

          <button type="submit" style={styles.primaryButton}>Sign in</button>
        </form>

        <p style={styles.footer}>
          New to CoachOS?{" "}
          <Link href="/sign-up" style={styles.footerLink}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#EDEcf5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 16px",
    fontFamily: "'Quicksand', sans-serif",
  },
  shell: {
    background: "#fff",
    borderRadius: 24,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 440,
    boxShadow: "0 8px 40px rgba(79, 37, 131, 0.10)",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "#6626e9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    color: "#fff",
  },
  logoText: {
    fontSize: 18,
    fontWeight: 800,
    color: "#6626e9",
    fontFamily: "'Red Hat Display', sans-serif",
  },
  eyebrow: {
    margin: "0 0 4px",
    fontSize: 12,
    fontWeight: 700,
    color: "#6626e9",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  title: {
    margin: "0 0 8px",
    fontSize: 24,
    fontWeight: 800,
    color: "#1f1437",
    fontFamily: "'Red Hat Display', sans-serif",
  },
  description: {
    margin: "0 0 28px",
    fontSize: 14,
    color: "#7A7A7A",
    lineHeight: 1.55,
  },
  errorBanner: {
    background: "#FFF0F0",
    border: "1px solid #FFCCCC",
    borderRadius: 12,
    padding: "12px 16px",
    marginBottom: 20,
    fontSize: 14,
    color: "#C00",
    fontWeight: 600,
  },
  form: {
    display: "grid",
    gap: 16,
  },
  label: {
    display: "grid",
    gap: 8,
  },
  labelText: {
    fontSize: 13,
    fontWeight: 800,
    color: "#362b58",
  },
  input: {
    width: "100%",
    borderRadius: 18,
    border: "1px solid #E7DDF8",
    padding: "14px 16px",
    background: "#fff",
    color: "#1f1437",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  },
  primaryButton: {
    marginTop: 4,
    border: "none",
    borderRadius: 999,
    padding: "14px 20px",
    background: "#6626e9",
    color: "#fff",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 20px 40px rgba(102, 38, 233, 0.22)",
    fontFamily: "'Red Hat Display', sans-serif",
  },
  googleButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    padding: "13px 20px",
    borderRadius: 999,
    border: "1.5px solid #E7DDF8",
    background: "#fff",
    color: "#1f1437",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "none",
    fontFamily: "'Quicksand', sans-serif",
    boxSizing: "border-box" as const,
    marginBottom: 4,
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "20px 0",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "#E7DDF8",
  },
  dividerText: {
    fontSize: 12,
    color: "#7A7A7A",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
  },
  footer: {
    marginTop: 24,
    fontSize: 13,
    color: "#7A7A7A",
    textAlign: "center",
  },
  footerLink: {
    color: "#6626e9",
    fontWeight: 700,
    textDecoration: "none",
  },
};
