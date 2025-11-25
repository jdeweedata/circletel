'use client'

/**
 * AI Usage Monitoring Dashboard
 *
 * Displays AI API usage statistics, rate limits, and cost tracking
 * Features:
 * - Real-time usage statistics
 * - Rate limit warnings
 * - Cost tracking
 * - Usage breakdown by type
 * - Recent activity log
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UsageStatistics {
  request_count: number
  total_tokens: number
  total_cost_cents: number
  cost_formatted: string
  tokens_formatted: string
  last_request?: string
  avg_response_time_ms?: number
}

interface UsageByType {
  request_type: string
  request_count: number
  total_tokens: number
  total_cost_cents: number
  success_rate: number
  cost_formatted: string
  tokens_formatted: string
}

interface RateLimitInfo {
  within_limits: boolean
  daily_count: number
  hourly_count: number
  daily_remaining: number
  hourly_remaining: number
}

interface UsageSummary {
  daily: UsageStatistics | null
  monthly: UsageStatistics | null
  by_type: UsageByType[]
  rate_limit: RateLimitInfo
}

interface UsageLog {
  id: string
  request_type: string
  model_used: string
  total_tokens: number
  estimated_cost_cents: number
  cost_formatted: string
  tokens_formatted: string
  success: boolean
  created_at: string
  response_time_ms?: number
}

export default function UsageMonitoringDashboard() {
  const [summary, setSummary] = useState<UsageSummary | null>(null)
  const [recentLogs, setRecentLogs] = useState<UsageLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'logs'>('overview')

  const supabase = createClient()

  // Fetch usage summary
  const fetchSummary = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setError('Not authenticated')
        return
      }

      const response = await fetch('/api/cms/usage?type=summary')
      if (!response.ok) {
        throw new Error('Failed to fetch usage summary')
      }

      const result = await response.json()
      setSummary(result.data)
    } catch (err) {
      console.error('Error fetching summary:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    }
  }

  // Fetch recent logs
  const fetchRecentLogs = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/cms/usage?type=recent_logs&limit=10')
      if (!response.ok) {
        throw new Error('Failed to fetch recent logs')
      }

      const result = await response.json()
      setRecentLogs(result.data)
    } catch (err) {
      console.error('Error fetching logs:', err)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchSummary(), fetchRecentLogs()])
      setLoading(false)
    }

    loadData()

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchSummary()
      fetchRecentLogs()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-circleTel-orange"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">{error}</p>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">No usage data available</p>
      </div>
    )
  }

  const { daily, monthly, by_type, rate_limit } = summary

  // Calculate percentages for rate limits
  const dailyPercentage = ((rate_limit.daily_count / (rate_limit.daily_count + rate_limit.daily_remaining)) * 100) || 0
  const hourlyPercentage = ((rate_limit.hourly_count / (rate_limit.hourly_count + rate_limit.hourly_remaining)) * 100) || 0

  // Get color based on percentage
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-circleTel-darkNeutral">AI Usage Monitoring</h2>
        <button
          onClick={() => {
            fetchSummary()
            fetchRecentLogs()
          }}
          className="px-4 py-2 bg-circleTel-orange text-white rounded-lg hover:bg-opacity-90 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Rate Limit Warning */}
      {!rate_limit.within_limits && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <h3 className="text-red-800 font-semibold mb-1">Rate Limit Exceeded</h3>
          <p className="text-red-700 text-sm">
            You have exceeded your rate limits. Please wait before making more requests.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(['overview', 'details', 'logs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-circleTel-orange text-circleTel-orange'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Rate Limits */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-circleTel-darkNeutral mb-4">Rate Limits</h3>
            <div className="space-y-4">
              {/* Daily Limit */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Daily Usage</span>
                  <span className="text-sm text-gray-600">
                    {rate_limit.daily_count} / {rate_limit.daily_count + rate_limit.daily_remaining} ({dailyPercentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getProgressColor(dailyPercentage)}`}
                    style={{ width: `${Math.min(dailyPercentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{rate_limit.daily_remaining} requests remaining today</p>
              </div>

              {/* Hourly Limit */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Hourly Usage</span>
                  <span className="text-sm text-gray-600">
                    {rate_limit.hourly_count} / {rate_limit.hourly_count + rate_limit.hourly_remaining} ({hourlyPercentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getProgressColor(hourlyPercentage)}`}
                    style={{ width: `${Math.min(hourlyPercentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{rate_limit.hourly_remaining} requests remaining this hour</p>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Daily Usage */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Today</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-2xl font-bold text-circleTel-darkNeutral">{daily?.request_count || 0}</p>
                  <p className="text-xs text-gray-500">Requests</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-700">{daily?.tokens_formatted || '0'}</p>
                  <p className="text-xs text-gray-500">Tokens</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-circleTel-orange">{daily?.cost_formatted || '$0.00'}</p>
                  <p className="text-xs text-gray-500">Estimated Cost</p>
                </div>
              </div>
            </div>

            {/* Monthly Usage */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">This Month</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-2xl font-bold text-circleTel-darkNeutral">{monthly?.request_count || 0}</p>
                  <p className="text-xs text-gray-500">Requests</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-700">{monthly?.tokens_formatted || '0'}</p>
                  <p className="text-xs text-gray-500">Tokens</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-circleTel-orange">{monthly?.cost_formatted || '$0.00'}</p>
                  <p className="text-xs text-gray-500">Estimated Cost</p>
                </div>
              </div>
            </div>

            {/* Performance */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Performance</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-2xl font-bold text-circleTel-darkNeutral">
                    {monthly?.avg_response_time_ms ? `${Number(monthly.avg_response_time_ms).toFixed(0)}ms` : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">Avg Response Time</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-700">
                    {by_type.reduce((sum, item) => sum + Number(item.success_rate), 0) / (by_type.length || 1)}%
                  </p>
                  <p className="text-xs text-gray-500">Success Rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <h3 className="text-lg font-semibold text-circleTel-darkNeutral p-6 border-b border-gray-200">
              Usage by Request Type
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requests
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tokens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Success Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {by_type.length > 0 ? (
                    by_type.map((item) => (
                      <tr key={item.request_type}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.request_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.request_count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.tokens_formatted}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.cost_formatted}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.success_rate}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No usage data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <h3 className="text-lg font-semibold text-circleTel-darkNeutral p-6 border-b border-gray-200">
              Recent Activity
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tokens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentLogs.length > 0 ? (
                    recentLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {log.request_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.model_used}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.tokens_formatted}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.cost_formatted}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              log.success
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {log.success ? 'Success' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(log.created_at).toLocaleString()}
                          {log.response_time_ms && (
                            <span className="text-xs text-gray-400 block">{log.response_time_ms}ms</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No recent activity
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
