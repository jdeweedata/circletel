/**
 * CircleTel AI-Powered CMS - AI Service Layer
 *
 * Integrates Google Gemini 3 Pro for content generation
 * Follows best practices from: lib/cms/GEMINI3_BEST_PRACTICES.md
 *
 * Key Features:
 * - Content generation for landing pages, blogs, products
 * - Thought signature handling for multi-turn conversations
 * - Rate limiting and cost tracking
 * - Error handling with fallback templates
 * - Structured JSON output validation
 */

import { GoogleGenAI } from '@google/genai';
import type {
  AIGenerationRequest,
  AIContentGenerationResponse,
  AIImageRequest,
  AIImageGenerationResponse,
  PageContent,
  SEOMetadata,
  ThinkingLevel,
  MediaResolutionLevel,
  Gemini3Config,
} from './types';

// ============================================================================
// Configuration
// ============================================================================

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY || '';
const MODEL_ID = process.env.CMS_MODEL_ID || 'gemini-3-pro-preview';
const IMAGE_MODEL_ID = process.env.CMS_IMAGE_MODEL_ID || 'gemini-3-pro-image-preview';
const API_VERSION = process.env.CMS_API_VERSION || 'v1alpha';
const DEFAULT_TEMPERATURE = 1.0; // CRITICAL: Must be 1.0 for Gemini 3
const DEFAULT_THINKING_LEVEL: ThinkingLevel = (process.env.CMS_THINKING_LEVEL as ThinkingLevel) || 'high';
const DEFAULT_MEDIA_RESOLUTION: MediaResolutionLevel =
  (process.env.CMS_MEDIA_RESOLUTION as MediaResolutionLevel) || 'media_resolution_high';
const MAX_TOKENS_BLOG = parseInt(process.env.CMS_MAX_TOKENS_BLOG || '4096');
const MAX_TOKENS_LANDING = parseInt(process.env.CMS_MAX_TOKENS_LANDING || '2048');

// Pricing constants (per 1M tokens)
const PRICING = {
  input_under_200k: 2.0,
  output_under_200k: 12.0,
  input_over_200k: 4.0,
  output_over_200k: 18.0,
};

// ============================================================================
// Client Initialization
// ============================================================================

let clientInstance: GoogleGenAI | null = null;

/**
 * Get or create Gemini AI client instance
 * Uses v1alpha for media_resolution support
 */
function getClient(): GoogleGenAI {
  if (!clientInstance) {
    if (!GEMINI_API_KEY) {
      throw new Error('GOOGLE_AI_API_KEY not configured. Check .env.local file.');
    }

    clientInstance = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      // @ts-ignore - apiVersion is valid but may not be in types yet
      apiVersion: API_VERSION,
    });
  }

  return clientInstance;
}

// ============================================================================
// Cost Estimation
// ============================================================================

/**
 * Calculate estimated cost based on token usage
 */
function estimateCost(inputTokens: number, outputTokens: number): number {
  const totalTokens = inputTokens + outputTokens;

  if (totalTokens < 200000) {
    // Under 200k tokens
    return (
      (inputTokens / 1000000) * PRICING.input_under_200k +
      (outputTokens / 1000000) * PRICING.output_under_200k
    );
  } else {
    // Over 200k tokens
    return (
      (inputTokens / 1000000) * PRICING.input_over_200k +
      (outputTokens / 1000000) * PRICING.output_over_200k
    );
  }
}

// ============================================================================
// Content Generation
// ============================================================================

/**
 * Generate content using Gemini 3 Pro
 *
 * CRITICAL: Follows Gemini 3 best practices:
 * - Temperature fixed at 1.0
 * - Concise, direct prompts
 * - Structured JSON output
 * - Thought signature handling
 */
export async function generateContent(
  request: AIGenerationRequest
): Promise<AIContentGenerationResponse> {
  try {
    const client = getClient();

    // Build prompt following Gemini 3 best practices (concise and direct)
    const prompt = buildContentPrompt(request);

    // Configure generation (following Gemini 3 requirements)
    const maxTokens = request.contentType === 'blog'
      ? MAX_TOKENS_BLOG
      : MAX_TOKENS_LANDING;

    // @ts-ignore - Gemini 3 config properties may not be in SDK types yet
    const generationConfig: Gemini3Config = {
      model: MODEL_ID as 'gemini-3-pro-preview',
      temperature: DEFAULT_TEMPERATURE, // MUST be 1.0
      thinking_level: request.thinking_level || DEFAULT_THINKING_LEVEL,
      max_output_tokens: maxTokens,
      response_mime_type: 'application/json',
      response_json_schema: getContentSchema(request.contentType),
    };

    // Prepare contents array
    const contents: any[] = [];

    // If there's a previous thought signature, include it for context continuity
    if (request.previous_thought_signature) {
      contents.push({
        role: 'model',
        parts: [{
          text: 'Previous context maintained.',
          thoughtSignature: request.previous_thought_signature,
        }],
      });
    }

    // Add user prompt
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    // Generate content
    const response = await client.models.generateContent({
      model: MODEL_ID,
      contents,
      config: generationConfig,
    });

    // Extract response
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('No content generated by AI');
    }

    const candidate = response.candidates[0];
    let text = candidate.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Empty response from AI');
    }

    // Strip markdown code fences if present
    text = text.trim();
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    text = text.trim();

    // Parse JSON response
    const parsedContent = JSON.parse(text);

    // Extract thought signature (CRITICAL for multi-turn)
    // @ts-ignore - thoughtSignature may not be in types yet
    const thoughtSignature = candidate.thoughtSignature || candidate.content?.thoughtSignature;

    // Calculate token usage and cost
    const inputTokens = response.usageMetadata?.promptTokenCount || 0;
    const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;
    const cost = estimateCost(inputTokens, outputTokens);

    // Validate and structure response
    const pageContent: PageContent = {
      hero: parsedContent.hero,
      sections: parsedContent.sections || [],
    };

    const seoMetadata: SEOMetadata = parsedContent.seo || {
      metaTitle: parsedContent.title || request.title || request.topic,
      metaDescription: parsedContent.description || '',
    };

    return {
      success: true,
      content: pageContent,
      seo_metadata: seoMetadata,
      tokens_used: inputTokens + outputTokens,
      cost_estimate: cost,
      thought_signature: thoughtSignature,
      thinking_level_used: request.thinking_level || DEFAULT_THINKING_LEVEL,
    };

  } catch (error) {
    console.error('AI content generation error:', error);

    // Return error with fallback
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      content: getFallbackContent(request.contentType),
    };
  }
}

// ============================================================================
// Image Generation
// ============================================================================

/**
 * Generate images using Gemini multimodal capabilities
 * Currently configured as placeholder - enable with ENABLE_AI_IMAGE_GENERATION
 */
export async function generateImage(
  request: AIImageRequest
): Promise<AIImageGenerationResponse> {
  try {
    // Check if image generation is enabled
    const enabled = process.env.ENABLE_AI_IMAGE_GENERATION === 'true';

    if (!enabled) {
      return {
        success: false,
        error: 'AI image generation not enabled. Set ENABLE_AI_IMAGE_GENERATION=true in .env.local',
      };
    }

    const client = getClient();

    // Build prompt
    const imagePrompt = buildImagePrompt(request);

    const response = await client.models.generateContent({
      model: IMAGE_MODEL_ID,
      contents: [{
        parts: [{ text: imagePrompt }],
      }],
      // @ts-ignore - Gemini 3 config properties may not be in SDK types yet
      config: {
        model: IMAGE_MODEL_ID as 'gemini-3-pro-image-preview',
        temperature: DEFAULT_TEMPERATURE,
        media_resolution: request.media_resolution || DEFAULT_MEDIA_RESOLUTION,
      },
    });

    // Extract thought signature (CRITICAL)
    let thoughtSignature: string | undefined;
    
    // Search for thought signature in candidates
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      // @ts-ignore - thoughtSignature property check
      thoughtSignature = candidate.thoughtSignature || candidate.content?.thoughtSignature;
      
      // Also check parts for signatures if not found on candidate
      if (!thoughtSignature && candidate.content?.parts) {
        for (const part of candidate.content.parts) {
          // @ts-ignore
          if (part.thoughtSignature) {
            // @ts-ignore
            thoughtSignature = part.thoughtSignature;
            break; 
          }
        }
      }
    }

    // Extract images from inlineData parts
    const images: Array<{ url: string; width: number; height: number }> = [];
    
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || 'image/jpeg';
          const data = part.inlineData.data;
          const url = `data:${mimeType};base64,${data}`;
          
          // For generated images, we might not know dimensions immediately without decoding
          // Defaulting to aspect ratio assumption
          let width = 1024;
          let height = 1024;
          
          if (request.aspectRatio === '16:9') { height = 576; }
          else if (request.aspectRatio === '3:2') { height = 683; }
          else if (request.aspectRatio === '4:5') { height = 1280; }
          
          images.push({
            url,
            width,
            height
          });
        }
      }
    }

    if (images.length === 0) {
      throw new Error('No images generated in response');
    }

    // Calculate cost (approximate for image model)
    // Pricing: $2/1M input text tokens, $0.134 per image output
    const inputTokens = response.usageMetadata?.promptTokenCount || 0;
    const outputTokens = response.usageMetadata?.candidatesTokenCount || 0; // Token count for image parts?
    
    // Image pricing is per image, not per token for output
    const imageCost = images.length * 0.134;
    const inputCost = (inputTokens / 1000000) * 2.0;
    const totalCost = inputCost + imageCost;

    return {
      success: true,
      images,
      tokens_used: inputTokens + outputTokens,
      cost_estimate: totalCost,
      thought_signature: thoughtSignature,
      media_resolution_used: request.media_resolution || DEFAULT_MEDIA_RESOLUTION,
    };

  } catch (error) {
    console.error('AI image generation error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// Prompt Building (Gemini 3 Optimized)
// ============================================================================

/**
 * Build content generation prompt
 *
 * Follows Gemini 3 best practices:
 * - Concise and direct
 * - Data before questions
 * - No verbose chain-of-thought
 */
function buildContentPrompt(request: AIGenerationRequest): string {
  const {
    contentType,
    topic,
    title,
    targetAudience = 'B2B',
    tone = 'Professional',
    keyPoints = [],
    wordCount,
    seoKeywords = [],
  } = request;

  // Concise, direct prompt (Gemini 3 optimized)
  let prompt = `Create a ${contentType} about "${topic}" for CircleTel, a South African ISP.\n\n`;

  // Add context
  if (title) {
    prompt += `Title: ${title}\n`;
  }
  prompt += `Target Audience: ${targetAudience}\n`;
  prompt += `Tone: ${tone}\n`;

  // Key points (if provided)
  if (keyPoints.length > 0) {
    prompt += `\nEmphasize these points:\n`;
    keyPoints.forEach((point, i) => {
      prompt += `${i + 1}. ${point}\n`;
    });
  }

  // SEO keywords (if provided)
  if (seoKeywords.length > 0) {
    prompt += `\nSEO Keywords: ${seoKeywords.join(', ')}\n`;
  }

  // Word count guidance
  if (wordCount) {
    prompt += `\nTarget word count: ${wordCount} words\n`;
  }

  // CircleTel context
  prompt += `\nCircleTel Context:
- Leading ISP in South Africa
- Offers BizFibre, SkyFibre, 5G LTE packages
- B2B and B2C markets
- Focus: Speed, reliability, business continuity
- Brand colors: Orange (#F5831F), Dark Blue (#1E4B85)

Generate structured content with hero section, feature sections, pricing tables (if applicable), and SEO metadata.
Use benefit-focused, persuasive language.

If the topic is "Black Friday" or a special promotion, use the "black_friday" theme and include pricing deals.

IMPORTANT: Return ONLY valid JSON (no explanations, no markdown, no extra text).
JSON format:
{
  "theme": "light" | "dark" | "black_friday",
  "hero": {
    "headline": "...",
    "subheadline": "...",
    "cta_primary": "...",
    "cta_primary_url": "...",
    "cta_secondary": "...",
    "cta_secondary_url": "..."
  },
  "sections": [
    {"type": "features", "heading": "...", "items": [...]},
    {"type": "pricing", "heading": "...", "items": [{"title": "...", "price": "R999", "original_price": "R1299", "badge": "SAVE R300", "features": ["..."], "cta_text": "Buy Now", "cta_url": "..."}]},
    {"type": "cta", "heading": "...", "description": "...", "button_text": "...", "button_url": "..."}
  ],
  "seo": {
    "metaTitle": "...",
    "metaDescription": "...",
    "keywords": [...]
  }
}`;

  return prompt;
}

/**
 * Build image generation prompt
 */
function buildImagePrompt(request: AIImageRequest): string {
  const { prompt, style, aspectRatio } = request;

  return `Generate a ${style} image for CircleTel marketing.

Prompt: ${prompt}
Style: ${style}
Aspect Ratio: ${aspectRatio}

Requirements:
- Professional quality
- Suitable for ${aspectRatio} layout
- Brand-appropriate (tech/business context)
- No text overlays
- Modern, clean aesthetic`;
}

// ============================================================================
// JSON Schema for Structured Output
// ============================================================================

/**
 * Get JSON schema for content type
 * Ensures AI returns properly structured JSON
 */
function getContentSchema(contentType: string): Record<string, unknown> {
  const baseSchema = {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Page title' },
      theme: { type: 'string', enum: ['light', 'dark', 'black_friday'], description: 'Visual theme for the page' },
      hero: {
        type: 'object',
        properties: {
          headline: { type: 'string', description: 'Main headline (max 60 chars)' },
          subheadline: { type: 'string', description: 'Supporting text (120-150 chars)' },
          cta_primary: { type: 'string', description: 'Primary button text' },
          cta_primary_url: { type: 'string', description: 'Primary button URL' },
          cta_secondary: { type: 'string', description: 'Secondary button text' },
          cta_secondary_url: { type: 'string', description: 'Secondary button URL' },
        },
        required: ['headline', 'subheadline', 'cta_primary'],
      },
      sections: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['features', 'testimonials', 'cta', 'text', 'image', 'pricing'] },
            heading: { type: 'string' },
            content: { type: 'string' },
            items: { type: 'array' },
          },
        },
      },
      seo: {
        type: 'object',
        properties: {
          metaTitle: { type: 'string', description: 'SEO title (max 60 chars)', maxLength: 60 },
          metaDescription: { type: 'string', description: 'SEO description (max 155 chars)', maxLength: 155 },
          keywords: { type: 'array', items: { type: 'string' } },
        },
        required: ['metaTitle', 'metaDescription'],
      },
    },
    required: ['hero', 'sections', 'seo'],
  };

  return baseSchema;
}

// ============================================================================
// Fallback Content
// ============================================================================

/**
 * Get fallback content when AI generation fails
 */
function getFallbackContent(contentType: string): PageContent {
  return {
    hero: {
      headline: 'CircleTel - Your Trusted ISP Partner',
      subheadline: 'Experience reliable connectivity and exceptional service across South Africa',
      cta_primary: 'Get Started',
      cta_primary_url: '/packages',
      cta_secondary: 'Learn More',
      cta_secondary_url: '/about',
    },
    sections: [
      {
        type: 'features',
        heading: 'Why Choose CircleTel',
        layout: 'grid-3',
        items: [
          {
            title: 'Fast & Reliable',
            description: 'Experience lightning-fast internet speeds with 99.9% uptime guarantee.',
          },
          {
            title: 'Business-Grade Support',
            description: 'Get dedicated support from our team of connectivity experts.',
          },
          {
            title: 'Flexible Packages',
            description: 'Choose from a range of packages tailored to your needs.',
          },
        ],
      },
      {
        type: 'cta',
        heading: 'Ready to Get Started?',
        description: 'Join thousands of satisfied customers across South Africa.',
        button_text: 'View Packages',
        button_url: '/packages',
      },
    ],
  };
}

// ============================================================================
// Rate Limiting (to be implemented with database)
// ============================================================================

/**
 * Check if user has exceeded generation limit
 * Implementation requires database query to cms_ai_usage table
 */
export async function checkRateLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}> {
  // Placeholder - implement with Supabase query to cms_ai_usage table
  const limit = parseInt(process.env.CMS_MAX_GENERATIONS_PER_HOUR || '20');

  // TODO: Query database for user's generation count in last hour
  // SELECT COUNT(*) FROM cms_ai_usage
  // WHERE user_id = ? AND created_at > NOW() - INTERVAL '1 hour'

  return {
    allowed: true,
    remaining: limit,
    resetAt: new Date(Date.now() + 3600000), // 1 hour from now
  };
}

/**
 * Track AI usage in database
 * Stores generation for rate limiting and cost tracking
 */
export async function trackUsage(
  userId: string,
  generationType: 'content' | 'image',
  tokensUsed: number,
  costEstimate: number
): Promise<void> {
  // TODO: Insert into cms_ai_usage table
  // INSERT INTO cms_ai_usage (user_id, generation_type, tokens_used, cost_estimate)
  // VALUES (?, ?, ?, ?)

  console.log('AI Usage Tracked:', {
    userId,
    generationType,
    tokensUsed,
    costEstimate,
  });
}

// ============================================================================
// Exports
// ============================================================================

export default {
  generateContent,
  generateImage,
  checkRateLimit,
  trackUsage,
};
