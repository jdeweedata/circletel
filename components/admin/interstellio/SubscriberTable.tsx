'use client'
import { PiArrowSquareOutBold, PiArrowsClockwiseBold, PiDotsThreeVerticalBold, PiEyeBold, PiMagnifyingGlassBold, PiPlugBold, PiWifiHighBold } from 'react-icons/pi';

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SubscriberStatusBadge } from './SubscriberStatusBadge'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

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

interface SubscriberTableProps {
  subscribers: Subscriber[]
  isLoading?: boolean
  onRefresh?: () => void
  onDisconnectAll?: (subscriberId: string) => Promise<void>
  onViewDetails?: (subscriberId: string) => void
}

export function SubscriberTable({
  subscribers,
  isLoading = false,
  onRefresh,
  onDisconnectAll,
  onViewDetails,
}: SubscriberTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  const filteredSubscribers = subscribers.filter(
    (sub) =>
      sub.username.toLowerCase().includes(search.toLowerCase()) ||
      sub.name?.toLowerCase().includes(search.toLowerCase()) ||
      sub.linkedCustomerName?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDisconnectAll = async (subscriberId: string) => {
    if (!onDisconnectAll) return
    setDisconnecting(subscriberId)
    try {
      await onDisconnectAll(subscriberId)
    } finally {
      setDisconnecting(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="h-10 flex-1 max-w-sm bg-slate-200 animate-pulse rounded-md" />
          <div className="h-10 w-24 bg-slate-200 animate-pulse rounded-md" />
        </div>
        <div className="border rounded-lg overflow-hidden">
          <div className="h-96 bg-slate-100 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search subscribers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} className="w-full sm:w-auto">
            <PiArrowsClockwiseBold className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="min-w-[200px]">Username</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="min-w-[100px]">Sessions</TableHead>
                <TableHead className="min-w-[140px]">Speed Tier</TableHead>
                <TableHead className="min-w-[100px] hidden md:table-cell">Last Seen</TableHead>
                <TableHead className="min-w-[140px] hidden lg:table-cell">Linked Customer</TableHead>
                <TableHead className="w-[60px] sticky right-0 bg-slate-50">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscribers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    {search ? 'No subscribers match your search' : 'No subscribers found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubscribers.map((subscriber) => (
                  <TableRow key={subscriber.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{subscriber.username}</p>
                        {subscriber.name && (
                          <p className="text-sm text-slate-500 truncate">{subscriber.name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <SubscriberStatusBadge status={subscriber.status} />
                    </TableCell>
                    <TableCell>
                      {subscriber.activeSessions > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <PiWifiHighBold className="w-3.5 h-3.5 flex-shrink-0" />
                          {subscriber.activeSessions} active
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm text-slate-700">{subscriber.profileName}</p>
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border',
                          subscriber.uncappedData
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        )}>
                          {subscriber.uncappedData ? 'Uncapped' : 'Capped'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {subscriber.lastSeen ? (
                        <span className="text-sm text-slate-500">
                          {formatDistanceToNow(new Date(subscriber.lastSeen), { addSuffix: true })}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {subscriber.linkedCustomerId ? (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-blue-600 hover:text-blue-700"
                          onClick={() => router.push(`/admin/customers/${subscriber.linkedCustomerId}`)}
                        >
                          <span className="truncate max-w-[120px]">{subscriber.linkedCustomerName}</span>
                          <PiArrowSquareOutBold className="h-3 w-3 ml-1 flex-shrink-0" />
                        </Button>
                      ) : (
                        <span className="text-slate-400 text-sm">Not linked</span>
                      )}
                    </TableCell>
                    <TableCell className="sticky right-0 bg-white">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <PiDotsThreeVerticalBold className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onViewDetails?.(subscriber.id)}
                          >
                            <PiEyeBold className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {subscriber.activeSessions > 0 && onDisconnectAll && (
                            <DropdownMenuItem
                              className="text-red-600"
                              disabled={disconnecting === subscriber.id}
                              onClick={() => handleDisconnectAll(subscriber.id)}
                            >
                              <PiPlugBold className="h-4 w-4 mr-2" />
                              {disconnecting === subscriber.id
                                ? 'Disconnecting...'
                                : 'Disconnect All Sessions'}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-slate-500">
        <span className="text-center sm:text-left">
          Showing {filteredSubscribers.length} of {subscribers.length} subscribers
        </span>
        <span className="text-center sm:text-right text-xs text-slate-400 md:hidden">
          Scroll right for more columns
        </span>
      </div>
    </div>
  )
}
