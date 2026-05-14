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
