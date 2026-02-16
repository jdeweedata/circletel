'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { SystemStatusBanner } from '@/components/status/SystemStatusBanner'
import { ProviderStatusGrid } from '@/components/status/ProviderStatusCard'
import { IncidentTimeline } from '@/components/status/IncidentTimeline'

type OverallStatus = 'operational' | 'degraded' | 'outage'
type ProviderStatus = 'operational' | 'degraded' | 'outage' | 'unknown'

interface ProviderHealth {
  name: string
  status: ProviderStatus
  latency: number | null
  lastCheck: string | null
}

interface IncidentUpdate {
  status: string
  message: string
  is_public: boolean
  created_at: string
}

interface Incident {
  id: string
  incident_number: string
  title: string
  severity: 'critical' | 'major' | 'minor' | 'maintenance'
  status: string
  affected_providers: string[]
  affected_regions: string[]
  started_at: string
  updates: IncidentUpdate[]
}

interface StatusData {
  overallStatus: OverallStatus
  providers: ProviderHealth[]
  activeIncidents: Incident[]
  lastUpdated: string
}

export default function StatusPage() {
  const [status, setStatus] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStatus = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)

      const response = await fetch('/api/public/status', {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch status')
      }

      const data = await response.json()
      setStatus(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching status:', err)
      setError('Unable to load status. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStatus()
    }, 60000)

    return () => clearInterval(interval)
  }, [fetchStatus])

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-24 bg-gray-200 rounded-xl mb-8" />
        <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg" />
          ))}
        </div>
        <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
        <div className="h-32 bg-gray-200 rounded-lg" />
      </div>
    )
  }

  if (error && !status) {
    return (
      <div className="text-center py-12">
        <p className="text-ui-text-muted mb-4">{error}</p>
        <button
          onClick={() => fetchStatus()}
          className="px-4 py-2 bg-circleTel-orange text-white rounded-lg hover:bg-circleTel-orange/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!status) return null

  return (
    <div>
      {/* Refresh button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => fetchStatus(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-ui-text-muted hover:text-ui-text-primary transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
          />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Status Banner */}
      <SystemStatusBanner
        status={status.overallStatus}
        lastUpdated={status.lastUpdated}
      />

      {/* Provider Status Grid */}
      <ProviderStatusGrid providers={status.providers} />

      {/* Active Incidents */}
      <IncidentTimeline incidents={status.activeIncidents} />

      {/* Uptime Section (placeholder for future) */}
      <div className="mt-8 pt-8 border-t border-ui-border">
        <h2 className="text-lg font-semibold text-ui-text-primary mb-4">
          Uptime History
        </h2>
        <div className="bg-white border border-ui-border rounded-lg p-6 text-center">
          <p className="text-ui-text-muted">
            30-day uptime history coming soon
          </p>
        </div>
      </div>

      {/* Subscribe Section */}
      <div className="mt-8 bg-white border border-ui-border rounded-lg p-6">
        <h3 className="font-semibold text-ui-text-primary mb-2">
          Get Notified
        </h3>
        <p className="text-sm text-ui-text-muted mb-4">
          Subscribe to receive updates when incidents are posted or resolved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-4 py-2 border border-ui-border rounded-lg focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20 focus:border-circleTel-orange"
            disabled
          />
          <button
            className="px-6 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
            disabled
          >
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  )
}
