/**
 * CircleTel AI-Powered CMS - Prompt Templates
 *
 * Optimized prompts for Gemini 3 Pro following best practices:
 * - Concise and direct (no verbose chain-of-thought)
 * - Data before questions
 * - Structured output expectations
 * - CircleTel context included
 */

import type { ContentType, TargetAudience, ContentTone } from './types';

// ============================================================================
// CircleTel Context (used in all prompts)
// ============================================================================

export const CIRCLETEL_CONTEXT = `
CircleTel is a leading ISP in South Africa offering:
- **BizFibre**: Business fiber packages (25-1000 Mbps)
- **SkyFibre**: Wireless fixed-line packages (10-100 Mbps)
- **5G LTE**: Mobile wireless packages (10-100 Mbps)

**Target Markets**: B2B (SMEs, enterprises) and B2C (residential)
**Key Values**: Speed, reliability, business continuity, local support
**Brand**: Professional, trustworthy, tech-forward
**Colors**: Orange (#F5831F - primary), Dark Blue (#1E4B85 - selected)
`.trim();

// ============================================================================
// Landing Page Templates
// ============================================================================

export function getLandingPagePrompt(params: {
  topic: string;
  title?: string;
  targetAudience: TargetAudience;
  tone: ContentTone;
  keyPoints?: string[];
  seoKeywords?: string[];
}): string {
  const { topic, title, targetAudience, tone, keyPoints = [], seoKeywords = [] } = params;

  let prompt = `Create a landing page for CircleTel about "${topic}".

${title ? `Title: ${title}\n` : ''}**Target Audience**: ${targetAudience}
**Tone**: ${tone}

${CIRCLETEL_CONTEXT}
`;

  if (keyPoints.length > 0) {
    prompt += `\n**Key Points to Emphasize**:\n`;
    keyPoints.forEach((point, i) => {
      prompt += `${i + 1}. ${point}\n`;
    });
  }

  if (seoKeywords.length > 0) {
    prompt += `\n**SEO Keywords**: ${seoKeywords.join(', ')}\n`;
  }

  prompt += `
**Requirements**:
1. **Hero Section**: Compelling headline (max 60 chars), subheadline (120-150 chars), 2 CTAs
2. **Features Section**: 3-6 key benefits with icons/titles/descriptions
3. **Social Proof**: Testimonials or trust indicators (if relevant)
4. **Final CTA**: Strong call-to-action section
5. **SEO**: Meta title (max 60 chars), meta description (max 155 chars), keywords

**Style Guidelines**:
- Use benefit-focused language (not feature-focused)
- Include numbers/statistics where possible
- Address pain points directly
- Create urgency without being pushy
- Highlight competitive advantages

Return structured JSON with hero, sections, and seo fields.`;

  return prompt;
}

// ============================================================================
// Blog Post Templates
// ============================================================================

export function getBlogPostPrompt(params: {
  topic: string;
  title?: string;
  wordCount?: number;
  targetAudience: TargetAudience;
  tone: ContentTone;
  seoKeywords?: string[];
}): string {
  const { topic, title, wordCount = 800, targetAudience, tone, seoKeywords = [] } = params;

  let prompt = `Write a blog post for CircleTel about "${topic}".

${title ? `Title: ${title}\n` : ''}**Target Audience**: ${targetAudience}
**Tone**: ${tone}
**Word Count**: ~${wordCount} words

${CIRCLETEL_CONTEXT}
`;

  if (seoKeywords.length > 0) {
    prompt += `\n**SEO Keywords**: ${seoKeywords.join(', ')}\n`;
  }

  prompt += `
**Article Structure**:
1. **Introduction** (150 words)
   - Hook: Interesting statistic or question
   - Context: Why this matters to the reader
   - Preview: What they'll learn

2. **Main Content** (500-600 words)
   - 3-5 H2 sections with practical insights
   - Use subheadings (H3) for clarity
   - Include examples and use cases
   - Reference CircleTel solutions naturally (not salesy)

3. **Conclusion** (100-150 words)
   - Summarize key takeaways
   - Actionable next step
   - Soft CTA to CircleTel services

**Writing Style**:
- ${tone === 'Professional' ? 'Authoritative but approachable' : ''}
- ${tone === 'Casual' ? 'Conversational and relatable' : ''}
- ${tone === 'Technical' ? 'Data-driven with technical depth' : ''}
- Use short paragraphs (2-3 sentences max)
- Include transition words for flow
- Break up text with subheadings

**SEO Optimization**:
- Use keywords naturally (no keyword stuffing)
- Include long-tail keyword variations
- Meta title and description optimized for click-through
- Internal linking opportunities (mention other CircleTel content)

Return structured JSON with hero (title/subtitle), sections (text blocks with headings), and seo fields.`;

  return prompt;
}

// ============================================================================
// Product Page Templates
// ============================================================================

export function getProductPagePrompt(params: {
  productName: string;
  category: string; // 'BizFibre', 'SkyFibre', '5G LTE'
  features: string[];
  targetAudience: TargetAudience;
  tone: ContentTone;
}): string {
  const { productName, category, features, targetAudience, tone } = params;

  let prompt = `Create a product showcase page for CircleTel's "${productName}" (${category} package).

**Product Features**:
${features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

**Target Audience**: ${targetAudience}
**Tone**: ${tone}

${CIRCLETEL_CONTEXT}

**Page Structure**:
1. **Hero Section**
   - Product headline emphasizing main benefit
   - Subheadline with speed/reliability promise
   - "Get Started" CTA + "Learn More" CTA

2. **Key Features Section**
   - Highlight 4-6 standout features
   - Focus on benefits (not technical specs)
   - Use icon-friendly descriptions

3. **Use Cases Section**
   - 2-3 scenarios where this package excels
   - Real-world examples (e.g., "Perfect for remote teams of 10-20")

4. **Pricing/Plans Section** (if applicable)
   - Transparent pricing structure
   - What's included
   - No hidden fees messaging

5. **Trust Signals**
   - Uptime guarantee
   - Local South African support
   - Installation timeline
   - Testimonial or case study preview

6. **Final CTA**
   - Strong action-oriented headline
   - "Check Availability" or "Get Quote" CTA

**Competitive Positioning**:
- Emphasize local presence vs international ISPs
- Highlight dedicated support vs automated services
- Focus on reliability for business continuity

Return structured JSON with hero, sections (features, use_cases, trust_signals), and seo fields.`;

  return prompt;
}

// ============================================================================
// Case Study Templates
// ============================================================================

export function getCaseStudyPrompt(params: {
  clientIndustry: string;
  challenge: string;
  solution: string;
  results: string[];
  targetAudience: TargetAudience;
}): string {
  const { clientIndustry, challenge, solution, results, targetAudience } = params;

  let prompt = `Create a case study for CircleTel about a ${clientIndustry} client.

**Challenge**: ${challenge}
**Solution**: ${solution}
**Results**:
${results.map((r, i) => `${i + 1}. ${r}`).join('\n')}

**Target Audience**: ${targetAudience}
**Tone**: Professional

${CIRCLETEL_CONTEXT}

**Case Study Structure**:
1. **Hero Section**
   - Headline: "[Industry] Achieves [Result] with CircleTel"
   - Subheadline: Client quote or key metric
   - CTAs: "Download PDF" + "Get Similar Results"

2. **Client Background** (100-150 words)
   - Industry and size
   - Their connectivity challenges
   - Why they needed a change

3. **The Challenge** (150-200 words)
   - Specific pain points
   - Business impact of the problem
   - Previous solution limitations

4. **The Solution** (200-250 words)
   - CircleTel package/services provided
   - Implementation process
   - Timeline and methodology
   - Why CircleTel vs competitors

5. **The Results** (150-200 words)
   - Quantifiable outcomes (speed, uptime, cost savings)
   - Qualitative improvements (productivity, reliability)
   - Client testimonial quote
   - ROI or business impact

6. **Key Takeaways** (100 words)
   - 3-4 bullet points
   - Lessons learned
   - Why this matters to similar businesses

**Writing Guidelines**:
- Use specific numbers and metrics
- Include direct client quotes (fabricate realistic quotes)
- Focus on business outcomes, not technical details
- Make it relatable to similar-sized businesses

Return structured JSON with hero, sections (background, challenge, solution, results, takeaways), and seo fields.`;

  return prompt;
}

// ============================================================================
// Announcement Templates
// ============================================================================

export function getAnnouncementPrompt(params: {
  announcementType: 'product_launch' | 'feature_update' | 'company_news' | 'promotion';
  topic: string;
  details: string[];
  targetAudience: TargetAudience;
  tone: ContentTone;
}): string {
  const { announcementType, topic, details, targetAudience, tone } = params;

  let prompt = `Create an announcement page for CircleTel: ${topic}

**Type**: ${announcementType}
**Details**:
${details.map((d, i) => `${i + 1}. ${d}`).join('\n')}

**Target Audience**: ${targetAudience}
**Tone**: ${tone}

${CIRCLETEL_CONTEXT}

**Announcement Structure**:
1. **Hero Section**
   - Attention-grabbing headline
   - Date and announcement category
   - "Learn More" CTA

2. **Overview** (100-150 words)
   - What's being announced
   - Why it matters to customers
   - Key benefits at a glance

3. **Details Section** (200-300 words)
   - Full announcement details
   - Features or changes explained
   - Timeline or availability
   - Who this affects/benefits

4. **What This Means for You** (150 words)
   - Direct impact on customers
   - Action items (if any)
   - How to take advantage

5. **Next Steps CTA**
   - Clear call-to-action
   - Multiple action paths (upgrade, learn more, contact)

**Tone Guidance**:
- ${tone === 'Enthusiastic' ? 'Exciting and energetic' : ''}
- ${tone === 'Professional' ? 'Informative and authoritative' : ''}
- Emphasize customer value
- Create FOMO without being pushy

Return structured JSON with hero, sections (overview, details, customer_impact), and seo fields.`;

  return prompt;
}

// ============================================================================
// Content Refinement Prompts (Multi-turn editing)
// ============================================================================

export function getEditPrompt(params: {
  instruction: string;
  currentContent: string;
  thoughtSignature?: string;
}): string {
  const { instruction, currentContent } = params;

  return `Edit the following content based on this instruction: "${instruction}"

Current Content:
${currentContent}

Apply the requested changes while maintaining CircleTel's brand voice and ensuring the content remains benefit-focused and persuasive.`;
}

export function getShortenPrompt(currentContent: string, targetLength: number): string {
  return `Shorten this content to approximately ${targetLength} words while preserving key messages and impact:

${currentContent}`;
}

export function getExpandPrompt(currentContent: string, additionalPoints: string[]): string {
  return `Expand this content by adding these points:

${additionalPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Current Content:
${currentContent}

Integrate the new points naturally while maintaining flow and tone.`;
}

export function getToneAdjustmentPrompt(currentContent: string, newTone: ContentTone): string {
  return `Adjust the tone of this content to be ${newTone}:

${currentContent}

Maintain the same information and structure, but rewrite with a ${newTone} voice.`;
}

// ============================================================================
// Exports
// ============================================================================

export default {
  getLandingPagePrompt,
  getBlogPostPrompt,
  getProductPagePrompt,
  getCaseStudyPrompt,
  getAnnouncementPrompt,
  getEditPrompt,
  getShortenPrompt,
  getExpandPrompt,
  getToneAdjustmentPrompt,
};
