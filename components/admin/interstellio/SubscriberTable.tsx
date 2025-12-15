'use client'

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
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SubscriberStatusBadge } from './SubscriberStatusBadge'
import { Search, MoreVertical, Eye, Unplug, ExternalLink, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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
        <div className="flex items-center gap-4">
          <div className="h-10 w-64 bg-gray-200 animate-pulse rounded" />
          <div className="h-10 w-24 bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="border rounded-lg">
          <div className="h-96 bg-gray-100 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search subscribers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sessions</TableHead>
              <TableHead>Speed Tier</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead>Linked Customer</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubscribers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  {search ? 'No subscribers match your search' : 'No subscribers found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscribers.map((subscriber) => (
                <TableRow key={subscriber.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{subscriber.username}</p>
                      {subscriber.name && (
                        <p className="text-sm text-gray-500">{subscriber.name}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <SubscriberStatusBadge status={subscriber.status} />
                  </TableCell>
                  <TableCell>
                    {subscriber.activeSessions > 0 ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {subscriber.activeSessions} active
                      </Badge>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{subscriber.profileName}</p>
                      <Badge variant="outline" className="mt-1">
                        {subscriber.uncappedData ? 'Uncapped' : 'Capped'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {subscriber.lastSeen ? (
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(subscriber.lastSeen), { addSuffix: true })}
                      </span>
                    ) : (
                      <span className="text-gray-400">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {subscriber.linkedCustomerId ? (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-blue-600"
                        onClick={() => router.push(`/admin/customers/${subscriber.linkedCustomerId}`)}
                      >
                        {subscriber.linkedCustomerName}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    ) : (
                      <span className="text-gray-400">Not linked</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onViewDetails?.(subscriber.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {subscriber.activeSessions > 0 && onDisconnectAll && (
                          <DropdownMenuItem
                            className="text-red-600"
                            disabled={disconnecting === subscriber.id}
                            onClick={() => handleDisconnectAll(subscriber.id)}
                          >
                            <Unplug className="h-4 w-4 mr-2" />
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

      <div className="text-sm text-gray-500 text-right">
        Showing {filteredSubscribers.length} of {subscribers.length} subscribers
      </div>
    </div>
  )
}
