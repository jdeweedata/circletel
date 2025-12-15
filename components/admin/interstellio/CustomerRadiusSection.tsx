'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { SubscriberStatusBadge } from './SubscriberStatusBadge'
import { ActiveSessionsTable } from './ActiveSessionsTable'
import { UsageChart } from './UsageChart'
import {
  Radio,
  Wifi,
  WifiOff,
  RefreshCw,
  Activity,
  Gauge,
  Database,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface CustomerService {
  id: string
  connection_id: string | null
  package_name: string
  status: string
}

interface CustomerRadiusSectionProps {
  customerId: string
  services: CustomerService[]
}

interface SubscriberDetails {
  subscriber: {
    id: string
    username: string
    name: string | null
    enabled: boolean
    lastSeen: string | null
    uncappedData: boolean
  }
  status: {
    active: boolean
    uploadGb: number
    downloadGb: number
  } | null
  profile: {
    name: string
    downloadMbps: number
    uploadMbps: number
  } | null
  activeSessions: number
  creditStatus: {
    totalGb: number
    usedGb: number
    remainingGb: number
  } | null
}

interface Session {
  id: string
  subscriberId: string
  username: string
  realm: string | null
  framedIpAddress: string | null
  callingStationId: string | null
  startTime: string
  updatedTime: string
  nasIpAddress: string
  nasPort: number
  duration: {
    hours: number
    minutes: number
    formatted: string
  }
}

interface UsageData {
  data: Array<{
    time: string
    uploadMb: number
    downloadMb: number
    totalMb: number
  }>
  summary: {
    totalUploadGb: number
    totalDownloadGb: number
    totalCombinedGb: number
    dataPoints: number
  }
}

export function CustomerRadiusSection({
  customerId,
  services,
}: CustomerRadiusSectionProps) {
  // Filter services that have a connection_id (linked to Interstellio)
  const linkedServices = services.filter((s) => s.connection_id)

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    linkedServices[0]?.id || null
  )
  const [subscriberDetails, setSubscriberDetails] = useState<SubscriberDetails | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [usageData, setUsageData] = useState<UsageData | null>(null)
  const [aggregation, setAggregation] = useState<'hourly' | 'daily' | 'weekly' | 'monthly'>('daily')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const selectedService = linkedServices.find((s) => s.id === selectedServiceId)
  const subscriberId = selectedService?.connection_id

  const fetchSubscriberData = useCallback(async () => {
    if (!subscriberId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch subscriber details, sessions, and usage in parallel
      const [detailsRes, sessionsRes, usageRes] = await Promise.all([
        fetch(`/api/admin/integrations/interstellio/subscribers/${subscriberId}`),
        fetch(`/api/admin/integrations/interstellio/subscribers/${subscriberId}/sessions`),
        fetch(`/api/admin/integrations/interstellio/subscribers/${subscriberId}/usage?aggregation=${aggregation}&days=30`),
      ])

      if (!detailsRes.ok) throw new Error('Failed to fetch subscriber details')
      if (!sessionsRes.ok) throw new Error('Failed to fetch sessions')
      if (!usageRes.ok) throw new Error('Failed to fetch usage data')

      const [details, sessionsData, usage] = await Promise.all([
        detailsRes.json(),
        sessionsRes.json(),
        usageRes.json(),
      ])

      setSubscriberDetails(details)
      setSessions(sessionsData.sessions || [])
      setUsageData({
        data: usage.data || [],
        summary: usage.summary || null,
      })
    } catch (err) {
      console.error('Error fetching subscriber data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }, [subscriberId, aggregation])

  useEffect(() => {
    fetchSubscriberData()
  }, [fetchSubscriberData])

  const handleDisconnectSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/admin/integrations/interstellio/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to disconnect session')

      toast.success('Session disconnected')
      fetchSubscriberData()
    } catch {
      toast.error('Failed to disconnect session')
    }
  }

  const handleDisconnectAll = async () => {
    if (!subscriberId) return

    try {
      const res = await fetch(`/api/admin/integrations/interstellio/subscribers/${subscriberId}/sessions`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to disconnect all sessions')

      toast.success('All sessions disconnected')
      fetchSubscriberData()
    } catch {
      toast.error('Failed to disconnect sessions')
    }
  }

  // No linked services
  if (linkedServices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            RADIUS / Interstellio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <WifiOff className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium">No RADIUS Services</p>
            <p className="text-sm">This customer has no services linked to Interstellio.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            RADIUS / Interstellio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            RADIUS / Interstellio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-red-500">
            <AlertCircle className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">Error Loading RADIUS Data</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <Button variant="outline" onClick={fetchSubscriberData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const status: 'online' | 'offline' | 'disabled' = !subscriberDetails?.subscriber.enabled
    ? 'disabled'
    : sessions.length > 0
    ? 'online'
    : 'offline'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            RADIUS / Interstellio
          </CardTitle>
          <div className="flex items-center gap-2">
            {linkedServices.length > 1 && (
              <select
                className="border rounded px-2 py-1 text-sm"
                value={selectedServiceId || ''}
                onChange={(e) => setSelectedServiceId(e.target.value)}
              >
                {linkedServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.package_name}
                  </option>
                ))}
              </select>
            )}
            <Button variant="outline" size="sm" onClick={fetchSubscriberData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Connection Status */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Connection Status</span>
            </div>
            <SubscriberStatusBadge status={status} />
            {subscriberDetails?.subscriber.lastSeen && (
              <p className="text-xs text-gray-500 mt-2">
                Last seen: {new Date(subscriberDetails.subscriber.lastSeen).toLocaleString()}
              </p>
            )}
          </div>

          {/* Active Sessions */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Active Sessions</span>
            </div>
            <p className="text-2xl font-bold">{sessions.length}</p>
            {sessions.length > 0 && (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-red-600 text-xs"
                onClick={handleDisconnectAll}
              >
                Disconnect All
              </Button>
            )}
          </div>

          {/* Speed Tier */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Speed Tier</span>
            </div>
            {subscriberDetails?.profile ? (
              <>
                <p className="font-medium">{subscriberDetails.profile.name}</p>
                <p className="text-sm text-gray-500">
                  {subscriberDetails.profile.downloadMbps}/{subscriberDetails.profile.uploadMbps} Mbps
                </p>
              </>
            ) : (
              <p className="text-gray-400">Unknown</p>
            )}
          </div>

          {/* Data Cap (if applicable) */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Data</span>
            </div>
            {subscriberDetails?.subscriber.uncappedData ? (
              <Badge className="bg-green-500">Uncapped</Badge>
            ) : subscriberDetails?.creditStatus ? (
              <>
                <p className="font-medium">
                  {subscriberDetails.creditStatus.remainingGb.toFixed(1)} GB remaining
                </p>
                <p className="text-sm text-gray-500">
                  of {subscriberDetails.creditStatus.totalGb} GB
                </p>
              </>
            ) : (
              <Badge variant="outline">Unknown</Badge>
            )}
          </div>
        </div>

        {/* Active Sessions Table */}
        {sessions.length > 0 && (
          <ActiveSessionsTable
            sessions={sessions}
            onDisconnect={handleDisconnectSession}
            onRefresh={fetchSubscriberData}
          />
        )}

        {/* Usage Chart */}
        {usageData && (
          <UsageChart
            data={usageData.data}
            summary={usageData.summary}
            aggregation={aggregation}
            onAggregationChange={setAggregation}
            onRefresh={fetchSubscriberData}
            title="Usage (Last 30 Days)"
          />
        )}
      </CardContent>
    </Card>
  )
}
