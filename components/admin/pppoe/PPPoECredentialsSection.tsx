'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PPPoECredentialCard } from './PPPoECredentialCard'
import { CreatePPPoEModal } from './CreatePPPoEModal'
import { Wifi, Plus, RefreshCw } from 'lucide-react'
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

interface Service {
  id: string
  packageName: string
  status: string
}

interface PPPoECredentialsSectionProps {
  customerId: string
  serviceId?: string
  accountNumber: string
  customerName: string
  service?: Service
}

export function PPPoECredentialsSection({
  customerId,
  serviceId,
  accountNumber,
  customerName,
  service,
}: PPPoECredentialsSectionProps) {
  const [credentials, setCredentials] = useState<PPPoECredential[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchCredentials = useCallback(async () => {
    if (!serviceId) {
      setCredentials([])
      setIsLoading(false)
      return
    }

    try {
      // Fetch credentials for this specific service
      const response = await fetch(
        `/api/admin/pppoe/credentials?search=${encodeURIComponent(accountNumber)}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch credentials')
      }

      const data = await response.json()
      // Filter to only this service's credentials
      const serviceCredentials = data.credentials.filter(
        (c: PPPoECredential & { serviceId?: string }) => c.serviceId === serviceId
      )
      setCredentials(serviceCredentials)
    } catch (error) {
      console.error('Error fetching credentials:', error)
      setCredentials([])
    } finally {
      setIsLoading(false)
    }
  }, [serviceId, accountNumber])

  useEffect(() => {
    fetchCredentials()
  }, [fetchCredentials])

  const handleSendCredentials = async (
    credentialId: string,
    methods: ('sms' | 'email')[]
  ): Promise<void> => {
    const response = await fetch(`/api/admin/pppoe/credentials/${credentialId}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ methods }),
    })

    if (!response.ok) {
      throw new Error('Failed to send credentials')
    }
  }

  const handleProvision = async (credentialId: string): Promise<void> => {
    if (!serviceId) return

    const response = await fetch(`/api/admin/pppoe/provision/${serviceId}`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Failed to provision')
    }
  }

  const handleRegenerate = async (credentialId: string): Promise<{ password?: string }> => {
    const response = await fetch(`/api/admin/pppoe/credentials/${credentialId}/regenerate`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Failed to regenerate')
    }

    const data = await response.json()
    return { password: data.password }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-orange-500" />
            PPPoE Credentials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  // No service selected or no service ID
  if (!serviceId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-orange-500" />
            PPPoE Credentials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select a service to manage PPPoE credentials.
          </p>
        </CardContent>
      </Card>
    )
  }

  // No credentials exist yet
  if (credentials.length === 0) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-orange-500" />
              PPPoE Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              No PPPoE credentials have been created for this service yet.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create PPPoE Account
            </Button>
          </CardContent>
        </Card>

        <CreatePPPoEModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          customerId={customerId}
          serviceId={serviceId}
          accountNumber={accountNumber}
          customerName={customerName}
          onSuccess={fetchCredentials}
        />
      </>
    )
  }

  // Show credentials
  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Wifi className="h-5 w-5 text-orange-500" />
            PPPoE Credentials
          </h3>
          <Button variant="outline" size="sm" onClick={fetchCredentials}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {credentials.map((credential) => (
          <PPPoECredentialCard
            key={credential.id}
            credential={credential}
            onRefresh={fetchCredentials}
            onSendCredentials={(methods) => handleSendCredentials(credential.id, methods)}
            onProvision={() => handleProvision(credential.id)}
            onRegenerate={() => handleRegenerate(credential.id)}
          />
        ))}
      </div>

      <CreatePPPoEModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        customerId={customerId}
        serviceId={serviceId}
        accountNumber={accountNumber}
        customerName={customerName}
        onSuccess={fetchCredentials}
      />
    </>
  )
}
