"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LandingPageBuilder from "@/components/landing-page/LandingPageBuilder";
import type { LandingPageData } from "@/lib/landing-page/types";

const PURPLE = "#6626e9";

interface Product {
  id: string;
  name: string;
  type: string;
}

export default function LandingPageBuilderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
          setSelectedProduct(data.products[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (data: LandingPageData) => {
    await fetch("/api/landing-page/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  const handlePublish = async (data: LandingPageData) => {
    await fetch("/api/landing-page/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

  if (!selectedProduct) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F7FC", fontFamily: "'Quicksand', sans-serif" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #F0EDF5", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/dashboard" style={{ fontSize: 13, color: "#7A7A7A", fontWeight: 600 }}>← Back</Link>
          <div style={{ width: 1, height: 20, background: "#E0E0E0" }} />
          <div style={{ fontWeight: 700, color: "#1a1a2e", fontFamily: "'Red Hat Display', sans-serif" }}>Landing Page Builder</div>
        </div>
        <div style={{ maxWidth: 500, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <h2 style={{ fontFamily: "'Red Hat Display', sans-serif", marginBottom: 8 }}>No products yet</h2>
          <p style={{ color: "#7A7A7A", marginBottom: 24 }}>You need at least one product before building a landing page. Create your first product from the dashboard.</p>
          <Link href="/dashboard" style={{ display: "inline-block", background: PURPLE, color: "#fff", padding: "12px 24px", borderRadius: 10, fontWeight: 700, textDecoration: "none" }}>
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7FC", fontFamily: "'Quicksand', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #F0EDF5", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/dashboard" style={{ fontSize: 13, color: "#7A7A7A", fontWeight: 600 }}>← Back</Link>
        <div style={{ width: 1, height: 20, background: "#E0E0E0" }} />
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FFAD0D15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🚀</div>
        <div>
          <div style={{ fontWeight: 700, color: "#1a1a2e", fontFamily: "'Red Hat Display', sans-serif" }}>Landing Page Builder</div>
          <div style={{ fontSize: 12, color: "#7A7A7A" }}>AI-powered · Inline editable · Instant publish</div>
        </div>

        {products.length > 1 ? (
          <div style={{ marginLeft: "auto" }}>
            <select
              value={selectedProduct.id}
              onChange={e => setSelectedProduct(products.find(p => p.id === e.target.value) ?? null)}
              style={{ fontSize: 12, fontWeight: 700, color: PURPLE, background: PURPLE + "10", border: "none", borderRadius: 12, padding: "8px 16px", cursor: "pointer" }}
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{ marginLeft: "auto", background: PURPLE + "10", borderRadius: 12, padding: "8px 16px" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: PURPLE }}>Product: {selectedProduct.name}</span>
          </div>
        )}
      </div>

      <LandingPageBuilder
        productId={selectedProduct.id}
        productName={selectedProduct.name}
        publicUrl={`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/shop/${selectedProduct.id}`}
        onSave={handleSave}
        onPublish={handlePublish}
      />
    </div>
  );
}
