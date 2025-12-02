/**
 * CMS Page Builder - AI Service
 *
 * Google Gemini integration for content and image generation.
 * - gemini-2.5-flash: Text generation (1M token context, stable)
 * - gemini-2.5-flash-image: Image generation (Nano Banana, stable)
 *
 * See: https://ai.google.dev/gemini-api/docs/models
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import type {
  AIGenerationRequest,
  AIGenerationResponse,
  AIRequestType,
  BlockType,
  ContentType,
  HeroContent,
  TextContent,
  CTAContent,
  FeatureGridContent,
  TestimonialContent,
  SEOMetadata,
} from './types';
import { BLOCK_DEFINITIONS } from './block-registry';
import { trackAIUsage, checkRateLimit } from './usage-tracking';

// ============================================
// Configuration
// ============================================

// Gemini models - using stable/preview versions
// See: https://ai.google.dev/gemini-api/docs/models
const GEMINI_TEXT_MODEL = 'gemini-2.5-flash'; // Fast text generation (stable)
const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image'; // Image generation (stable, aka Nano Banana)
const MAX_OUTPUT_TOKENS = 4096;

// Gemini 3 Pro pricing (per 1K tokens, in cents)
const GEMINI_3_PRICING = {
  input: 0.15, // $1.50 per 1M tokens
  output: 0.60, // $6.00 per 1M tokens
};

// ============================================
// AI Service Class
// ============================================

export class CMSAIService {
  private genAI: GoogleGenerativeAI;
  private textModel: GenerativeModel;
  private imageModel: GenerativeModel;

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Google AI API key not configured');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.textModel = this.genAI.getGenerativeModel({ model: GEMINI_TEXT_MODEL });
    this.imageModel = this.genAI.getGenerativeModel({ model: GEMINI_IMAGE_MODEL });
  }

  /**
   * Generate content for a specific block type
   */
  async generateBlockContent(
    blockType: BlockType,
    prompt: string,
    userId: string
  ): Promise<AIGenerationResponse> {
    const startTime = Date.now();

    try {
      // Check rate limit
      const rateLimitStatus = await checkRateLimit(userId);
      if (!rateLimitStatus.withinLimits) {
        return {
          success: false,
          error: `Rate limit exceeded. ${rateLimitStatus.remaining} requests remaining. Resets at ${rateLimitStatus.resetsAt}`,
        };
      }

      const definition = BLOCK_DEFINITIONS[blockType];
      if (!definition) {
        return { success: false, error: `Unknown block type: ${blockType}` };
      }

      const systemPrompt = this.buildBlockPrompt(blockType, prompt);

      const result = await this.textModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
        generationConfig: {
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          temperature: 0.7,
        },
      });

      const response = result.response;
      const text = response.text();
      const content = this.parseBlockContent(blockType, text);

      const responseTimeMs = Date.now() - startTime;

      // Track usage
      await trackAIUsage({
        userId,
        requestType: 'text_generation',
        modelUsed: GEMINI_TEXT_MODEL,
        promptSummary: prompt.substring(0, 200),
        inputTokens: this.estimateTokens(systemPrompt),
        outputTokens: this.estimateTokens(text),
        responseTimeMs,
        success: true,
      });

      return {
        success: true,
        content,
        usage: {
          inputTokens: this.estimateTokens(systemPrompt),
          outputTokens: this.estimateTokens(text),
          estimatedCostCents: this.estimateCost(systemPrompt, text),
          responseTimeMs,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await trackAIUsage({
        userId,
        requestType: 'text_generation',
        modelUsed: GEMINI_TEXT_MODEL,
        promptSummary: prompt.substring(0, 200),
        responseTimeMs: Date.now() - startTime,
        success: false,
        errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Generate a complete page with multiple blocks
   */
  async generateFullPage(
    contentType: ContentType,
    topic: string,
    userId: string
  ): Promise<AIGenerationResponse> {
    const startTime = Date.now();

    try {
      // Check rate limit
      const rateLimitStatus = await checkRateLimit(userId);
      if (!rateLimitStatus.withinLimits) {
        return {
          success: false,
          error: `Rate limit exceeded. ${rateLimitStatus.remaining} requests remaining.`,
        };
      }

      const systemPrompt = this.buildFullPagePrompt(contentType, topic);

      const result = await this.textModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
        generationConfig: {
          maxOutputTokens: 8192, // Larger for full pages
          temperature: 0.7,
        },
      });

      const response = result.response;
      const text = response.text();
      const blocks = this.parseFullPageContent(text);

      const responseTimeMs = Date.now() - startTime;

      await trackAIUsage({
        userId,
        requestType: 'full_page',
        modelUsed: GEMINI_TEXT_MODEL,
        promptSummary: `${contentType}: ${topic.substring(0, 150)}`,
        inputTokens: this.estimateTokens(systemPrompt),
        outputTokens: this.estimateTokens(text),
        responseTimeMs,
        success: true,
      });

      return {
        success: true,
        content: { blocks },
        usage: {
          inputTokens: this.estimateTokens(systemPrompt),
          outputTokens: this.estimateTokens(text),
          estimatedCostCents: this.estimateCost(systemPrompt, text),
          responseTimeMs,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await trackAIUsage({
        userId,
        requestType: 'full_page',
        modelUsed: GEMINI_TEXT_MODEL,
        promptSummary: topic.substring(0, 200),
        responseTimeMs: Date.now() - startTime,
        success: false,
        errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Enhance existing content
   */
  async enhanceContent(
    content: string,
    instruction: string,
    userId: string
  ): Promise<AIGenerationResponse> {
    const startTime = Date.now();

    try {
      const rateLimitStatus = await checkRateLimit(userId);
      if (!rateLimitStatus.withinLimits) {
        return {
          success: false,
          error: `Rate limit exceeded. ${rateLimitStatus.remaining} requests remaining.`,
        };
      }

      const systemPrompt = `You are a professional content editor for CircleTel, a South African ISP.

Instruction: ${instruction}

Original content:
${content}

Provide the enhanced content only, without any explanation or commentary.
Keep the same general structure but improve based on the instruction.
Use South African English spelling conventions.`;

      const result = await this.textModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
        generationConfig: {
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          temperature: 0.6,
        },
      });

      const response = result.response;
      const text = response.text();
      const responseTimeMs = Date.now() - startTime;

      await trackAIUsage({
        userId,
        requestType: 'content_enhancement',
        modelUsed: GEMINI_TEXT_MODEL,
        promptSummary: instruction.substring(0, 200),
        inputTokens: this.estimateTokens(systemPrompt),
        outputTokens: this.estimateTokens(text),
        responseTimeMs,
        success: true,
      });

      return {
        success: true,
        content: { enhancedContent: text.trim() },
        usage: {
          inputTokens: this.estimateTokens(systemPrompt),
          outputTokens: this.estimateTokens(text),
          estimatedCostCents: this.estimateCost(systemPrompt, text),
          responseTimeMs,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await trackAIUsage({
        userId,
        requestType: 'content_enhancement',
        modelUsed: GEMINI_TEXT_MODEL,
        promptSummary: instruction.substring(0, 200),
        responseTimeMs: Date.now() - startTime,
        success: false,
        errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Generate SEO metadata for a page
   */
  async generateSEO(
    pageTitle: string,
    pageContent: string,
    userId: string
  ): Promise<AIGenerationResponse> {
    const startTime = Date.now();

    try {
      const rateLimitStatus = await checkRateLimit(userId);
      if (!rateLimitStatus.withinLimits) {
        return {
          success: false,
          error: `Rate limit exceeded. ${rateLimitStatus.remaining} requests remaining.`,
        };
      }

      const systemPrompt = `You are an SEO expert for CircleTel, a South African ISP.

Generate SEO metadata for this page:
Title: ${pageTitle}

Content summary:
${pageContent.substring(0, 2000)}

Respond with JSON only (no markdown, no explanation):
{
  "title": "SEO-optimized title (max 60 chars)",
  "description": "Meta description (max 160 chars)",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "ogTitle": "Open Graph title",
  "ogDescription": "Open Graph description"
}

Focus on South African telecommunications market keywords.`;

      const result = await this.textModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
        generationConfig: {
          maxOutputTokens: 512,
          temperature: 0.5,
        },
      });

      const response = result.response;
      const text = response.text();
      const seoMetadata = this.parseSEOContent(text);

      const responseTimeMs = Date.now() - startTime;

      await trackAIUsage({
        userId,
        requestType: 'seo_generation',
        modelUsed: GEMINI_TEXT_MODEL,
        promptSummary: pageTitle.substring(0, 200),
        inputTokens: this.estimateTokens(systemPrompt),
        outputTokens: this.estimateTokens(text),
        responseTimeMs,
        success: true,
      });

      return {
        success: true,
        content: seoMetadata as Record<string, unknown>,
        usage: {
          inputTokens: this.estimateTokens(systemPrompt),
          outputTokens: this.estimateTokens(text),
          estimatedCostCents: this.estimateCost(systemPrompt, text),
          responseTimeMs,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await trackAIUsage({
        userId,
        requestType: 'seo_generation',
        modelUsed: GEMINI_TEXT_MODEL,
        promptSummary: pageTitle.substring(0, 200),
        responseTimeMs: Date.now() - startTime,
        success: false,
        errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Generate an image using Gemini 2.5 Flash Image (Nano Banana)
   * See: https://ai.google.dev/gemini-api/docs/image-generation
   */
  async generateImage(
    prompt: string,
    userId: string,
    options?: {
      aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
      style?: 'photorealistic' | 'illustration' | 'abstract' | 'corporate';
    }
  ): Promise<AIGenerationResponse> {
    const startTime = Date.now();

    try {
      const rateLimitStatus = await checkRateLimit(userId);
      if (!rateLimitStatus.withinLimits) {
        return {
          success: false,
          error: `Rate limit exceeded. ${rateLimitStatus.remaining} requests remaining.`,
        };
      }

      const aspectRatio = options?.aspectRatio || '16:9';
      const style = options?.style || 'photorealistic';

      const enhancedPrompt = this.buildImagePrompt(prompt, style, aspectRatio);

      // Image generation requires responseModalities to include 'image'
      // Using the @google/generative-ai SDK with proper config
      const result = await this.imageModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }],
        generationConfig: {
          temperature: 0.8,
          // @ts-expect-error - responseModalities is required for image generation but not in SDK types yet
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      const response = result.response;

      // Extract image from response
      // For image generation, we get base64 data in inlineData
      const candidates = response.candidates;
      let imageData: string | null = null;
      let responseText: string | null = null;

      if (candidates && candidates.length > 0) {
        const parts = candidates[0].content?.parts || [];
        for (const part of parts) {
          if ('text' in part && part.text) {
            responseText = part.text;
          } else if ('inlineData' in part && part.inlineData) {
            imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }

      const responseTimeMs = Date.now() - startTime;

      await trackAIUsage({
        userId,
        requestType: 'image_generation',
        modelUsed: GEMINI_IMAGE_MODEL,
        promptSummary: prompt.substring(0, 200),
        inputTokens: this.estimateTokens(enhancedPrompt),
        outputTokens: 0, // Images don't have text tokens
        responseTimeMs,
        success: !!imageData,
        errorMessage: imageData ? undefined : 'No image generated',
      });

      if (!imageData) {
        return {
          success: false,
          error: responseText || 'Failed to generate image. Please try a different prompt.',
        };
      }

      return {
        success: true,
        content: {
          imageUrl: imageData,
          prompt: prompt,
          enhancedPrompt,
          aspectRatio,
          style,
        },
        usage: {
          inputTokens: this.estimateTokens(enhancedPrompt),
          outputTokens: 0,
          estimatedCostCents: this.estimateImageCost(),
          responseTimeMs,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Image generation error:', error);

      await trackAIUsage({
        userId,
        requestType: 'image_generation',
        modelUsed: GEMINI_IMAGE_MODEL,
        promptSummary: prompt.substring(0, 200),
        responseTimeMs: Date.now() - startTime,
        success: false,
        errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Generate content suggestions based on context
   */
  async getSuggestions(
    blockType: BlockType,
    context: string,
    userId: string
  ): Promise<AIGenerationResponse> {
    const startTime = Date.now();

    try {
      const rateLimitStatus = await checkRateLimit(userId);
      if (!rateLimitStatus.withinLimits) {
        return {
          success: false,
          error: `Rate limit exceeded. ${rateLimitStatus.remaining} requests remaining.`,
        };
      }

      const definition = BLOCK_DEFINITIONS[blockType];
      if (!definition) {
        return { success: false, error: `Unknown block type: ${blockType}` };
      }

      const systemPrompt = `You are a content strategist for CircleTel, a South African telecommunications company.

Generate 3 different content suggestions for a ${definition.label} block.

Page context: ${context}

For each suggestion, provide a brief description and the main text content.
Respond with JSON only:
{
  "suggestions": [
    {
      "title": "Suggestion title",
      "description": "Why this works",
      "preview": "Main text/headline preview"
    }
  ]
}

Focus on South African telecommunications market. Be creative but professional.`;

      const result = await this.textModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.8,
        },
      });

      const response = result.response;
      const text = response.text();
      const suggestions = this.parseJSONResponse(text);

      const responseTimeMs = Date.now() - startTime;

      await trackAIUsage({
        userId,
        requestType: 'content_suggestion',
        modelUsed: GEMINI_TEXT_MODEL,
        promptSummary: `Suggestions for ${blockType}`,
        inputTokens: this.estimateTokens(systemPrompt),
        outputTokens: this.estimateTokens(text),
        responseTimeMs,
        success: true,
      });

      return {
        success: true,
        content: suggestions,
        usage: {
          inputTokens: this.estimateTokens(systemPrompt),
          outputTokens: this.estimateTokens(text),
          estimatedCostCents: this.estimateCost(systemPrompt, text),
          responseTimeMs,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await trackAIUsage({
        userId,
        requestType: 'content_suggestion',
        modelUsed: GEMINI_TEXT_MODEL,
        promptSummary: `Suggestions for ${blockType}`,
        responseTimeMs: Date.now() - startTime,
        success: false,
        errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private buildBlockPrompt(blockType: BlockType, userPrompt: string): string {
    const definition = BLOCK_DEFINITIONS[blockType];

    const blockInstructions: Record<BlockType, string> = {
      hero: `Generate a hero section with:
- headline (compelling, max 80 chars)
- subheadline (supporting text, max 150 chars)
- ctaText (call-to-action button text, max 20 chars)
- ctaUrl (default to "#")`,

      text: `Generate a text block with:
- html (well-formatted HTML paragraph content)
Use <p>, <strong>, <em>, and <ul>/<li> tags appropriately.`,

      cta: `Generate a CTA section with:
- headline (action-oriented, max 60 chars)
- description (supporting text, max 150 chars)
- primaryButtonText (main CTA, max 20 chars)
- primaryButtonUrl (default to "#")`,

      feature_grid: `Generate a feature grid with:
- columns (3)
- features array with 3 items, each containing:
  - icon (Lucide icon name: Zap, Shield, Clock, Check, Star, Heart, etc.)
  - title (max 30 chars)
  - description (max 100 chars)`,

      testimonial: `Generate a testimonial with:
- testimonials array with 1-3 items, each containing:
  - quote (customer quote, max 200 chars)
  - author (person name)
  - role (job title)
  - company (company name)`,

      pricing: `Generate a pricing table with:
- headline (optional)
- plans array with 2-3 items, each containing:
  - name (plan name)
  - price (e.g., "R99")
  - period (e.g., "/month")
  - features array (list of features)
  - ctaText
  - ctaUrl
  - highlighted (boolean, for recommended plan)`,

      image: `Generate image content with:
- src (leave empty, user will upload)
- alt (descriptive alt text)
- caption (optional caption)`,

      video: `Generate video embed with:
- url (leave empty, user will add)
- title (video title)
- platform (youtube/vimeo)`,

      gallery: `Generate gallery content with:
- layout (grid/masonry/carousel)
- columns (2-4)
- images array (empty, user will add)`,

      form: `Generate a form with:
- formType (contact/lead-gen/newsletter)
- fields array with field definitions
- submitText
- successMessage`,

      divider: `Generate a divider with:
- style (line/gradient/dashed)
- width (full/half/third)`,

      spacer: `Generate a spacer with:
- size (xs/sm/md/lg/xl)`,
    };

    return `You are a content writer for CircleTel, a South African telecommunications company.
Generate content for a ${definition.label} block.

${blockInstructions[blockType]}

User request: ${userPrompt}

Respond with JSON only (no markdown code blocks, no explanation):
${JSON.stringify(definition.defaultContent, null, 2)}

Use South African English spelling. Keep content professional but approachable.
Focus on telecommunications, internet, 5G, and fibre services context.`;
  }

  private buildFullPagePrompt(contentType: ContentType, topic: string): string {
    const pageStructures: Record<ContentType, string> = {
      landing: `Create a landing page with these blocks:
1. Hero section
2. Feature grid (3 features)
3. Testimonial
4. CTA section`,

      blog: `Create a blog post with these blocks:
1. Hero section (article header)
2. Text block (introduction)
3. Text block (main content)
4. CTA section`,

      product: `Create a product page with these blocks:
1. Hero section (product name + tagline)
2. Feature grid (product features)
3. Pricing table
4. Testimonial
5. CTA section`,

      case_study: `Create a case study page with these blocks:
1. Hero section (client + challenge)
2. Text block (the challenge)
3. Text block (the solution)
4. Text block (the results)
5. CTA section`,

      announcement: `Create an announcement page with these blocks:
1. Hero section (announcement headline)
2. Text block (details)
3. CTA section`,
    };

    return `You are a content writer for CircleTel, a South African ISP.
Generate a complete ${contentType} page about: ${topic}

${pageStructures[contentType]}

Respond with a JSON object containing a "blocks" array.
Each block should have: id, type, content, settings.

Example structure:
{
  "blocks": [
    {
      "id": "hero-1",
      "type": "hero",
      "content": { "headline": "...", "subheadline": "..." },
      "settings": { "padding": "lg" }
    }
  ]
}

Use South African English. Focus on telecommunications context.
Make content professional, engaging, and relevant to South African consumers.`;
  }

  private buildImagePrompt(
    userPrompt: string,
    style: string,
    aspectRatio: string
  ): string {
    const styleDescriptions: Record<string, string> = {
      photorealistic: 'ultra-realistic photograph, high resolution, professional photography',
      illustration: 'modern digital illustration, clean lines, vibrant colors',
      abstract: 'abstract art, creative composition, artistic interpretation',
      corporate: 'professional corporate style, clean and modern, business appropriate',
    };

    return `${userPrompt}

Style: ${styleDescriptions[style] || styleDescriptions.photorealistic}
Aspect ratio: ${aspectRatio}
Context: South African telecommunications company (CircleTel)
Requirements:
- Professional and modern aesthetic
- Suitable for website use
- High quality rendering
- No text or watermarks`;
  }

  private parseBlockContent(blockType: BlockType, text: string): Record<string, unknown> {
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.slice(7);
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.slice(3);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.slice(0, -3);
      }

      return JSON.parse(cleanText.trim());
    } catch {
      // Return default content if parsing fails
      return BLOCK_DEFINITIONS[blockType].defaultContent;
    }
  }

  private parseFullPageContent(text: string): Record<string, unknown>[] {
    try {
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.slice(7);
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.slice(3);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.slice(0, -3);
      }

      const parsed = JSON.parse(cleanText.trim());
      return parsed.blocks || [];
    } catch {
      return [];
    }
  }

  private parseSEOContent(text: string): SEOMetadata {
    try {
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.slice(7);
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.slice(3);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.slice(0, -3);
      }

      return JSON.parse(cleanText.trim());
    } catch {
      return {};
    }
  }

  private parseJSONResponse(text: string): Record<string, unknown> {
    try {
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.slice(7);
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.slice(3);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.slice(0, -3);
      }

      return JSON.parse(cleanText.trim());
    } catch {
      return {};
    }
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 chars per token
    return Math.ceil(text.length / 4);
  }

  private estimateCost(input: string, output: string): number {
    // Gemini 3 Pro pricing
    const inputTokens = this.estimateTokens(input);
    const outputTokens = this.estimateTokens(output);

    const inputCost = (inputTokens / 1000) * GEMINI_3_PRICING.input;
    const outputCost = (outputTokens / 1000) * GEMINI_3_PRICING.output;

    return Math.ceil(inputCost + outputCost);
  }

  private estimateImageCost(): number {
    // Image generation typically has a fixed cost per image
    // Estimate based on typical Gemini pricing
    return 5; // 5 cents per image
  }
}

// ============================================
// Singleton Instance
// ============================================

let aiServiceInstance: CMSAIService | null = null;

export function getAIService(): CMSAIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new CMSAIService();
  }
  return aiServiceInstance;
}

// ============================================
// Convenience Functions
// ============================================

export async function generateBlockContent(
  blockType: BlockType,
  prompt: string,
  userId: string
): Promise<AIGenerationResponse> {
  return getAIService().generateBlockContent(blockType, prompt, userId);
}

export async function generateFullPage(
  contentType: ContentType,
  topic: string,
  userId: string
): Promise<AIGenerationResponse> {
  return getAIService().generateFullPage(contentType, topic, userId);
}

export async function enhanceContent(
  content: string,
  instruction: string,
  userId: string
): Promise<AIGenerationResponse> {
  return getAIService().enhanceContent(content, instruction, userId);
}

export async function generateSEO(
  pageTitle: string,
  pageContent: string,
  userId: string
): Promise<AIGenerationResponse> {
  return getAIService().generateSEO(pageTitle, pageContent, userId);
}

export async function generateImage(
  prompt: string,
  userId: string,
  options?: {
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    style?: 'photorealistic' | 'illustration' | 'abstract' | 'corporate';
  }
): Promise<AIGenerationResponse> {
  return getAIService().generateImage(prompt, userId, options);
}

export async function getSuggestions(
  blockType: BlockType,
  context: string,
  userId: string
): Promise<AIGenerationResponse> {
  return getAIService().getSuggestions(blockType, context, userId);
}
