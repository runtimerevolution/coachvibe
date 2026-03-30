import type { GenerationInput, LandingPageData } from './types';

function getProductTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    lead_magnet: 'free resource',
    tripwire: 'low-cost offer',
    mini_course: 'mini course',
    full_course: 'full course',
  };
  return labels[type] || 'product';
}

function getPriceContext(price: number, type: string): string {
  if (price === 0 || type === 'lead_magnet') {
    return `This is free. The CTA should emphasise that there is no cost. Use language like "Watch it free", "Get instant access", "Download free".`;
  }
  if (price <= 20) {
    return `This costs $${price}. It's a low-cost offer. The CTA should minimise price friction. Use language like "Get access for $${price}", "Start for just $${price}".`;
  }
  return `This costs $${price}. The CTA should convey value. Use language like "Enrol now", "Get started", "Join the course".`;
}

export function buildGenerationPrompt(input: GenerationInput): string {
  const { coach, product, targetAudience, testimonialQuote, testimonialAttribution } = input;
  const typeLabel = getProductTypeLabel(product.type);
  const priceContext = getPriceContext(product.price, product.type);

  const modulesContext = product.modules?.length
    ? `The product contains these modules/sections: ${product.modules.join(', ')}.`
    : '';

  const testimonialContext = testimonialQuote
    ? `The coach provided this testimonial: "${testimonialQuote}" — ${testimonialAttribution || 'Anonymous'}.
       Use this testimonial as-is. Do not rewrite it. Set testimonial.show to true.`
    : `No testimonial was provided. Generate a plausible placeholder testimonial that matches the product topic and target audience. Make it specific and results-oriented. Set testimonial.show to true but add an HTML comment "REPLACE WITH REAL TESTIMONIAL" in the attribution.`;

  return `You are a direct-response copywriter who specialises in neuroscience-based landing pages for coaches and course creators. Your copy is punchy, personal, and converts.

## WRITING RULES
- Write in the coach's voice. Their tone is: ${coach.personality || 'warm, direct, and confident'}.
- Use sentence case throughout. Never title case.
- Never use em dashes. Use commas or full stops instead.
- Never use contrast/reframe sentence structures like "Not X. Y." or "It's not X, it's Y."
- Keep paragraphs short. Maximum 2-3 sentences.
- The hook paragraph must be 1-2 sentences max. It should name the target audience's core pain and end on "you know something has to change" energy. Make them feel seen.
- The solution paragraph must be 1-2 sentences max. It should position the coach as someone who has been there and fixed it, and this ${typeLabel} is how.
- Feature items should create curiosity gaps. Tease what's inside without giving it away. Use specific details where possible (numbers, locations, tools).
- The bio should be first person, conversational, and include the coach's key credentials from their bio. Rewrite it, don't copy-paste.
- Do not mention specific days of the week (no Monday, Tuesday, etc).
- Do not use the word "fluff".
- Always use * to censor any swear words (e.g. unf*ck, sh*t).
- The social proof text should say "Join X+ [audience noun] who've [action]ed this" where X is a plausible number (100+, 500+, 1000+) based on product type.

## NEUROSCIENCE PRINCIPLES TO APPLY
1. DOPAMINE: Create curiosity gaps in feature teasers. Use parentheticals like "(it's not what you think)" sparingly. Open loops that can only be closed by accessing the product.
2. ENDORPHINS: The hook must validate pain. Name what the reader is experiencing so they think "they get it."
3. OXYTOCIN: The bio and solution copy must build trust through personal story and credentials. First person only.
4. SEROTONIN: Use language that makes the target audience feel like this is specifically for them. Identity reinforcement.
5. NOREPINEPHRINE: Social proof creates urgency. The CTA text should feel immediate and low-friction.

## COACH INFO
Name: ${coach.name}
Bio: ${coach.bio}
Personality/tone: ${coach.personality || 'Not specified, default to warm and direct'}

## PRODUCT INFO
Product name: ${product.name}
Product type: ${typeLabel}
Description: ${product.description}
Price: ${product.price === 0 ? 'Free' : `$${product.price}`}
${priceContext}
${modulesContext}

## TARGET AUDIENCE
${targetAudience}

## TESTIMONIAL
${testimonialContext}

## OUTPUT FORMAT
Return ONLY valid JSON matching this exact structure. No markdown, no code fences, no explanation.

{
  "hero": {
    "label": "string - small text above headline",
    "headline": "string - the full headline including the accented part",
    "headlineAccent": "string - the portion of the headline to highlight in accent color (must be a substring of headline)",
    "hook": "string - 1-2 sentence pain validation paragraph",
    "solution": "string - 1-2 sentence bridge to the product",
    "ctaText": "string - button text, 2-4 words",
    "socialProofText": "string - e.g. 'Join 500+ founders who\\'ve watched this'"
  },
  "testimonial": {
    "quote": "string - the testimonial quote without quotation marks",
    "attribution": "string - e.g. '— Name, Title'",
    "show": true
  },
  "features": {
    "heading": "string - section heading",
    "items": [
      { "text": "string - curiosity-gap teaser, 5-15 words" },
      { "text": "string" },
      { "text": "string" },
      { "text": "string" },
      { "text": "string" },
      { "text": "string" }
    ],
    "ctaText": "string - button text, 2-4 words"
  },
  "about": {
    "bio": "string - first person bio paragraph, 3-5 sentences, conversational"
  },
  "bottomCta": {
    "headline": "string - motivating final headline",
    "headlineAccent": "string - the portion to highlight (must be substring of headline)",
    "subtext": "string - one line of encouragement + action, keep it short"
  }
}`;
}

export function parseGenerationResponse(
  raw: string,
  input: GenerationInput
): Omit<LandingPageData, 'generatedAt' | 'published' | 'slug'> {
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const generated = JSON.parse(cleaned);

  return {
    productId: input.product.id,
    coachId: '',
    productName: input.product.name,
    productType: input.product.type,
    colors: input.colors,
    embedScript: input.product.embedScript,
    hero: {
      ...generated.hero,
      coachImageUrl: input.coach.imageUrl,
    },
    testimonial: generated.testimonial,
    features: generated.features,
    about: {
      imageUrl: input.coach.imageUrl,
      bio: generated.about.bio,
    },
    bottomCta: generated.bottomCta,
  };
}
