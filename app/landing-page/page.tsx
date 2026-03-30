"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LandingPageBuilder from "@/components/landing-page/LandingPageBuilder";
import type { LandingPageData } from "@/lib/landing-page/types";

const PURPLE = "#6626e9";

// Demo product for the builder
const DEMO_PRODUCT = {
  id: "demo-product-001",
  name: "90-Day Business Accelerator",
  type: "full_course" as const,
};

export default function LandingPageBuilderPage() {
  const [coachId, setCoachId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/coach")
      .then(r => r.json())
      .then(data => { if (data.success) setCoachId(data.coach.id); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (data: LandingPageData) => {
    await fetch("/api/landing-page/save", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-coach-id": coachId! },
      body: JSON.stringify(data),
    });
  };

  const handlePublish = async (data: LandingPageData) => {
    await fetch("/api/landing-page/save", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-coach-id": coachId! },
      body: JSON.stringify({ ...data, published: true }),
    });
  };

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8F7FC" }}>
        <div style={{ width: 40, height: 40, border: `4px solid #eee`, borderTopColor: PURPLE, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7FC", fontFamily: "'Quicksand', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #F0EDF5", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/" style={{ fontSize: 13, color: "#7A7A7A", fontWeight: 600 }}>← Back</Link>
        <div style={{ width: 1, height: 20, background: "#E0E0E0" }} />
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FFAD0D15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🚀</div>
        <div>
          <div style={{ fontWeight: 700, color: "#1a1a2e", fontFamily: "'Red Hat Display', sans-serif" }}>Landing Page Builder</div>
          <div style={{ fontSize: 12, color: "#7A7A7A" }}>AI-powered · Inline editable · Instant publish</div>
        </div>
        <div style={{ marginLeft: "auto", background: PURPLE + "10", borderRadius: 12, padding: "8px 16px" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: PURPLE }}>Product: {DEMO_PRODUCT.name}</span>
        </div>
      </div>

      {coachId ? (
        <LandingPageBuilder
          productId={DEMO_PRODUCT.id}
          coachId={coachId}
          productName={DEMO_PRODUCT.name}
          publicUrl={`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/shop/${DEMO_PRODUCT.id}`}
          onSave={handleSave}
          onPublish={handlePublish}
        />
      ) : (
        <div style={{ maxWidth: 500, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontFamily: "'Red Hat Display', sans-serif", marginBottom: 8 }}>Database not ready</h2>
          <p style={{ color: "#7A7A7A", marginBottom: 24 }}>Could not load coach profile. Make sure your database is running and migrations have been applied.</p>
          <code style={{ background: "#f6f6f6", padding: "8px 16px", borderRadius: 8, fontSize: 13 }}>npm run db:migrate</code>
        </div>
      )}
    </div>
  );
}
