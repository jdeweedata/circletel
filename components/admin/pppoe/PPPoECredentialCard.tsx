'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Send,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'

interface PPPoECredential {
  id: string
  pppoeUsername: string
  provisioningStatus: 'pending' | 'provisioned' | 'failed' | 'deprovisioned'
  provisionedAt: string | null
  provisioningError: string | null
  interstellioSubscriberId: string | null
  credentialsSentAt: string | null
  credentialsSentVia: string[]
  createdAt: string
}

interface PPPoECredentialCardProps {
  credential: PPPoECredential
  onRefresh?: () => void
  onSendCredentials?: (methods: ('sms' | 'email')[]) => Promise<void>
  onProvision?: () => Promise<void>
  onRegenerate?: () => Promise<{ password?: string }>
  compact?: boolean
}

export function PPPoECredentialCard({
  credential,
  onRefresh,
  onSendCredentials,
  onProvision,
  onRegenerate,
  compact = false,
}: PPPoECredentialCardProps) {
  const [password, setPassword] = useState<string | null>(null)
  const [isRevealing, setIsRevealing] = useState(false)
  const [isProvisioning, setIsProvisioning] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [passwordTimer, setPasswordTimer] = useState<NodeJS.Timeout | null>(null)

  const handleRevealPassword = async () => {
    setIsRevealing(true)
    try {
      const response = await fetch(`/api/admin/pppoe/credentials/${credential.id}/reveal`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to reveal password')
      }

      const data = await response.json()
      setPassword(data.password)

      // Auto-hide after 30 seconds
      if (passwordTimer) clearTimeout(passwordTimer)
      const timer = setTimeout(() => {
        setPassword(null)
      }, 30000)
      setPasswordTimer(timer)

      toast.success('Password revealed (auto-hides in 30s)')
    } catch (error) {
      toast.error('Failed to reveal password')
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

  const handleProvision = async () => {
    if (!onProvision) return
    setIsProvisioning(true)
    try {
      await onProvision()
      toast.success('Provisioned to Interstellio')
      onRefresh?.()
    } catch {
      toast.error('Failed to provision')
    } finally {
      setIsProvisioning(false)
    }
  }

  const handleRegenerate = async () => {
    if (!onRegenerate) return
    if (!confirm('Are you sure you want to regenerate the password? The customer will need new credentials.')) {
      return
    }
    setIsRegenerating(true)
    try {
      const result = await onRegenerate()
      if (result.password) {
        setPassword(result.password)
        toast.success('Password regenerated')
        onRefresh?.()
      }
    } catch {
      toast.error('Failed to regenerate password')
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleSendCredentials = async (methods: ('sms' | 'email')[]) => {
    if (!onSendCredentials) return
    setIsSending(true)
    try {
      await onSendCredentials(methods)
      toast.success('Credentials sent')
      onRefresh?.()
    } catch {
      toast.error('Failed to send credentials')
    } finally {
      setIsSending(false)
    }
  }

  const getStatusBadge = () => {
    switch (credential.provisioningStatus) {
      case 'provisioned':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Provisioned
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      case 'deprovisioned':
        return (
          <Badge variant="outline">
            <WifiOff className="h-3 w-3 mr-1" />
            Deprovisioned
          </Badge>
        )
    }
  }

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <div className="flex items-center gap-3">
          <Wifi className="h-5 w-5 text-orange-500" />
          <div>
            <p className="font-mono text-sm">{credential.pppoeUsername}</p>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {credential.credentialsSentVia.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  Sent via: {credential.credentialsSentVia.join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy(credential.pppoeUsername, 'Username')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy username</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={password ? handleHidePassword : handleRevealPassword}
                  disabled={isRevealing}
                >
                  {password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{password ? 'Hide password' : 'Reveal password'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Wifi className="h-5 w-5 text-orange-500" />
          PPPoE Credentials
        </CardTitle>
        {getStatusBadge()}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Username */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Username</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono">
              {credential.pppoeUsername}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopy(credential.pppoeUsername, 'Username')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Password</label>
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
              {isRevealing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : password ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {password && (
            <p className="text-xs text-muted-foreground">
              Password will auto-hide in 30 seconds
            </p>
          )}
        </div>

        {/* Provisioning Error */}
        {credential.provisioningError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              {credential.provisioningError}
            </p>
          </div>
        )}

        {/* Notification Status */}
        {credential.credentialsSentVia.length > 0 && (
          <div className="text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 inline mr-2 text-green-500" />
            Sent via: {credential.credentialsSentVia.join(', ')}
            {credential.credentialsSentAt && (
              <> on {new Date(credential.credentialsSentAt).toLocaleDateString()}</>
            )}
          </div>
        )}

        {/* Interstellio Link */}
        {credential.interstellioSubscriberId && (
          <div className="text-sm text-muted-foreground">
            <ExternalLink className="h-4 w-4 inline mr-2" />
            Interstellio ID: <code>{credential.interstellioSubscriberId}</code>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          {credential.provisioningStatus !== 'provisioned' && (
            <Button
              variant="default"
              size="sm"
              onClick={handleProvision}
              disabled={isProvisioning}
            >
              {isProvisioning ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wifi className="h-4 w-4 mr-2" />
              )}
              Provision to Router
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={isRegenerating}
          >
            {isRegenerating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Regenerate Password
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSendCredentials(['sms', 'email'])}
            disabled={isSending}
          >
            {isSending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Credentials
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
