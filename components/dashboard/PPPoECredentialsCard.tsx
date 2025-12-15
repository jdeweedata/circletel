'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Eye, EyeOff, Copy, Wifi, WifiOff, CheckCircle2, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'

interface PPPoECredential {
  id: string
  username: string
  password: string
  provisioningStatus: 'pending' | 'provisioned' | 'failed' | 'deprovisioned'
  createdAt: string
}

interface PPPoECredentialsCardProps {
  serviceId: string
}

export function PPPoECredentialsCard({ serviceId }: PPPoECredentialsCardProps) {
  const [credential, setCredential] = useState<PPPoECredential | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [password, setPassword] = useState<string | null>(null)
  const [isRevealing, setIsRevealing] = useState(false)
  const [remainingReveals, setRemainingReveals] = useState<number | null>(null)
  const [passwordTimer, setPasswordTimer] = useState<NodeJS.Timeout | null>(null)

  const fetchCredential = useCallback(async () => {
    try {
      const response = await fetch(`/api/customer/services/${serviceId}/pppoe`)
      if (!response.ok) {
        throw new Error('Failed to fetch credentials')
      }
      const data = await response.json()
      setCredential(data.credential)
    } catch (error) {
      console.error('Error fetching PPPoE credentials:', error)
      setCredential(null)
    } finally {
      setIsLoading(false)
    }
  }, [serviceId])

  useEffect(() => {
    fetchCredential()
  }, [fetchCredential])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (passwordTimer) {
        clearTimeout(passwordTimer)
      }
    }
  }, [passwordTimer])

  const handleRevealPassword = async () => {
    setIsRevealing(true)
    try {
      const response = await fetch(`/api/customer/services/${serviceId}/pppoe/reveal`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        if (response.status === 429) {
          toast.error(error.message || 'Rate limit exceeded. Please try again later.')
          return
        }
        throw new Error(error.error || 'Failed to reveal password')
      }

      const data = await response.json()
      setPassword(data.password)
      setRemainingReveals(data.remainingReveals)

      // Auto-hide after 30 seconds
      if (passwordTimer) clearTimeout(passwordTimer)
      const timer = setTimeout(() => {
        setPassword(null)
      }, 30000)
      setPasswordTimer(timer)

      toast.success('Password revealed (auto-hides in 30 seconds)')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reveal password')
    } finally {
      setIsRevealing(false)
    }
  }

  const handleHidePassword = () => {
    setPassword(null)
    if (passwordTimer) {
      clearTimeout(passwordTimer)
      setPasswordTimer(null)
    }
  }

  const handleCopy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wifi className="h-5 w-5 text-orange-500" />
            Connection Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!credential) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <WifiOff className="h-5 w-5 text-gray-400" />
            Connection Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your PPPoE credentials are being set up. Please check back later or contact support.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wifi className="h-5 w-5 text-orange-500" />
            Connection Details
          </CardTitle>
          {credential.provisioningStatus === 'provisioned' ? (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Active
            </Badge>
          ) : (
            <Badge variant="secondary">Setting Up</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Username */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">PPPoE Username</label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter this in your router&apos;s PPPoE settings</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono">
              {credential.username}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopy(credential.username, 'Username')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">PPPoE Password</label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Click the eye icon to reveal your password</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono">
              {password || '••••••••••••'}
            </code>
            {password && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(password, 'Password')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={password ? handleHidePassword : handleRevealPassword}
              disabled={isRevealing}
            >
              {password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {password && (
            <p className="text-xs text-muted-foreground">
              Password will auto-hide in 30 seconds
            </p>
          )}
          {remainingReveals !== null && remainingReveals < 3 && (
            <p className="text-xs text-amber-600">
              {remainingReveals} password reveals remaining this hour
            </p>
          )}
        </div>

        {/* Setup Instructions */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <h4 className="text-sm font-medium mb-2">Quick Setup</h4>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Log into your router&apos;s admin panel</li>
            <li>Go to WAN/Internet settings</li>
            <li>Select PPPoE as connection type</li>
            <li>Enter your username and password</li>
            <li>Save and restart your router</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
