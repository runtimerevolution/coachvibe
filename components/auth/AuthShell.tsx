import Link from "next/link";
import type { ReactNode } from "react";

const C = {
  purple: "#6626e9",
  orange: "#FFAD0D",
  teal: "#41D5E2",
  pink: "#E55CFF",
  darkGrey: "#4F4F4F",
  grey: "#7A7A7A",
  white: "#FFFFFF",
  lightBg: "#F8F7FC",
  lightPurple: "#F3EEFE",
};

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  footerText: string;
  footerLinkHref: string;
  footerLinkLabel: string;
  children: ReactNode;
}

export default function AuthShell({
  eyebrow,
  title,
  description,
  footerText,
  footerLinkHref,
  footerLinkLabel,
  children,
}: AuthShellProps) {
  return (
    <div style={styles.page}>
      <div style={styles.bgBlobOne} />
      <div style={styles.bgBlobTwo} />

      <div style={styles.shell}>
        <aside style={styles.promo}>
          <div style={styles.brandRow}>
            <div style={styles.brandMark}>C</div>
            <div>
              <div style={styles.brandName}>CoachOS</div>
              <div style={styles.brandTag}>AI coaching platform</div>
            </div>
          </div>

          <div style={styles.badgeRow}>
            <span style={styles.badge}>Built for coaches</span>
            <span style={styles.badgeAlt}>Current design</span>
          </div>

          <h1 style={styles.promoTitle}>{eyebrow}</h1>
          <p style={styles.promoText}>
            {description}
          </p>

          <div style={styles.featureGrid}>
            <div style={styles.featureCard}>
              <div style={styles.featureLabel}>Dashboard</div>
              <div style={styles.featureValue}>CoachOS</div>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureLabel}>Onboarding</div>
              <div style={styles.featureValue}>4 steps</div>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureLabel}>Theme</div>
              <div style={styles.featureValue}>Soft violet</div>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureLabel}>Flow</div>
              <div style={styles.featureValue}>Sign in to dashboard</div>
            </div>
          </div>

          <div style={styles.quoteCard}>
            <div style={styles.quoteMark}>“</div>
            <p style={styles.quoteText}>
              Keep the interface calm, the actions obvious, and the first success fast.
            </p>
            <div style={styles.quoteMeta}>Matches the current product feel</div>
          </div>
        </aside>

        <main style={styles.formWrap}>
          <div style={styles.formCard}>
            <div style={styles.formHeader}>
              <div style={styles.kicker}>CoachOS access</div>
              <h2 style={styles.formTitle}>{title}</h2>
              <p style={styles.formDescription}>{description}</p>
            </div>

            {children}

            <div style={styles.footer}>
              {footerText}{" "}
              <Link href={footerLinkHref} style={styles.footerLink}>
                {footerLinkLabel}
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background: `linear-gradient(135deg, ${C.lightBg} 0%, #fcfbff 45%, #fff7ee 100%)`,
    color: C.darkGrey,
    fontFamily: "'Quicksand', sans-serif",
  },
  bgBlobOne: {
    position: "absolute",
    inset: "-10% auto auto -8%",
    width: 340,
    height: 340,
    borderRadius: "50%",
    background: `radial-gradient(circle, ${C.purple}24 0%, ${C.purple}00 70%)`,
    filter: "blur(10px)",
    pointerEvents: "none",
  },
  bgBlobTwo: {
    position: "absolute",
    inset: "auto -6% 6% auto",
    width: 280,
    height: 280,
    borderRadius: "50%",
    background: `radial-gradient(circle, ${C.teal}22 0%, ${C.teal}00 70%)`,
    pointerEvents: "none",
  },
  shell: {
    position: "relative",
    zIndex: 1,
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
  },
  promo: {
    padding: "48px 56px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 24,
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  brandMark: {
    width: 48,
    height: 48,
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: C.purple,
    color: C.white,
    fontFamily: "'Red Hat Display', sans-serif",
    fontWeight: 800,
    fontSize: 22,
    boxShadow: "0 20px 40px rgba(102, 38, 233, 0.22)",
  },
  brandName: {
    fontFamily: "'Red Hat Display', sans-serif",
    fontSize: 24,
    fontWeight: 800,
    color: "#1f1437",
  },
  brandTag: {
    fontSize: 13,
    color: C.grey,
  },
  badgeRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  badge: {
    padding: "8px 12px",
    borderRadius: 999,
    background: `${C.purple}14`,
    color: C.purple,
    fontSize: 12,
    fontWeight: 700,
  },
  badgeAlt: {
    padding: "8px 12px",
    borderRadius: 999,
    background: `${C.orange}18`,
    color: "#9a6400",
    fontSize: 12,
    fontWeight: 700,
  },
  promoTitle: {
    margin: 0,
    fontFamily: "'Red Hat Display', sans-serif",
    fontSize: "clamp(40px, 5vw, 68px)",
    lineHeight: 0.96,
    letterSpacing: "-0.05em",
    color: "#1b1230",
    maxWidth: 700,
  },
  promoText: {
    margin: 0,
    maxWidth: 600,
    fontSize: 18,
    lineHeight: 1.7,
    color: C.grey,
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
    maxWidth: 560,
  },
  featureCard: {
    background: C.white,
    borderRadius: 20,
    padding: "18px 18px 16px",
    border: "1px solid #F0EDF5",
    boxShadow: "0 18px 50px rgba(74, 35, 120, 0.07)",
  },
  featureLabel: {
    fontSize: 12,
    color: C.grey,
    marginBottom: 8,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  featureValue: {
    fontFamily: "'Red Hat Display', sans-serif",
    fontSize: 20,
    fontWeight: 800,
    color: "#23183e",
  },
  quoteCard: {
    maxWidth: 560,
    background: `linear-gradient(135deg, ${C.white} 0%, #fff8f1 100%)`,
    borderRadius: 24,
    padding: "24px 24px 22px",
    border: "1px solid #F2E9FF",
    boxShadow: "0 24px 60px rgba(102, 38, 233, 0.08)",
  },
  quoteMark: {
    fontFamily: "'Red Hat Display', sans-serif",
    fontSize: 44,
    lineHeight: 1,
    color: C.purple,
    marginBottom: 8,
  },
  quoteText: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.7,
    color: "#362b58",
  },
  quoteMeta: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: 700,
    color: C.grey,
  },
  formWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  formCard: {
    width: "100%",
    maxWidth: 520,
    background: "rgba(255,255,255,0.82)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.8)",
    borderRadius: 28,
    boxShadow: "0 32px 90px rgba(79, 37, 131, 0.12)",
    padding: 32,
  },
  formHeader: {
    marginBottom: 24,
  },
  kicker: {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: 999,
    background: `${C.teal}18`,
    color: "#0c6d78",
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 12,
  },
  formTitle: {
    margin: 0,
    fontFamily: "'Red Hat Display', sans-serif",
    fontSize: 34,
    lineHeight: 1.02,
    color: "#1f1437",
  },
  formDescription: {
    margin: "12px 0 0",
    color: C.grey,
    lineHeight: 1.7,
    fontSize: 15,
  },
  footer: {
    marginTop: 20,
    fontSize: 14,
    color: C.grey,
    textAlign: "center",
  },
  footerLink: {
    color: C.purple,
    fontWeight: 800,
  },
};
