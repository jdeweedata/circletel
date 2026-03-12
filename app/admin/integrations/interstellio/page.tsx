'use client';

import { PiUsersBold, PiWifiHighBold, PiChartLineBold } from 'react-icons/pi';
import { useState, useEffect, useCallback } from 'react';
import { UnderlineTabs, TabPanel, SectionCard } from '@/components/admin/shared';
import {
  InterstellioHeader,
  InterstellioStatsCards,
  SubscriberTable,
  ActiveSessionsTable,
  UsageChart,
} from '@/components/admin/interstellio';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface DashboardStats {
  totalSubscribers: number
  activeSubscribers: number
  inactiveSubscribers: number
  disabledSubscribers: number
  onlineSubscribers: number
  activeSessions: number
  totalActiveSessions: number
  linkedServices: number
  unlinkedSubscribers: number
  totalUsage: {
    uploadGb: number
    downloadGb: number
  }
  profiles: Array<{
    id: string
    name: string
    downloadMbps: number
    uploadMbps: number
    subscriberCount: number
  }>
  health: {
    status: 'healthy' | 'degraded' | 'error'
    lastChecked: string
    responseTimeMs: number
  }
}

interface Subscriber {
  id: string
  username: string
  name: string | null
  enabled: boolean
  status: 'online' | 'offline' | 'disabled'
  activeSessions: number
  profileId: string
  profileName: string
  lastSeen: string | null
  createdAt: string
  uncappedData: boolean
  linkedCustomerId: string | null
  linkedServiceId: string | null
  linkedCustomerName: string | null
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

interface UsageDataPoint {
  time: string
  uploadMb: number
  downloadMb: number
  totalMb: number
}

interface UsageSummary {
  totalUploadGb: number
  totalDownloadGb: number
  totalCombinedGb: number
  dataPoints: number
}

const TAB_CONFIG = [
  { id: 'subscribers', label: 'Subscribers' },
  { id: 'sessions', label: 'Active Sessions' },
  { id: 'usage', label: 'Usage Analytics' },
] as const;

type TabId = typeof TAB_CONFIG[number]['id'];

export default function InterstellioDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [usageData, setUsageData] = useState<UsageDataPoint[]>([])
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null)
  const [aggregation, setAggregation] = useState<'hourly' | 'daily' | 'weekly' | 'monthly'>('daily')
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [selectedSubscriberId, setSelectedSubscriberId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('subscribers')

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch stats and subscribers in parallel
      const [statsRes, subscribersRes] = await Promise.all([
        fetch('/api/admin/integrations/interstellio'),
        fetch('/api/admin/integrations/interstellio/subscribers'),
      ])

      if (!statsRes.ok) throw new Error('Failed to fetch stats')
      if (!subscribersRes.ok) throw new Error('Failed to fetch subscribers')

      const [statsData, subscribersData] = await Promise.all([
        statsRes.json(),
        subscribersRes.json(),
      ])

      // Transform API response to expected format
      setStats({
        totalSubscribers: statsData.summary?.totalSubscribers ?? 0,
        activeSubscribers: statsData.summary?.activeSubscribers ?? 0,
        inactiveSubscribers: statsData.summary?.inactiveSubscribers ?? 0,
        disabledSubscribers: 0,
        onlineSubscribers: statsData.summary?.activeSubscribers ?? 0,
        activeSessions: statsData.summary?.activeSessions ?? 0,
        totalActiveSessions: statsData.summary?.activeSessions ?? 0,
        linkedServices: statsData.linkedServices ?? 0,
        unlinkedSubscribers: 0,
        totalUsage: statsData.summary?.totalUsage ?? { uploadGb: 0, downloadGb: 0 },
        profiles: [],
        health: {
          status: statsData.healthStatus ?? 'healthy',
          lastChecked: statsData.lastCheckedAt ?? new Date().toISOString(),
          responseTimeMs: 0,
        },
      })
      setSubscribers(subscribersData.subscribers || [])

      // Collect all active sessions from all subscribers
      const allSessions: Session[] = []
      for (const sub of subscribersData.subscribers || []) {
        if (sub.activeSessions > 0) {
          const sessionsRes = await fetch(
            `/api/admin/integrations/interstellio/subscribers/${sub.id}/sessions`
          )
          if (sessionsRes.ok) {
            const sessionsData = await sessionsRes.json()
            allSessions.push(...(sessionsData.sessions || []))
          }
        }
      }
      setSessions(allSessions)

      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to fetch Interstellio data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchUsageData = useCallback(async () => {
    if (!selectedSubscriberId) {
      // Fetch aggregate usage for all subscribers (we'll use first subscriber for now)
      if (subscribers.length === 0) return

      // Sum usage from all subscribers
      let totalUpload = 0
      let totalDownload = 0
      const aggregatedData: Record<string, UsageDataPoint> = {}

      for (const sub of subscribers.slice(0, 5)) { // Limit to first 5 for performance
        try {
          const res = await fetch(
            `/api/admin/integrations/interstellio/subscribers/${sub.id}/usage?aggregation=${aggregation}&days=30`
          )
          if (res.ok) {
            const data = await res.json()
            totalUpload += data.summary?.totalUploadGb || 0
            totalDownload += data.summary?.totalDownloadGb || 0

            for (const point of data.data || []) {
              if (!aggregatedData[point.time]) {
                aggregatedData[point.time] = {
                  time: point.time,
                  uploadMb: 0,
                  downloadMb: 0,
                  totalMb: 0,
                }
              }
              aggregatedData[point.time].uploadMb += point.uploadMb
              aggregatedData[point.time].downloadMb += point.downloadMb
              aggregatedData[point.time].totalMb += point.totalMb
            }
          }
        } catch {
          // Continue with other subscribers
        }
      }

      setUsageData(Object.values(aggregatedData).sort((a, b) => a.time.localeCompare(b.time)))
      setUsageSummary({
        totalUploadGb: totalUpload,
        totalDownloadGb: totalDownload,
        totalCombinedGb: totalUpload + totalDownload,
        dataPoints: Object.keys(aggregatedData).length,
      })
    } else {
      // Fetch usage for selected subscriber
      try {
        const res = await fetch(
          `/api/admin/integrations/interstellio/subscribers/${selectedSubscriberId}/usage?aggregation=${aggregation}&days=30`
        )
        if (res.ok) {
          const data = await res.json()
          setUsageData(data.data || [])
          setUsageSummary(data.summary || null)
        }
      } catch {
        toast.error('Failed to fetch usage data')
      }
    }
  }, [selectedSubscriberId, aggregation, subscribers])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  useEffect(() => {
    if (subscribers.length > 0) {
      fetchUsageData()
    }
  }, [fetchUsageData, subscribers.length])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchDashboardData()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, fetchDashboardData])

  const handleDisconnectSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/admin/integrations/interstellio/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to disconnect session')

      toast.success('Session disconnected')
      fetchDashboardData()
    } catch {
      toast.error('Failed to disconnect session')
    }
  }

  const handleDisconnectAllSessions = async (subscriberId: string) => {
    try {
      const res = await fetch(
        `/api/admin/integrations/interstellio/subscribers/${subscriberId}/sessions`,
        { method: 'DELETE' }
      )

      if (!res.ok) throw new Error('Failed to disconnect sessions')

      toast.success('All sessions disconnected')
      fetchDashboardData()
    } catch {
      toast.error('Failed to disconnect sessions')
    }
  }

  const handleViewSubscriberDetails = (subscriberId: string) => {
    setSelectedSubscriberId(subscriberId)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <InterstellioHeader
        healthStatus={stats?.health?.status ?? 'healthy'}
        lastRefresh={lastRefresh}
        autoRefresh={autoRefresh}
        onAutoRefreshChange={setAutoRefresh}
        onRefresh={fetchDashboardData}
        isLoading={isLoading}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stat Cards */}
        <InterstellioStatsCards
          stats={stats}
          linkedServices={stats?.linkedServices ?? 0}
          isLoading={isLoading}
        />

        {/* Tabs */}
        <UnderlineTabs
          tabs={TAB_CONFIG.map(tab => ({
            ...tab,
            label: tab.id === 'subscribers'
              ? `Subscribers (${subscribers.length})`
              : tab.id === 'sessions'
                ? `Active Sessions (${sessions.length})`
                : tab.label
          }))}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as TabId)}
        />

        {/* SUBSCRIBERS TAB */}
        <TabPanel id="subscribers" activeTab={activeTab} className="mt-6">
          <SectionCard icon={PiUsersBold} title="All Subscribers">
            <SubscriberTable
              subscribers={subscribers}
              isLoading={isLoading}
              onRefresh={fetchDashboardData}
              onDisconnectAll={handleDisconnectAllSessions}
              onViewDetails={handleViewSubscriberDetails}
            />
          </SectionCard>
        </TabPanel>

        {/* SESSIONS TAB */}
        <TabPanel id="sessions" activeTab={activeTab} className="mt-6">
          <SectionCard icon={PiWifiHighBold} title="Active Sessions">
            <ActiveSessionsTable
              sessions={sessions}
              isLoading={isLoading}
              onRefresh={fetchDashboardData}
              onDisconnect={handleDisconnectSession}
            />
          </SectionCard>
        </TabPanel>

        {/* USAGE TAB */}
        <TabPanel id="usage" activeTab={activeTab} className="mt-6">
          <SectionCard icon={PiChartLineBold} title="Usage Analytics">
            <div className="space-y-4">
              {/* Subscriber selector */}
              <div className="flex items-center gap-4">
                <Label className="text-sm font-medium">View usage for:</Label>
                <select
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={selectedSubscriberId || 'all'}
                  onChange={(e) =>
                    setSelectedSubscriberId(e.target.value === 'all' ? null : e.target.value)
                  }
                >
                  <option value="all">All Subscribers (Top 5)</option>
                  {subscribers.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.username} {sub.linkedCustomerName ? `(${sub.linkedCustomerName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <UsageChart
                data={usageData}
                summary={usageSummary}
                aggregation={aggregation}
                onAggregationChange={setAggregation}
                onRefresh={fetchUsageData}
                title={
                  selectedSubscriberId
                    ? `Usage - ${subscribers.find((s) => s.id === selectedSubscriberId)?.username || 'Selected'}`
                    : 'Aggregate Usage (Top 5 Subscribers)'
                }
              />
            </div>
          </SectionCard>
        </TabPanel>
      </div>
    </div>
  );
}
