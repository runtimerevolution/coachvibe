import type { LandingPageColors } from './types';

interface ExtractedColors {
  primary: string | null;
  accent: string | null;
}

const PRIMARY_VAR_PATTERNS = [
  /--(?:primary|brand|main|theme)[-_]?(?:color)?:\s*(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\))/gi,
  /--(?:color[-_])?(?:primary|brand|main):\s*(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\))/gi,
];

const ACCENT_VAR_PATTERNS = [
  /--(?:accent|secondary|highlight|cta)[-_]?(?:color)?:\s*(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\))/gi,
  /--(?:color[-_])?(?:accent|secondary|highlight):\s*(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\))/gi,
];

const HEX_COLOR_REGEX = /#([0-9a-fA-F]{3,8})\b/g;

function normalizeHex(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length === 3) return '#' + clean.split('').map(c => c + c).join('');
  if (clean.length === 8) return '#' + clean.slice(0, 6);
  return '#' + clean.toLowerCase();
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function isInterestingColor(hex: string): boolean {
  const { s, l } = hexToHsl(normalizeHex(hex));
  if (l > 0.93 || l < 0.07) return false;
  if (s < 0.1) return false;
  return true;
}

function extractFromCssVars(cssText: string): ExtractedColors {
  let primary: string | null = null;
  let accent: string | null = null;
  for (const pattern of PRIMARY_VAR_PATTERNS) {
    const match = pattern.exec(cssText);
    if (match?.[1]) { primary = match[1]; break; }
  }
  for (const pattern of ACCENT_VAR_PATTERNS) {
    const match = pattern.exec(cssText);
    if (match?.[1]) { accent = match[1]; break; }
  }
  return { primary, accent };
}

function extractFrequentColors(cssText: string): string[] {
  const colorCounts = new Map<string, number>();
  let match: RegExpExecArray | null;
  const regex = new RegExp(HEX_COLOR_REGEX.source, 'g');
  while ((match = regex.exec(cssText)) !== null) {
    const hex = normalizeHex(match[0]);
    if (isInterestingColor(hex)) colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
  }
  return Array.from(colorCounts.entries()).sort((a, b) => b[1] - a[1]).map(([color]) => color);
}

function extractThemeColor(html: string): string | null {
  const match = html.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']theme-color["']/i);
  return match?.[1] || null;
}

function generateAccentFromPrimary(primaryHex: string): string {
  const { h, s, l } = hexToHsl(normalizeHex(primaryHex));
  const newH = (h + 160) % 360;
  const newS = Math.min(s * 1.1, 1);
  const newL = l < 0.5 ? Math.min(l + 0.15, 0.65) : Math.max(l - 0.15, 0.35);
  const hslToHex = (h: number, s: number, l: number): string => {
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };
  return hslToHex(newH, newS, newL);
}

export async function extractColorsFromUrl(url: string): Promise<LandingPageColors> {
  const defaults: LandingPageColors = {
    primary: '#000000', accent: '#5EC6C3', lightBg: '#f6f6f6', textDark: '#000000', textMuted: '#3D4355',
  };
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CoachvoxBot/1.0)', Accept: 'text/html' },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return defaults;
    const html = await response.text();
    const themeColor = extractThemeColor(html);
    const styleBlocks = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
    const allCss = styleBlocks.join('\n');
    const cssVarColors = extractFromCssVars(allCss);
    const frequentColors = extractFrequentColors(html);
    let primary = cssVarColors.primary || themeColor || frequentColors[0] || null;
    let accent = cssVarColors.accent || null;
    if (!accent && frequentColors.length > 1) {
      accent = frequentColors.find(c => c !== normalizeHex(primary || '')) || null;
    }
    if (primary && !accent) accent = generateAccentFromPrimary(primary);
    if (primary) primary = normalizeHex(primary);
    if (accent) accent = normalizeHex(accent);
    const primaryHsl = primary ? hexToHsl(primary) : { l: 0 };
    const isDarkPrimary = primaryHsl.l < 0.5;
    return {
      primary: primary || defaults.primary,
      accent: accent || defaults.accent,
      lightBg: defaults.lightBg,
      textDark: isDarkPrimary ? defaults.textDark : primary || defaults.textDark,
      textMuted: defaults.textMuted,
    };
  } catch {
    return defaults;
  }
}

export async function extractColorsDeep(url: string): Promise<LandingPageColors> {
  const basic = await extractColorsFromUrl(url);
  if (basic.accent !== '#5EC6C3' || basic.primary !== '#000000') return basic;
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CoachvoxBot/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    const html = await response.text();
    const cssLinks = html.match(/href=["']([^"']*\.css[^"']*)["']/gi) || [];
    const cssUrls = cssLinks
      .map(link => { const m = link.match(/href=["']([^"']+)["']/); return m?.[1]; })
      .filter(Boolean).slice(0, 3);
    const baseUrl = new URL(url);
    let allExternalCss = '';
    for (const cssUrl of cssUrls) {
      try {
        const fullUrl = cssUrl!.startsWith('http') ? cssUrl! : new URL(cssUrl!, baseUrl).toString();
        const r = await fetch(fullUrl, { signal: AbortSignal.timeout(5000) });
        allExternalCss += await r.text();
      } catch { /* skip */ }
    }
    if (allExternalCss) {
      const cssVarColors = extractFromCssVars(allExternalCss);
      const frequentColors = extractFrequentColors(allExternalCss);
      if (cssVarColors.primary || frequentColors.length > 0) {
        const primary = normalizeHex(cssVarColors.primary || frequentColors[0] || basic.primary);
        const accent = cssVarColors.accent
          ? normalizeHex(cssVarColors.accent)
          : frequentColors.length > 1 ? normalizeHex(frequentColors[1]) : generateAccentFromPrimary(primary);
        return { ...basic, primary, accent };
      }
    }
    return basic;
  } catch {
    return basic;
  }
}
