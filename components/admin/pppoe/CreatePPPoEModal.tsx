'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Wifi, AlertCircle, CheckCircle2, Copy } from 'lucide-react'
import { toast } from 'sonner'

interface CreatePPPoEModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: string
  serviceId: string
  accountNumber: string
  customerName: string
  onSuccess?: () => void
}

export function CreatePPPoEModal({
  open,
  onOpenChange,
  customerId,
  serviceId,
  accountNumber,
  customerName,
  onSuccess,
}: CreatePPPoEModalProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [sendSms, setSendSms] = useState(true)
  const [sendEmail, setSendEmail] = useState(true)
  const [createdCredential, setCreatedCredential] = useState<{
    username: string
    password: string
  } | null>(null)

  const pppoeUsername = `${accountNumber}@circletel.co.za`

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/admin/pppoe/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          serviceId,
          accountNumber,
          sendNotifications: {
            sms: sendSms,
            email: sendEmail,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create credentials')
      }

      const data = await response.json()
      setCreatedCredential({
        username: data.credential.pppoeUsername,
        password: data.password,
      })

      toast.success('PPPoE credentials created successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create credentials')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const handleClose = () => {
    if (createdCredential) {
      onSuccess?.()
    }
    setCreatedCredential(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-orange-500" />
            {createdCredential ? 'PPPoE Credentials Created' : 'Create PPPoE Credentials'}
          </DialogTitle>
          <DialogDescription>
            {createdCredential
              ? 'The credentials have been generated. Please save them securely.'
              : `Create PPPoE credentials for ${customerName}`}
          </DialogDescription>
        </DialogHeader>

        {createdCredential ? (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-800">Credentials Generated</span>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-green-700">Username</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">
                      {createdCredential.username}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(createdCredential.username, 'Username')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-green-700">Password</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">
                      {createdCredential.password}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(createdCredential.password, 'Password')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Save these credentials now. The password cannot be recovered once this dialog is
                closed (only revealed with audit logging).
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>PPPoE Username (generated from account number)</Label>
              <code className="block bg-muted px-3 py-2 rounded text-sm font-mono">
                {pppoeUsername}
              </code>
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <p className="text-sm text-muted-foreground">
                A secure 12-character password will be automatically generated
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Label>Send Credentials Via</Label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="send-sms"
                    checked={sendSms}
                    onCheckedChange={(checked) => setSendSms(checked === true)}
                  />
                  <label
                    htmlFor="send-sms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    SMS to customer phone
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="send-email"
                    checked={sendEmail}
                    onCheckedChange={(checked) => setSendEmail(checked === true)}
                  />
                  <label
                    htmlFor="send-email"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Email to customer
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {createdCredential ? (
            <Button onClick={handleClose}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Wifi className="h-4 w-4 mr-2" />
                    Create Credentials
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
