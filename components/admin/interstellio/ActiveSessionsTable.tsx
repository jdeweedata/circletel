'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Unplug, Clock, Wifi, Server, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

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

interface ActiveSessionsTableProps {
  sessions: Session[]
  isLoading?: boolean
  onRefresh?: () => void
  onDisconnect?: (sessionId: string) => Promise<void>
}

export function ActiveSessionsTable({
  sessions,
  isLoading = false,
  onRefresh,
  onDisconnect,
}: ActiveSessionsTableProps) {
  const [disconnectingSession, setDisconnectingSession] = useState<Session | null>(null)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const handleDisconnect = async () => {
    if (!disconnectingSession || !onDisconnect) return

    setIsDisconnecting(true)
    try {
      await onDisconnect(disconnectingSession.id)
      toast.success('Session disconnected successfully')
    } catch (error) {
      toast.error('Failed to disconnect session')
      console.error('Disconnect error:', error)
    } finally {
      setIsDisconnecting(false)
      setDisconnectingSession(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-40 bg-gray-200 animate-pulse rounded" />
          <div className="h-10 w-24 bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="border rounded-lg">
          <div className="h-64 bg-gray-100 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-green-500" />
            <span className="font-medium">{sessions.length} Active Sessions</span>
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
                <TableHead>IP Address</TableHead>
                <TableHead>MAC Address</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>NAS</TableHead>
                <TableHead>Started</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <Wifi className="h-8 w-8 text-gray-300" />
                      <p>No active sessions</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{session.username}</p>
                        {session.realm && (
                          <p className="text-xs text-gray-500">@{session.realm}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {session.framedIpAddress ? (
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {session.framedIpAddress}
                        </code>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {session.callingStationId ? (
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {session.callingStationId}
                        </code>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        <Clock className="h-3 w-3 mr-1" />
                        {session.duration.formatted}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Server className="h-3 w-3 text-gray-400" />
                        <span>{session.nasIpAddress}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(session.startTime), { addSuffix: true })}
                      </span>
                    </TableCell>
                    <TableCell>
                      {onDisconnect && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDisconnectingSession(session)}
                        >
                          <Unplug className="h-4 w-4 mr-1" />
                          Disconnect
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={!!disconnectingSession} onOpenChange={() => setDisconnectingSession(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Session?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect this session?
              {disconnectingSession && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-1 text-sm">
                  <p><strong>Username:</strong> {disconnectingSession.username}</p>
                  {disconnectingSession.framedIpAddress && (
                    <p><strong>IP Address:</strong> {disconnectingSession.framedIpAddress}</p>
                  )}
                  {disconnectingSession.callingStationId && (
                    <p><strong>MAC Address:</strong> {disconnectingSession.callingStationId}</p>
                  )}
                  <p><strong>Duration:</strong> {disconnectingSession.duration.formatted}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDisconnecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
