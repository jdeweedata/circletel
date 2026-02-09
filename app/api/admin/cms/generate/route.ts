/**
 * CMS AI Generation API
 *
 * POST /api/admin/cms/generate - Generate content using Gemini 3 Pro
 *
 * Supports:
 * - block: Generate content for a specific block type
 * - full_page: Generate an entire page with multiple blocks
 * - enhance: Enhance existing content
 * - seo: Generate SEO metadata
 * - suggestions: Get content suggestions for a block
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logging';
import { createClientWithSession } from '@/lib/supabase/server';
import {
  generateBlockContent,
  generateFullPage,
  enhanceContent,
  generateSEO,
  getSuggestions,
} from '@/lib/cms/ai-service';
import { checkRateLimit, getUserUsageStats } from '@/lib/cms/usage-tracking';
import type { BlockType, ContentType } from '@/lib/cms/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // AI generation may take longer

type GenerationType = 'block' | 'full_page' | 'enhance' | 'seo' | 'suggestions';

interface GenerationRequest {
  type: GenerationType;
  // For block generation
  blockType?: BlockType;
  prompt?: string;
  // For full page generation
  contentType?: ContentType;
  topic?: string;
  // For content enhancement
  content?: string;
  instruction?: string;
  // For SEO generation
  pageTitle?: string;
  pageContent?: string;
  // For suggestions
  context?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientWithSession();

    // Verify admin authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit first
    const rateLimitStatus = await checkRateLimit(user.id);
    if (!rateLimitStatus.withinLimits) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          rateLimitStatus,
        },
        { status: 429 }
      );
    }

    const body = (await request.json()) as GenerationRequest;

    if (!body.type) {
      return NextResponse.json(
        { error: 'Generation type is required' },
        { status: 400 }
      );
    }

    let result;

    switch (body.type) {
      case 'block':
        if (!body.blockType || !body.prompt) {
          return NextResponse.json(
            { error: 'blockType and prompt are required for block generation' },
            { status: 400 }
          );
        }
        result = await generateBlockContent(body.blockType, body.prompt, user.id);
        break;

      case 'full_page':
        if (!body.contentType || !body.topic) {
          return NextResponse.json(
            { error: 'contentType and topic are required for full page generation' },
            { status: 400 }
          );
        }
        result = await generateFullPage(body.contentType, body.topic, user.id);
        break;

      case 'enhance':
        if (!body.content || !body.instruction) {
          return NextResponse.json(
            { error: 'content and instruction are required for enhancement' },
            { status: 400 }
          );
        }
        result = await enhanceContent(body.content, body.instruction, user.id);
        break;

      case 'seo':
        if (!body.pageTitle) {
          return NextResponse.json(
            { error: 'pageTitle is required for SEO generation' },
            { status: 400 }
          );
        }
        result = await generateSEO(body.pageTitle, body.pageContent || '', user.id);
        break;

      case 'suggestions':
        if (!body.blockType) {
          return NextResponse.json(
            { error: 'blockType is required for suggestions' },
            { status: 400 }
          );
        }
        result = await getSuggestions(body.blockType, body.context || '', user.id);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown generation type: ${body.type}` },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Generation failed',
          success: false,
        },
        { status: 500 }
      );
    }

    // Get updated rate limit status after generation
    const updatedRateLimit = await checkRateLimit(user.id);

    return NextResponse.json({
      success: true,
      content: result.content,
      usage: result.usage,
      rateLimitStatus: updatedRateLimit,
    });
  } catch (error) {
    apiLogger.error('AI Generation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get rate limit status and usage stats
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientWithSession();

    // Verify admin authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitStatus = await checkRateLimit(user.id);
    const usageStats = await getUserUsageStats(user.id);

    return NextResponse.json({
      success: true,
      rateLimitStatus,
      usageStats,
    });
  } catch (error) {
    apiLogger.error('AI Usage API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
