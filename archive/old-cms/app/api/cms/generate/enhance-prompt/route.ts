/**
 * API Route: Enhance AI Generation Prompt
 *
 * Uses Gemini 3 to improve user's topic/prompt for better content generation
 * Analyzes the topic and suggests improvements for:
 * - More specific and actionable prompts
 * - Better target audience identification
 * - SEO keyword suggestions
 * - Key points to emphasize
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import type { ContentType, TargetAudience, ContentTone } from '@/lib/cms/types';

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY || '';
const MODEL_ID = 'gemini-3-pro-preview';
const API_VERSION = 'v1alpha';

interface EnhancePromptRequest {
  topic: string;
  contentType: ContentType;
  targetAudience?: TargetAudience;
  tone?: ContentTone;
}

interface EnhancePromptResponse {
  success: boolean;
  enhanced?: {
    refined_topic: string;
    suggested_title: string;
    target_audience: TargetAudience;
    tone: ContentTone;
    key_points: string[];
    seo_keywords: string[];
    reasoning: string;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: EnhancePromptRequest = await request.json();
    const { topic, contentType, targetAudience, tone } = body;

    // Validation
    if (!topic || !topic.trim()) {
      return NextResponse.json(
        { success: false, error: 'Topic is required' },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'GOOGLE_AI_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Initialize Gemini client
    const client = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      // @ts-ignore - apiVersion is valid
      apiVersion: API_VERSION,
    });

    // Build prompt for enhancement
    const enhancementPrompt = buildEnhancementPrompt(topic, contentType, targetAudience, tone);

    // Generate enhancement suggestions
    // @ts-ignore - Gemini 3 config
    const response = await client.models.generateContent({
      model: MODEL_ID,
      contents: [
        {
          role: 'user',
          parts: [{ text: enhancementPrompt }],
        },
      ],
      config: {
        model: MODEL_ID,
        temperature: 1.0,
        thinking_level: 'high',
        max_output_tokens: 1024,
        response_mime_type: 'application/json',
        response_json_schema: {
          type: 'object',
          properties: {
            refined_topic: {
              type: 'string',
              description: 'Improved, more specific topic',
            },
            suggested_title: {
              type: 'string',
              description: 'Compelling title for the content',
            },
            target_audience: {
              type: 'string',
              enum: ['B2B', 'B2C', 'Internal', 'Partners'],
              description: 'Best target audience',
            },
            tone: {
              type: 'string',
              enum: ['Professional', 'Casual', 'Enthusiastic', 'Technical', 'Friendly'],
              description: 'Recommended tone',
            },
            key_points: {
              type: 'array',
              items: { type: 'string' },
              description: '3-5 key points to emphasize',
            },
            seo_keywords: {
              type: 'array',
              items: { type: 'string' },
              description: '5-8 SEO keywords',
            },
            reasoning: {
              type: 'string',
              description: 'Brief explanation of improvements',
            },
          },
          required: [
            'refined_topic',
            'suggested_title',
            'target_audience',
            'tone',
            'key_points',
            'seo_keywords',
            'reasoning',
          ],
        },
      },
    });

    // Parse response
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('No enhancement suggestions generated');
    }

    let text = response.candidates[0].content?.parts?.[0]?.text;
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

    const enhanced = JSON.parse(text);

    return NextResponse.json({
      success: true,
      enhanced,
    } as EnhancePromptResponse);
  } catch (error) {
    console.error('Prompt enhancement error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Enhancement failed',
      } as EnhancePromptResponse,
      { status: 500 }
    );
  }
}

/**
 * Build enhancement prompt for Gemini 3
 */
function buildEnhancementPrompt(
  topic: string,
  contentType: ContentType,
  targetAudience?: TargetAudience,
  tone?: ContentTone
): string {
  const contentTypeDesc = {
    landing: 'Landing Page (conversion-focused, includes hero, features, pricing, CTA)',
    blog: 'Blog Post (informative, SEO-optimized, engaging)',
    product: 'Product Page (showcases features, benefits, pricing)',
    case_study: 'Case Study (problem-solution-results structure)',
    announcement: 'Announcement (brief, newsworthy, time-sensitive)',
  };

  return `You are a content strategist for CircleTel, a leading South African ISP.

Analyze this content topic and suggest improvements:

**Original Topic**: "${topic}"
**Content Type**: ${contentTypeDesc[contentType]}
${targetAudience ? `**Current Target Audience**: ${targetAudience}` : ''}
${tone ? `**Current Tone**: ${tone}` : ''}

**CircleTel Context**:
- Products: BizFibre (business fiber), SkyFibre (residential fiber), 5G LTE
- Markets: B2B (enterprise, SMB) and B2C (residential)
- Focus: Speed, reliability, business continuity
- South African ISP serving businesses and consumers

**Task**: Enhance this topic to create better content. Provide:

1. **refined_topic**: More specific, actionable version of the topic (1-2 sentences)
2. **suggested_title**: Compelling, SEO-friendly title
3. **target_audience**: Best audience for this content (B2B, B2C, Internal, Partners)
4. **tone**: Recommended tone for maximum impact
5. **key_points**: 3-5 key points to emphasize in the content
6. **seo_keywords**: 5-8 SEO keywords relevant to CircleTel and the topic
7. **reasoning**: Brief explanation (2-3 sentences) of why these improvements work

Focus on CircleTel's value proposition: fast, reliable connectivity for South African businesses and homes.`;
}
