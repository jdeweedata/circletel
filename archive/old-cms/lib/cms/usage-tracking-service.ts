/**
 * AI Usage Tracking Service
 * Tracks AI API usage, enforces rate limits, and calculates costs
 */

import { createClient } from '@/lib/supabase/server'

export interface AIUsageLog {
  id: string
  user_id: string
  request_type: 'content_generation' | 'seo_optimization' | 'image_generation' | 'content_rewrite'
  model_used: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  estimated_cost_cents: number
  page_id?: string
  content_type?: string
  prompt_length?: number
  response_time_ms?: number
  success: boolean
  error_message?: string
  created_at: string
}

export interface RateLimitCheck {
  within_limits: boolean
  daily_count: number
  hourly_count: number
  daily_remaining: number
  hourly_remaining: number
}

export interface UsageStatistics {
  request_count: number
  total_tokens: number
  total_cost_cents: number
  last_request?: string
  avg_response_time_ms?: number
}

export interface UsageByType {
  request_type: string
  request_count: number
  total_tokens: number
  total_cost_cents: number
  success_rate: number
}

// Pricing per 1M tokens (in USD cents)
const MODEL_PRICING = {
  'gemini-1.5-pro': {
    input: 125, // $1.25 per 1M input tokens
    output: 500, // $5.00 per 1M output tokens
  },
  'gemini-1.5-flash': {
    input: 7.5, // $0.075 per 1M input tokens
    output: 30, // $0.30 per 1M output tokens
  },
  'gemini-pro': {
    input: 50, // $0.50 per 1M input tokens
    output: 150, // $1.50 per 1M output tokens
  },
} as const

// Rate limits (can be configured per user tier in the future)
export const RATE_LIMITS = {
  DAILY_LIMIT: 100, // 100 requests per day
  HOURLY_LIMIT: 20, // 20 requests per hour
  PREMIUM_DAILY_LIMIT: 500,
  PREMIUM_HOURLY_LIMIT: 100,
} as const

/**
 * Calculate estimated cost for AI API usage
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING] || MODEL_PRICING['gemini-1.5-flash']

  // Calculate cost in cents
  const inputCost = (inputTokens / 1_000_000) * pricing.input
  const outputCost = (outputTokens / 1_000_000) * pricing.output

  return Math.round(inputCost + outputCost)
}

/**
 * Log AI API usage to database
 */
export async function logAIUsage(params: {
  userId: string
  requestType: AIUsageLog['request_type']
  modelUsed: string
  inputTokens: number
  outputTokens: number
  pageId?: string
  contentType?: string
  promptLength?: number
  responseTimeMs?: number
  success: boolean
  errorMessage?: string
}): Promise<AIUsageLog | null> {
  try {
    const supabase = await createClient()

    const estimatedCostCents = calculateCost(
      params.modelUsed,
      params.inputTokens,
      params.outputTokens
    )

    const { data, error } = await supabase
      .from('ai_usage_logs')
      .insert({
        user_id: params.userId,
        request_type: params.requestType,
        model_used: params.modelUsed,
        input_tokens: params.inputTokens,
        output_tokens: params.outputTokens,
        estimated_cost_cents: estimatedCostCents,
        page_id: params.pageId,
        content_type: params.contentType,
        prompt_length: params.promptLength,
        response_time_ms: params.responseTimeMs,
        success: params.success,
        error_message: params.errorMessage,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to log AI usage:', error)
      return null
    }

    return data as AIUsageLog
  } catch (error) {
    console.error('Error logging AI usage:', error)
    return null
  }
}

/**
 * Check if user has exceeded rate limits
 */
export async function checkRateLimit(
  userId: string,
  isPremium: boolean = false
): Promise<RateLimitCheck> {
  try {
    const supabase = await createClient()

    const dailyLimit = isPremium ? RATE_LIMITS.PREMIUM_DAILY_LIMIT : RATE_LIMITS.DAILY_LIMIT
    const hourlyLimit = isPremium ? RATE_LIMITS.PREMIUM_HOURLY_LIMIT : RATE_LIMITS.HOURLY_LIMIT

    const { data, error } = await supabase
      .rpc('check_ai_rate_limit', {
        target_user_id: userId,
        daily_limit: dailyLimit,
        hourly_limit: hourlyLimit,
      })
      .single()

    if (error) {
      console.error('Failed to check rate limit:', error)
      // Return safe defaults on error (allow request)
      return {
        within_limits: true,
        daily_count: 0,
        hourly_count: 0,
        daily_remaining: dailyLimit,
        hourly_remaining: hourlyLimit,
      }
    }

    return data as RateLimitCheck
  } catch (error) {
    console.error('Error checking rate limit:', error)
    // Return safe defaults on error
    return {
      within_limits: true,
      daily_count: 0,
      hourly_count: 0,
      daily_remaining: RATE_LIMITS.DAILY_LIMIT,
      hourly_remaining: RATE_LIMITS.HOURLY_LIMIT,
    }
  }
}

/**
 * Get user's daily usage statistics
 */
export async function getDailyUsage(userId: string): Promise<UsageStatistics | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .rpc('get_user_daily_ai_usage', {
        target_user_id: userId,
      })
      .single()

    if (error) {
      console.error('Failed to get daily usage:', error)
      return null
    }

    return data as UsageStatistics
  } catch (error) {
    console.error('Error getting daily usage:', error)
    return null
  }
}

/**
 * Get user's monthly usage statistics
 */
export async function getMonthlyUsage(userId: string): Promise<UsageStatistics | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .rpc('get_user_monthly_ai_usage', {
        target_user_id: userId,
      })
      .single()

    if (error) {
      console.error('Failed to get monthly usage:', error)
      return null
    }

    return data as UsageStatistics
  } catch (error) {
    console.error('Error getting monthly usage:', error)
    return null
  }
}

/**
 * Get usage statistics broken down by request type
 */
export async function getUsageByType(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<UsageByType[]> {
  try {
    const supabase = await createClient()

    const params: any = {
      target_user_id: userId,
    }

    if (startDate) {
      params.start_date = startDate.toISOString()
    }
    if (endDate) {
      params.end_date = endDate.toISOString()
    }

    const { data, error } = await supabase
      .rpc('get_ai_usage_by_type', params)

    if (error) {
      console.error('Failed to get usage by type:', error)
      return []
    }

    return data as UsageByType[]
  } catch (error) {
    console.error('Error getting usage by type:', error)
    return []
  }
}

/**
 * Get recent usage logs for a user
 */
export async function getRecentUsageLogs(
  userId: string,
  limit: number = 10
): Promise<AIUsageLog[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to get recent usage logs:', error)
      return []
    }

    return data as AIUsageLog[]
  } catch (error) {
    console.error('Error getting recent usage logs:', error)
    return []
  }
}

/**
 * Format cost in cents to currency string
 */
export function formatCost(cents: number): string {
  const dollars = cents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(dollars)
}

/**
 * Format token count with commas
 */
export function formatTokens(tokens: number): string {
  return new Intl.NumberFormat('en-US').format(tokens)
}
