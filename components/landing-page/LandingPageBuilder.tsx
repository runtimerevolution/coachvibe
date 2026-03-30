"use client";

import React, { useCallback, useState } from 'react';
import type { LandingPageColors, LandingPageData } from '@/lib/landing-page/types';
import LandingPageRenderer from './LandingPageRenderer';

type BuilderState = 'input' | 'generating' | 'editing' | 'published';

interface LandingPageBuilderProps {
  productId: string;
  coachId: string;
  productName: string;
  publicUrl: string;
  existingData?: LandingPageData;
  onSave?: (data: LandingPageData) => Promise<void>;
  onPublish?: (data: LandingPageData) => Promise<void>;
}

const ColorSwatch: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{ width: 24, height: 24, borderRadius: 6, background: color, border: '1px solid rgba(0,0,0,0.1)' }} />
    <span style={{ fontSize: '0.85rem', color: '#666' }}>{label}: {color}</span>
  </div>
);

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #ddd',
  fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s',
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: '#333' };
const btnPrimary: React.CSSProperties = {
  display: 'inline-block', background: '#6626e9', color: '#fff', border: 'none',
  padding: '14px 32px', borderRadius: 8, fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
};

export const LandingPageBuilder: React.FC<LandingPageBuilderProps> = ({
  productId, coachId, productName, publicUrl, existingData, onSave, onPublish,
}) => {
  const [state, setState] = useState<BuilderState>(existingData ? 'editing' : 'input');
  const [pageData, setPageData] = useState<LandingPageData | null>(existingData || null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [testimonialQuote, setTestimonialQuote] = useState('');
  const [testimonialAttribution, setTestimonialAttribution] = useState('');
  const [extractedColors, setExtractedColors] = useState<LandingPageColors | null>(null);
  const [isExtractingColors, setIsExtractingColors] = useState(false);

  const handleUrlBlur = useCallback(async () => {
    if (!websiteUrl || !websiteUrl.startsWith('http')) return;
    setIsExtractingColors(true);
    try {
      const res = await fetch('/api/landing-page/extract-colors', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl }),
      });
      const data = await res.json();
      if (data.success && data.colors) setExtractedColors(data.colors);
    } catch { /* non-critical */ }
    setIsExtractingColors(false);
  }, [websiteUrl]);

  const handleGenerate = useCallback(async () => {
    if (!targetAudience.trim()) { setError('Please describe your target audience'); return; }
    setError(null); setState('generating');
    try {
      const res = await fetch('/api/landing-page/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-coach-id': coachId },
        body: JSON.stringify({
          productId, targetAudience: targetAudience.trim(),
          websiteUrl: websiteUrl.trim() || undefined,
          testimonialQuote: testimonialQuote.trim() || undefined,
          testimonialAttribution: testimonialAttribution.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'Generation failed. Please try again.'); setState('input'); return; }
      setPageData(data.data); setState('editing');
    } catch { setError('Something went wrong. Please try again.'); setState('input'); }
  }, [productId, coachId, websiteUrl, targetAudience, testimonialQuote, testimonialAttribution]);

  const handleSave = useCallback(async () => {
    if (!pageData || !onSave) return;
    setIsSaving(true);
    try { await onSave(pageData); } catch { setError('Failed to save. Please try again.'); }
    setIsSaving(false);
  }, [pageData, onSave]);

  const handlePublish = useCallback(async () => {
    if (!pageData || !onPublish) return;
    setIsSaving(true);
    try {
      const publishedData = { ...pageData, published: true };
      await onPublish(publishedData); setPageData(publishedData); setState('published');
    } catch { setError('Failed to publish. Please try again.'); }
    setIsSaving(false);
  }, [pageData, onPublish]);

  const containerStyle: React.CSSProperties = { fontFamily: "'Quicksand', sans-serif", maxWidth: 600, margin: '0 auto', padding: '40px 24px' };

  if (state === 'input') {
    return (
      <div style={containerStyle}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8, fontFamily: "'Red Hat Display', sans-serif" }}>Generate landing page</h2>
        <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: 32 }}>
          We'll create a high-converting landing page for <strong>{productName}</strong> using your profile, product details, and the info below.
        </p>
        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: 8, marginBottom: 24, fontSize: '0.9rem' }}>{error}</div>}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Your website URL</label>
          <input type="url" placeholder="https://yourwebsite.com" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} onBlur={handleUrlBlur} style={inputStyle} />
          <p style={{ fontSize: '0.8rem', color: '#999', marginTop: 4 }}>We'll extract your brand colours from this.</p>
          {isExtractingColors && <p style={{ fontSize: '0.8rem', color: '#6626e9', marginTop: 8 }}>Extracting colours...</p>}
          {extractedColors && !isExtractingColors && (
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <ColorSwatch color={extractedColors.primary} label="Primary" />
              <ColorSwatch color={extractedColors.accent} label="Accent" />
            </div>
          )}
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Who is this for? *</label>
          <textarea placeholder="e.g. Business owners who are stuck working in their business..." value={targetAudience} onChange={e => setTargetAudience(e.target.value)} style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Testimonial (optional)</label>
          <textarea placeholder="e.g. I immediately made three changes that gave me back ten hours a week." value={testimonialQuote} onChange={e => setTestimonialQuote(e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
          {testimonialQuote && <input type="text" placeholder="Attribution, e.g. Sarah K., Agency founder" value={testimonialAttribution} onChange={e => setTestimonialAttribution(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} />}
        </div>
        <button onClick={handleGenerate} style={btnPrimary}>Generate my landing page</button>
        <p style={{ fontSize: '0.75rem', color: '#999', marginTop: 8 }}>Uses 1 AI credit. You can edit everything after generation.</p>
      </div>
    );
  }

  if (state === 'generating') {
    return (
      <div style={{ ...containerStyle, textAlign: 'center', paddingTop: 120 }}>
        <div style={{ width: 48, height: 48, border: '4px solid #eee', borderTopColor: '#6626e9', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 24px' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, fontFamily: "'Red Hat Display', sans-serif" }}>Building your landing page</h3>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>Extracting brand colours, writing copy, designing layout...</p>
      </div>
    );
  }

  if (state === 'editing' && pageData) {
    return (
      <div>
        <div style={{ position: 'sticky', top: 0, zIndex: 1000, background: '#fff', borderBottom: '1px solid #eee', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: "'Quicksand', sans-serif" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.85rem', color: '#666' }}>Click any text to edit it</span>
            <span style={{ fontSize: '0.75rem', background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: 50, fontWeight: 600 }}>Draft</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSave} disabled={isSaving} style={{ ...btnPrimary, background: '#fff', color: '#333', border: '1px solid #ddd', padding: '10px 20px', fontSize: '0.85rem' }}>
              {isSaving ? 'Saving...' : 'Save draft'}
            </button>
            <button onClick={handlePublish} disabled={isSaving} style={{ ...btnPrimary, padding: '10px 20px', fontSize: '0.85rem' }}>
              {isSaving ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 24px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
        <LandingPageRenderer data={pageData} editable onUpdate={setPageData} />
      </div>
    );
  }

  if (state === 'published' && pageData) {
    return (
      <div style={{ ...containerStyle, textAlign: 'center', paddingTop: 80 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width={32} height={32} viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8, fontFamily: "'Red Hat Display', sans-serif" }}>Your landing page is live</h2>
        <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: 24 }}>Share this link with your audience:</p>
        <div style={{ background: '#f6f6f6', padding: '12px 20px', borderRadius: 8, fontSize: '0.9rem', fontFamily: 'monospace', marginBottom: 24, wordBreak: 'break-all' }}>{publicUrl}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onClick={() => navigator.clipboard.writeText(publicUrl)} style={{ ...btnPrimary, background: '#fff', color: '#333', border: '1px solid #ddd', padding: '10px 20px', fontSize: '0.85rem' }}>Copy link</button>
          <button onClick={() => setState('editing')} style={{ ...btnPrimary, padding: '10px 20px', fontSize: '0.85rem' }}>Edit page</button>
        </div>
      </div>
    );
  }

  return null;
};

export default LandingPageBuilder;
