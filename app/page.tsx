"use client";

import Link from "next/link";

const PURPLE = "#6626e9";

const features = [
  {
    href: "/chat",
    icon: "🎙️",
    title: "AI Chat + Voice",
    desc: "Chat with your coaching AI assistant. Toggle voice mode to hear responses via ElevenLabs TTS.",
    color: PURPLE,
  },
  {
    href: "/coachflow",
    icon: "⚡",
    title: "Coachflow",
    desc: "Automate your coaching business. Connect Gmail, Zoom, Stripe, HubSpot and 6 more tools.",
    color: "#41D5E2",
  },
  {
    href: "/landing-page",
    icon: "🚀",
    title: "Landing Page Builder",
    desc: "Generate high-converting landing pages for your products with AI-powered copy and brand colours.",
    color: "#FFAD0D",
  },
];

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "#F8F7FC", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 60 }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: PURPLE, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: `0 8px 32px ${PURPLE}40` }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="white" />
          </svg>
        </div>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, color: "#1a1a2e", marginBottom: 12, fontFamily: "'Red Hat Display', sans-serif", letterSpacing: "-0.02em" }}>
          Coach<span style={{ color: PURPLE }}>Vibe</span>
        </h1>
        <p style={{ fontSize: "1.1rem", color: "#7A7A7A", maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
          Your AI-powered coaching platform. Voice chat, workflow automation, and AI landing pages — all in one place.
        </p>
      </div>

      {/* Feature cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, width: "100%", maxWidth: 960 }}>
        {features.map(f => (
          <Link key={f.href} href={f.href}>
            <div style={{ background: "#fff", borderRadius: 20, padding: "32px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #F0EDF5", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", height: "100%" }}
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${f.color}20`; }}
              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: f.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 20 }}>{f.icon}</div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1a1a2e", marginBottom: 10, fontFamily: "'Red Hat Display', sans-serif" }}>{f.title}</h2>
              <p style={{ fontSize: "0.9rem", color: "#7A7A7A", lineHeight: 1.6, marginBottom: 20 }}>{f.desc}</p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.85rem", fontWeight: 700, color: f.color }}>
                Open {f.title} <span>→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <p style={{ marginTop: 48, fontSize: "0.8rem", color: "#B0A8C8" }}>
        Powered by ElevenLabs · OpenAI · PostgreSQL
      </p>
    </div>
  );
}
