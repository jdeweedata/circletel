/**
 * CMS Content Generation API Route
 *
 * Handles AI-powered content generation requests
 * Integrates with Gemini 3 Pro via ai-service.ts
 *
 * Features:
 * - Authentication check (admin users with cms:create permission)
 * - Rate limiting
 * - Usage tracking
 * - Error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import aiService from '@/lib/cms/ai-service';
import type { AIGenerationRequest } from '@/lib/cms/types';
import { checkRateLimit, logAIUsage } from '@/lib/cms/usage-tracking-service';

/**
 * POST /api/cms/generate
 * Generate content using AI
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { adminUser, user } = authResult;

    // 2. Check CMS permissions
    const permissionError = requirePermission(adminUser, 'cms:create');
    if (permissionError) {
      return permissionError;
    }

    // 3. Check rate limit
    const rateLimitCheck = await checkRateLimit(user.id);
    if (!rateLimitCheck.within_limits) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          daily_count: rateLimitCheck.daily_count,
          hourly_count: rateLimitCheck.hourly_count,
          daily_remaining: rateLimitCheck.daily_remaining,
          hourly_remaining: rateLimitCheck.hourly_remaining
        },
        { status: 429 }
      );
    }

    // 4. Parse and validate request body
    const body: AIGenerationRequest = await request.json();

    if (!body.contentType || !body.topic) {
      return NextResponse.json(
        { error: 'Missing required fields: contentType, topic' },
        { status: 400 }
      );
    }

    // 5. Generate content
    const startTime = Date.now();
    const response = await aiService.generateContent(body);
    const responseTimeMs = Date.now() - startTime;

    // 6. Track usage (both success and failure)
    const tokensUsed = typeof response.tokens_used === 'object' && response.tokens_used
      ? response.tokens_used
      : { input: 0, output: 0 };

    await logAIUsage({
      userId: user.id,
      requestType: 'content_generation',
      modelUsed: response.thinking_level_used || 'gemini-1.5-flash',
      inputTokens: tokensUsed.input || 0,
      outputTokens: tokensUsed.output || 0,
      contentType: body.contentType,
      promptLength: JSON.stringify(body).length,
      responseTimeMs,
      success: response.success,
      errorMessage: response.success ? undefined : response.error,
    });

    // 7. Return response
    if (response.success) {
      return NextResponse.json({
        success: true,
        content: response.content,
        seo_metadata: response.seo_metadata,
        tokens_used: response.tokens_used,
        cost_estimate: response.cost_estimate,
        thought_signature: response.thought_signature,
        thinking_level_used: response.thinking_level_used,
        rate_limit: {
          daily_remaining: rateLimitCheck.daily_remaining - 1,
          hourly_remaining: rateLimitCheck.hourly_remaining - 1,
          daily_count: rateLimitCheck.daily_count + 1,
          hourly_count: rateLimitCheck.hourly_count + 1
        }
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: response.error,
          content: response.content // Fallback content
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Content generation API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cms/generate/usage
 * Get rate limit information for current user
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { user } = authResult;

    // 2. Get rate limit info
    const rateLimitInfo = await checkRateLimit(user.id);

    return NextResponse.json({
      within_limits: rateLimitInfo.within_limits,
      daily_count: rateLimitInfo.daily_count,
      hourly_count: rateLimitInfo.hourly_count,
      daily_remaining: rateLimitInfo.daily_remaining,
      hourly_remaining: rateLimitInfo.hourly_remaining
    });

  } catch (error) {
    console.error('Rate limit check error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
