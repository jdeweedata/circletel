/**
 * CMS AI Image Generation API
 *
 * POST /api/admin/cms/generate/image - Generate images using Nano Banana Pro (gemini-3-pro-image-preview)
 *
 * Supports various styles and aspect ratios for marketing imagery.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logging';
import { createClientWithSession } from '@/lib/supabase/server';
import { generateImage } from '@/lib/cms/ai-service';
import { checkRateLimit } from '@/lib/cms/usage-tracking';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Image generation may take longer

interface ImageGenerationRequest {
  prompt: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  style?: 'photorealistic' | 'illustration' | 'abstract' | 'corporate';
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

    // Check rate limit
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

    const body = (await request.json()) as ImageGenerationRequest;

    if (!body.prompt) {
      return NextResponse.json(
        { error: 'prompt is required for image generation' },
        { status: 400 }
      );
    }

    // Validate prompt length (safety measure)
    if (body.prompt.length > 2000) {
      return NextResponse.json(
        { error: 'Prompt is too long. Maximum 2000 characters.' },
        { status: 400 }
      );
    }

    // Validate aspect ratio
    const validAspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];
    if (body.aspectRatio && !validAspectRatios.includes(body.aspectRatio)) {
      return NextResponse.json(
        { error: `Invalid aspect ratio. Must be one of: ${validAspectRatios.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate style
    const validStyles = ['photorealistic', 'illustration', 'abstract', 'corporate'];
    if (body.style && !validStyles.includes(body.style)) {
      return NextResponse.json(
        { error: `Invalid style. Must be one of: ${validStyles.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await generateImage(body.prompt, user.id, {
      aspectRatio: body.aspectRatio,
      style: body.style,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Image generation failed',
          success: false,
        },
        { status: 500 }
      );
    }

    // Get updated rate limit status
    const updatedRateLimit = await checkRateLimit(user.id);

    return NextResponse.json({
      success: true,
      image: result.content,
      usage: result.usage,
      rateLimitStatus: updatedRateLimit,
    });
  } catch (error) {
    apiLogger.error('Image Generation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
