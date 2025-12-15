'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Users, Wifi, Activity, HardDrive, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InterstellioStats {
  totalSubscribers: number
  activeSubscribers: number
  inactiveSubscribers: number
  activeSessions: number
  totalUsage: {
    uploadGb: number
    downloadGb: number
  }
}

interface InterstellioStatsCardsProps {
  stats: InterstellioStats | null
  linkedServices: number
  isLoading?: boolean
}

export function InterstellioStatsCards({
  stats,
  linkedServices,
  isLoading = false,
}: InterstellioStatsCardsProps) {
  const cards = [
    {
      title: 'Total Subscribers',
      value: stats?.totalSubscribers ?? 0,
      subtitle: `${stats?.activeSubscribers ?? 0} active, ${stats?.inactiveSubscribers ?? 0} inactive`,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Sessions',
      value: stats?.activeSessions ?? 0,
      subtitle: 'Currently connected',
      icon: Wifi,
      color: 'bg-green-500',
    },
    {
      title: 'Linked Services',
      value: linkedServices,
      subtitle: 'Connected to CircleTel customers',
      icon: Activity,
      color: 'bg-purple-500',
    },
    {
      title: 'Total Usage (24h)',
      value: `${((stats?.totalUsage?.uploadGb ?? 0) + (stats?.totalUsage?.downloadGb ?? 0)).toFixed(2)} GB`,
      subtitle: (
        <span className="flex items-center gap-2 text-xs">
          <span className="flex items-center">
            <ArrowUp className="w-3 h-3 mr-0.5 text-green-500" />
            {stats?.totalUsage?.uploadGb?.toFixed(2) ?? '0'} GB
          </span>
          <span className="flex items-center">
            <ArrowDown className="w-3 h-3 mr-0.5 text-blue-500" />
            {stats?.totalUsage?.downloadGb?.toFixed(2) ?? '0'} GB
          </span>
        </span>
      ),
      icon: HardDrive,
      color: 'bg-orange-500',
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-6 bg-gray-200 rounded w-16" />
                  <div className="h-3 bg-gray-200 rounded w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn('p-3 rounded-lg', card.color)}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <div className="text-gray-400 mt-0.5">{card.subtitle}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
