export type ProductType = 'lead_magnet' | 'tripwire' | 'mini_course' | 'full_course';

export interface LandingPageColors {
  primary: string;
  accent: string;
  lightBg: string;
  textDark: string;
  textMuted: string;
}

export interface HeroSection {
  label: string;
  headline: string;
  headlineAccent: string;
  hook: string;
  solution: string;
  ctaText: string;
  socialProofText: string;
  coachImageUrl: string;
}

export interface TestimonialSection {
  quote: string;
  attribution: string;
  show: boolean;
}

export interface FeatureItem {
  text: string;
}

export interface FeaturesSection {
  heading: string;
  items: FeatureItem[];
  ctaText: string;
}

export interface AboutSection {
  imageUrl: string;
  bio: string;
}

export interface BottomCtaSection {
  headline: string;
  headlineAccent: string;
  subtext: string;
}

export interface LandingPageData {
  productId: string;
  coachId: string;
  productName: string;
  productType: ProductType;
  colors: LandingPageColors;
  embedScript: string;
  hero: HeroSection;
  testimonial: TestimonialSection;
  features: FeaturesSection;
  about: AboutSection;
  bottomCta: BottomCtaSection;
  generatedAt: string;
  published: boolean;
  slug: string;
}

export interface CoachProfile {
  name: string;
  bio: string;
  imageUrl: string;
  personality: string;
  websiteUrl?: string;
}

export interface ProductInfo {
  id: string;
  name: string;
  description: string;
  price: number;
  type: ProductType;
  modules?: string[];
  embedScript: string;
}

export interface GenerationInput {
  coach: CoachProfile;
  product: ProductInfo;
  targetAudience: string;
  testimonialQuote?: string;
  testimonialAttribution?: string;
  colors: LandingPageColors;
}

export type EditablePath =
  | `hero.${keyof HeroSection}`
  | `testimonial.${keyof TestimonialSection}`
  | `features.heading`
  | `features.ctaText`
  | `features.items.${number}.text`
  | `about.${keyof AboutSection}`
  | `bottomCta.${keyof BottomCtaSection}`;
