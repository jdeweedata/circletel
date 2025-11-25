/**
 * CMS Page Builder - Usage Tracking
 *
 * Rate limiting and usage tracking for AI generation.
 */

import { createClient } from '@/lib/supabase/server';
import type { AIRequestType, RateLimitStatus } from './types';

// ============================================
// Configuration
// ============================================

const HOURLY_RATE_LIMIT = 20; // 20 AI requests per hour per user
const DAILY_RATE_LIMIT = 100; // 100 AI requests per day per user

// ============================================
// Usage Tracking
// ============================================

export interface TrackUsageParams {
  userId: string;
  requestType: AIRequestType;
  modelUsed: string;
  promptSummary?: string;
  inputTokens?: number;
  outputTokens?: number;
  responseTimeMs?: number;
  success: boolean;
  errorMessage?: string;
}

/**
 * Track AI usage for rate limiting and analytics
 */
export async function trackAIUsage(params: TrackUsageParams): Promise<void> {
  try {
    const supabase = await createClient();

    const estimatedCostCents = calculateEstimatedCost(
      params.inputTokens || 0,
      params.outputTokens || 0,
      params.modelUsed
    );

    await supabase.from('pb_ai_usage').insert({
      user_id: params.userId,
      request_type: params.requestType,
      model_used: params.modelUsed,
      prompt_summary: params.promptSummary,
      input_tokens: params.inputTokens || 0,
      output_tokens: params.outputTokens || 0,
      estimated_cost_cents: estimatedCostCents,
      response_time_ms: params.responseTimeMs,
      success: params.success,
      error_message: params.errorMessage,
    });
  } catch (error) {
    // Log but don't throw - tracking shouldn't break the main flow
    console.error('Failed to track AI usage:', error);
  }
}

// ============================================
// Rate Limiting
// ============================================

/**
 * Check if user is within rate limits
 */
export async function checkRateLimit(userId: string): Promise<RateLimitStatus> {
  try {
    const supabase = await createClient();

    // Use the database function for rate limit check
    const { data, error } = await supabase.rpc('check_pb_rate_limit', {
      target_user_id: userId,
      hourly_limit: HOURLY_RATE_LIMIT,
    });

    if (error) {
      console.error('Rate limit check error:', error);
      // Default to allowing if check fails
      return {
        withinLimits: true,
        hourlyCount: 0,
        remaining: HOURLY_RATE_LIMIT,
        resetsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };
    }

    const result = data?.[0] || {
      within_limits: true,
      hourly_count: 0,
      remaining: HOURLY_RATE_LIMIT,
    };

    return {
      withinLimits: result.within_limits,
      hourlyCount: Number(result.hourly_count),
      remaining: result.remaining,
      resetsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Default to allowing if check fails
    return {
      withinLimits: true,
      hourlyCount: 0,
      remaining: HOURLY_RATE_LIMIT,
      resetsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
  }
}

/**
 * Get detailed usage statistics for a user
 */
export async function getUserUsageStats(userId: string): Promise<{
  hourly: { count: number; limit: number; remaining: number };
  daily: { count: number; limit: number; remaining: number };
  totalTokensToday: number;
  estimatedCostToday: number;
  recentRequests: Array<{
    type: AIRequestType;
    timestamp: string;
    success: boolean;
    tokens: number;
  }>;
}> {
  try {
    const supabase = await createClient();

    // Get hourly usage
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: hourlyData } = await supabase
      .from('pb_ai_usage')
      .select('id')
      .eq('user_id', userId)
      .eq('success', true)
      .gte('created_at', hourAgo);

    const hourlyCount = hourlyData?.length || 0;

    // Get daily usage
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: dailyData } = await supabase
      .from('pb_ai_usage')
      .select('input_tokens, output_tokens, estimated_cost_cents, request_type, created_at, success')
      .eq('user_id', userId)
      .gte('created_at', dayAgo)
      .order('created_at', { ascending: false });

    const dailyCount = dailyData?.filter((r) => r.success).length || 0;
    const totalTokensToday =
      dailyData?.reduce((sum, r) => sum + (r.input_tokens || 0) + (r.output_tokens || 0), 0) || 0;
    const estimatedCostToday =
      dailyData?.reduce((sum, r) => sum + (r.estimated_cost_cents || 0), 0) || 0;

    const recentRequests =
      dailyData?.slice(0, 10).map((r) => ({
        type: r.request_type as AIRequestType,
        timestamp: r.created_at,
        success: r.success,
        tokens: (r.input_tokens || 0) + (r.output_tokens || 0),
      })) || [];

    return {
      hourly: {
        count: hourlyCount,
        limit: HOURLY_RATE_LIMIT,
        remaining: Math.max(0, HOURLY_RATE_LIMIT - hourlyCount),
      },
      daily: {
        count: dailyCount,
        limit: DAILY_RATE_LIMIT,
        remaining: Math.max(0, DAILY_RATE_LIMIT - dailyCount),
      },
      totalTokensToday,
      estimatedCostToday,
      recentRequests,
    };
  } catch (error) {
    console.error('Failed to get usage stats:', error);
    return {
      hourly: { count: 0, limit: HOURLY_RATE_LIMIT, remaining: HOURLY_RATE_LIMIT },
      daily: { count: 0, limit: DAILY_RATE_LIMIT, remaining: DAILY_RATE_LIMIT },
      totalTokensToday: 0,
      estimatedCostToday: 0,
      recentRequests: [],
    };
  }
}

/**
 * Get aggregate usage statistics for admin dashboard
 */
export async function getAggregateUsageStats(days: number = 7): Promise<{
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  estimatedCost: number;
  requestsByType: Record<AIRequestType, number>;
  requestsByDay: Array<{ date: string; count: number }>;
  topUsers: Array<{ userId: string; count: number }>;
}> {
  try {
    const supabase = await createClient();

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from('pb_ai_usage')
      .select('*')
      .gte('created_at', startDate)
      .order('created_at', { ascending: false });

    if (!data || data.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalTokens: 0,
        estimatedCost: 0,
        requestsByType: {} as Record<AIRequestType, number>,
        requestsByDay: [],
        topUsers: [],
      };
    }

    const totalRequests = data.length;
    const successfulRequests = data.filter((r) => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const totalTokens = data.reduce(
      (sum, r) => sum + (r.input_tokens || 0) + (r.output_tokens || 0),
      0
    );
    const estimatedCost = data.reduce((sum, r) => sum + (r.estimated_cost_cents || 0), 0);

    // Requests by type
    const requestsByType: Record<string, number> = {};
    data.forEach((r) => {
      requestsByType[r.request_type] = (requestsByType[r.request_type] || 0) + 1;
    });

    // Requests by day
    const requestsByDayMap: Record<string, number> = {};
    data.forEach((r) => {
      const date = r.created_at.split('T')[0];
      requestsByDayMap[date] = (requestsByDayMap[date] || 0) + 1;
    });
    const requestsByDay = Object.entries(requestsByDayMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top users
    const userCounts: Record<string, number> = {};
    data.forEach((r) => {
      userCounts[r.user_id] = (userCounts[r.user_id] || 0) + 1;
    });
    const topUsers = Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      totalTokens,
      estimatedCost,
      requestsByType: requestsByType as Record<AIRequestType, number>,
      requestsByDay,
      topUsers,
    };
  } catch (error) {
    console.error('Failed to get aggregate stats:', error);
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokens: 0,
      estimatedCost: 0,
      requestsByType: {} as Record<AIRequestType, number>,
      requestsByDay: [],
      topUsers: [],
    };
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate estimated cost in cents based on model pricing
 */
function calculateEstimatedCost(
  inputTokens: number,
  outputTokens: number,
  modelUsed: string
): number {
  // Pricing per 1K tokens (in cents)
  const pricing: Record<string, { input: number; output: number }> = {
    'gemini-1.5-pro': { input: 0.125, output: 0.5 },
    'gemini-1.5-flash': { input: 0.0375, output: 0.15 },
    'gemini-1.0-pro': { input: 0.05, output: 0.15 },
    default: { input: 0.125, output: 0.5 },
  };

  const rates = pricing[modelUsed] || pricing.default;

  const inputCost = (inputTokens / 1000) * rates.input;
  const outputCost = (outputTokens / 1000) * rates.output;

  return Math.ceil(inputCost + outputCost);
}

/**
 * Format token count for display
 */
export function formatTokenCount(tokens: number): string {
  if (tokens < 1000) return tokens.toString();
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1000000).toFixed(1)}M`;
}

/**
 * Format cost in cents for display (convert to Rands)
 */
export function formatCost(cents: number): string {
  const rands = cents / 100;
  if (rands < 0.01) return '< R0.01';
  return `R${rands.toFixed(2)}`;
}
