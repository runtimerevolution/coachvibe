"use client";

import React, { useCallback, useRef } from 'react';
import type { LandingPageData } from '@/lib/landing-page/types';
import EditableText from './EditableText';

interface LandingPageRendererProps {
  data: LandingPageData;
  editable?: boolean;
  onUpdate?: (updated: LandingPageData) => void;
}

const TickIcon: React.FC<{ color: string }> = ({ color }) => (
  <div style={{ flexShrink: 0, width: 28, height: 28, background: color, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
    <svg viewBox="0 0 16 16" fill="none" width={16} height={16}>
      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="#000" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

export const LandingPageRenderer: React.FC<LandingPageRendererProps> = ({ data, editable = false, onUpdate }) => {
  const dataRef = useRef(data);
  dataRef.current = data;

  const update = useCallback((path: string, value: string | boolean) => {
    if (!onUpdate) return;
    const updated = JSON.parse(JSON.stringify(dataRef.current)) as LandingPageData;
    const keys = path.split('.');
    let obj: Record<string, unknown> = updated as unknown as Record<string, unknown>;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = isNaN(Number(keys[i])) ? keys[i] : Number(keys[i]);
      obj = obj[key] as Record<string, unknown>;
    }
    const lastKey = keys[keys.length - 1];
    obj[isNaN(Number(lastKey)) ? lastKey : Number(lastKey)] = value;
    onUpdate(updated);
  }, [onUpdate]);

  const { colors, hero, testimonial, features, about, bottomCta, embedScript } = data;

  const s = {
    page: { fontFamily: "'Quicksand', sans-serif", color: '#000', background: colors.primary, lineHeight: 1.6 },
    atf: { background: colors.primary, color: '#fff', padding: '120px 24px 60px', position: 'relative' as const, overflow: 'hidden' as const },
    atfInner: { maxWidth: 1080, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' },
    label: { display: 'inline-block', color: colors.accent, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase' as const, marginBottom: 20 },
    h1: { fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: 24, fontFamily: "'Red Hat Display', sans-serif" },
    hook: { fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 20 },
    cta: { display: 'inline-block', background: colors.accent, color: '#000', textDecoration: 'none', fontWeight: 800, fontSize: '1rem', padding: '16px 44px', borderRadius: 50, cursor: 'pointer', border: 'none', letterSpacing: '0.02em' },
    socialProof: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 20 },
    proofText: { fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginLeft: 4 },
    heroPhoto: { width: '100%', maxWidth: 420, maxHeight: 520, objectFit: 'cover' as const, objectPosition: 'center top', borderRadius: 16 },
    testimonialBanner: { background: colors.primary, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '48px 24px', textAlign: 'center' as const },
    testimonialInner: { maxWidth: 900, margin: '0 auto' },
    quote: { fontSize: '1.2rem', fontStyle: 'italic' as const, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: 16 },
    quoteMark: { color: colors.accent, fontSize: '3.5rem', fontStyle: 'normal' as const, lineHeight: '0.5', verticalAlign: 'text-top' as const, marginRight: 4 },
    cite: { fontSize: '0.85rem', fontStyle: 'normal' as const, color: 'rgba(255,255,255,0.3)', display: 'block' },
    tease: { background: colors.lightBg, padding: '72px 24px', textAlign: 'center' as const },
    teaseInner: { maxWidth: 960, margin: '0 auto' },
    teaseH2: { fontSize: '1.5rem', fontWeight: 800, marginBottom: 48, letterSpacing: '-0.02em', color: colors.textDark, fontFamily: "'Red Hat Display', sans-serif" },
    teaseGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px 40px', marginBottom: 48, textAlign: 'left' as const },
    teaseCard: { display: 'flex', alignItems: 'flex-start', gap: 14 },
    teaseText: { fontSize: '0.95rem', color: colors.textDark, fontWeight: 500, lineHeight: 1.5 },
    teaseCtaLink: { display: 'inline-block', background: colors.textDark, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem', padding: '14px 36px', borderRadius: 50, cursor: 'pointer', border: 'none' },
    aboutStrip: { padding: '60px 24px', maxWidth: 680, margin: '0 auto', textAlign: 'center' as const },
    aboutPhoto: { width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' as const, objectPosition: 'center top', marginBottom: 20, border: `3px solid ${colors.accent}` },
    aboutText: { fontSize: '1rem', color: colors.textMuted, lineHeight: 1.8 },
    bottomCtaSection: { background: colors.primary, color: '#fff', padding: '80px 24px', textAlign: 'center' as const },
    bottomH2: { fontSize: '2rem', fontWeight: 900, marginBottom: 12, letterSpacing: '-0.02em', fontFamily: "'Red Hat Display', sans-serif" },
    bottomSubtext: { color: 'rgba(255,255,255,0.5)', fontSize: '1rem', marginBottom: 36 },
    embedWrapper: { maxWidth: 500, margin: '0 auto' },
    footer: { textAlign: 'center' as const, padding: '28px 24px', color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', background: colors.primary },
  };

  const renderHeadline = (full: string, accent: string, path: string, style: React.CSSProperties) => {
    if (!accent || !full.includes(accent)) {
      return <EditableText as="h1" value={full} onChange={v => update(path, v)} editable={editable} style={style} />;
    }
    const parts = full.split(accent);
    return (
      <h1 style={style}
        onClick={editable ? () => { const v = prompt('Edit headline:', full); if (v !== null) update(path, v); } : undefined}
        title={editable ? 'Click to edit' : undefined}>
        {parts[0]}<span style={{ color: colors.accent }}>{accent}</span>{parts[1] || ''}
      </h1>
    );
  };

  return (
    <div style={s.page}>
      <section style={s.atf}>
        <div style={s.atfInner}>
          <div>
            <EditableText as="div" value={hero.label} onChange={v => update('hero.label', v)} editable={editable} style={s.label} />
            {renderHeadline(hero.headline, hero.headlineAccent, 'hero.headline', s.h1)}
            <EditableText as="p" value={hero.hook} onChange={v => update('hero.hook', v)} editable={editable} multiline style={s.hook} />
            <EditableText as="p" value={hero.solution} onChange={v => update('hero.solution', v)} editable={editable} multiline style={s.hook} />
            <div style={{ marginTop: 8 }}>
              <a href="#register" style={s.cta}>
                <EditableText value={hero.ctaText} onChange={v => update('hero.ctaText', v)} editable={editable} style={{ color: 'inherit', fontWeight: 'inherit' }} />
              </a>
            </div>
            <div style={s.socialProof}>
              <div style={{ display: 'flex' }}>
                {['SK', 'LR', 'JM'].map((init, i) => (
                  <div key={i} style={{
                    width: 24, height: 24, borderRadius: '50%',
                    border: `2px solid ${colors.primary}`, marginRight: -8,
                    background: i === 0 ? colors.accent : i === 1 ? colors.textMuted : '#555',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6rem', color: '#fff', fontWeight: 700,
                  }}>{init}</div>
                ))}
              </div>
              <EditableText as="span" value={hero.socialProofText} onChange={v => update('hero.socialProofText', v)} editable={editable} style={s.proofText} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hero.coachImageUrl} alt="Coach" style={s.heroPhoto} />
          </div>
        </div>
      </section>

      {testimonial.show && (
        <section style={s.testimonialBanner}>
          <div style={s.testimonialInner}>
            <blockquote style={s.quote}>
              <span style={s.quoteMark}>&ldquo;</span>
              <EditableText value={testimonial.quote} onChange={v => update('testimonial.quote', v)} editable={editable} style={{ color: 'inherit', fontStyle: 'inherit' }} />
            </blockquote>
            <EditableText as="cite" value={testimonial.attribution} onChange={v => update('testimonial.attribution', v)} editable={editable} style={s.cite} />
          </div>
        </section>
      )}

      <div style={{ background: '#fff', color: '#000' }}>
        <section style={s.tease}>
          <div style={s.teaseInner}>
            <EditableText as="h2" value={features.heading} onChange={v => update('features.heading', v)} editable={editable} style={s.teaseH2} />
            <div style={s.teaseGrid}>
              {features.items.map((item, i) => (
                <div key={i} style={s.teaseCard}>
                  <TickIcon color={colors.accent} />
                  <EditableText as="p" value={item.text} onChange={v => update(`features.items.${i}.text`, v)} editable={editable} style={s.teaseText} />
                </div>
              ))}
            </div>
            <button style={s.teaseCtaLink}>
              <EditableText value={features.ctaText} onChange={v => update('features.ctaText', v)} editable={editable} style={{ color: 'inherit', fontWeight: 'inherit' }} />
            </button>
          </div>
        </section>
        <section style={s.aboutStrip}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={about.imageUrl} alt="Coach" style={s.aboutPhoto} />
          <EditableText as="p" value={about.bio} onChange={v => update('about.bio', v)} editable={editable} multiline style={s.aboutText} />
        </section>
      </div>

      <section id="register" style={s.bottomCtaSection}>
        {renderHeadline(bottomCta.headline, bottomCta.headlineAccent, 'bottomCta.headline', s.bottomH2)}
        <EditableText as="p" value={bottomCta.subtext} onChange={v => update('bottomCta.subtext', v)} editable={editable} style={s.bottomSubtext} />
        <div style={s.embedWrapper} dangerouslySetInnerHTML={{ __html: embedScript }} />
      </section>

      <footer style={s.footer}>&copy; {new Date().getFullYear()} All rights reserved.</footer>
    </div>
  );
};

export default LandingPageRenderer;
