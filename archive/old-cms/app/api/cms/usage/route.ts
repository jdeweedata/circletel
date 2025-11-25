/**
 * CMS AI Usage Statistics API Route
 *
 * Provides usage statistics and monitoring data for AI content generation
 *
 * Endpoints:
 * - GET /api/cms/usage - Get current user's usage statistics
 * - GET /api/cms/usage?type=daily - Get daily usage
 * - GET /api/cms/usage?type=monthly - Get monthly usage
 * - GET /api/cms/usage?type=by_type - Get usage by request type
 * - GET /api/cms/usage?type=recent_logs - Get recent usage logs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth'
import {
  getDailyUsage,
  getMonthlyUsage,
  getUsageByType,
  getRecentUsageLogs,
  checkRateLimit,
  formatCost,
  formatTokens,
} from '@/lib/cms/usage-tracking-service'

/**
 * GET /api/cms/usage
 * Get usage statistics for current user
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { adminUser, user } = authResult

    // 2. Check CMS permissions
    const permissionError = requirePermission(adminUser, 'cms:create')
    if (permissionError) {
      return permissionError
    }

    // 3. Get query parameters
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'summary'
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // 4. Fetch data based on type
    switch (type) {
      case 'daily': {
        const dailyUsage = await getDailyUsage(user.id)
        if (!dailyUsage) {
          return NextResponse.json(
            { error: 'Failed to fetch daily usage' },
            { status: 500 }
          )
        }
        return NextResponse.json({
          type: 'daily',
          data: {
            ...dailyUsage,
            cost_formatted: formatCost(Number(dailyUsage.total_cost_cents)),
            tokens_formatted: formatTokens(Number(dailyUsage.total_tokens)),
          },
        })
      }

      case 'monthly': {
        const monthlyUsage = await getMonthlyUsage(user.id)
        if (!monthlyUsage) {
          return NextResponse.json(
            { error: 'Failed to fetch monthly usage' },
            { status: 500 }
          )
        }
        return NextResponse.json({
          type: 'monthly',
          data: {
            ...monthlyUsage,
            cost_formatted: formatCost(Number(monthlyUsage.total_cost_cents)),
            tokens_formatted: formatTokens(Number(monthlyUsage.total_tokens)),
          },
        })
      }

      case 'by_type': {
        const start = startDate ? new Date(startDate) : undefined
        const end = endDate ? new Date(endDate) : undefined
        const usageByType = await getUsageByType(user.id, start, end)

        return NextResponse.json({
          type: 'by_type',
          data: usageByType.map((item) => ({
            ...item,
            cost_formatted: formatCost(Number(item.total_cost_cents)),
            tokens_formatted: formatTokens(Number(item.total_tokens)),
          })),
        })
      }

      case 'recent_logs': {
        const limit = parseInt(searchParams.get('limit') || '10')
        const logs = await getRecentUsageLogs(user.id, limit)

        return NextResponse.json({
          type: 'recent_logs',
          data: logs.map((log) => ({
            ...log,
            cost_formatted: formatCost(log.estimated_cost_cents),
            tokens_formatted: formatTokens(log.total_tokens),
          })),
        })
      }

      case 'summary':
      default: {
        // Get all statistics for summary view
        const [dailyUsage, monthlyUsage, usageByType, rateLimitInfo] =
          await Promise.all([
            getDailyUsage(user.id),
            getMonthlyUsage(user.id),
            getUsageByType(user.id),
            checkRateLimit(user.id),
          ])

        return NextResponse.json({
          type: 'summary',
          data: {
            daily: dailyUsage
              ? {
                  ...dailyUsage,
                  cost_formatted: formatCost(Number(dailyUsage.total_cost_cents)),
                  tokens_formatted: formatTokens(Number(dailyUsage.total_tokens)),
                }
              : null,
            monthly: monthlyUsage
              ? {
                  ...monthlyUsage,
                  cost_formatted: formatCost(Number(monthlyUsage.total_cost_cents)),
                  tokens_formatted: formatTokens(Number(monthlyUsage.total_tokens)),
                }
              : null,
            by_type: usageByType.map((item) => ({
              ...item,
              cost_formatted: formatCost(Number(item.total_cost_cents)),
              tokens_formatted: formatTokens(Number(item.total_tokens)),
            })),
            rate_limit: rateLimitInfo,
          },
        })
      }
    }
  } catch (error) {
    console.error('Usage statistics API error:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
