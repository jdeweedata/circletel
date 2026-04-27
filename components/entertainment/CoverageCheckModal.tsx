'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PiSpinnerBold, PiWarningBold, PiWhatsappLogoBold } from 'react-icons/pi'
import type { EntertainmentBundle } from '@/lib/data/entertainment-bundles'

interface CoverageCheckModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bundle: EntertainmentBundle
}

type ModalState = 'input' | 'checking' | 'not_covered'

export function CoverageCheckModal({ open, onOpenChange, bundle }: CoverageCheckModalProps) {
  const [address, setAddress] = useState('')
  const [state, setState] = useState<ModalState>('input')
  const [error, setError] = useState<string | null>(null)

  const handleCheck = async () => {
    if (!address.trim()) {
      setError('Please enter your address')
      return
    }
    setError(null)
    setState('checking')

    try {
      const res = await fetch('/api/coverage/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address.trim(),
          coverageType: 'residential',
        }),
      })

      if (!res.ok) {
        setState('input')
        setError('Coverage check failed — please try again.')
        return
      }

      const data = await res.json()

      if (data.leadId) {
        window.location.href = `/packages/${data.leadId}?type=residential&bundle=${bundle.id}`
      } else {
        setState('not_covered')
      }
    } catch {
      setState('input')
      setError('Coverage check failed — please try again.')
    }
  }

  const handleReset = () => {
    setAddress('')
    setState('input')
    setError(null)
  }

  const waMessage = encodeURIComponent(
    `Hi, I'm interested in the CircleTel Entertainment Bundle — ${bundle.device.name} + ${bundle.internet.name}`
  )

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) handleReset() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Check Your Coverage</DialogTitle>
          <DialogDescription asChild>
            <div className="mt-2">
              <div className="flex items-center gap-2 bg-navy-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
                <span className="font-medium">You're getting:</span>
                <span>{bundle.device.name}</span>
                <span className="text-gray-400">+</span>
                <Badge variant="secondary" className="text-xs">
                  {bundle.internet.speed_mbps}Mbps {bundle.internet.technology}
                </Badge>
                <span className="ml-auto font-bold text-[#F5831F]">
                  R{bundle.bundle_monthly_incl_vat.toLocaleString()}/mo
                </span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        {state === 'input' && (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Input
                placeholder="e.g. 15 Main Street, Sandton, Johannesburg"
                value={address}
                onChange={(e) => { setAddress(e.target.value); setError(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCheck() }}
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <PiWarningBold className="h-4 w-4" />
                  {error}
                </p>
              )}
            </div>
            <Button
              className="w-full bg-[#F5831F] hover:bg-orange-600 text-white"
              onClick={handleCheck}
              disabled={!address.trim()}
            >
              Check Coverage
            </Button>
          </div>
        )}

        {state === 'checking' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <PiSpinnerBold className="h-8 w-8 animate-spin text-[#F5831F]" />
            <p className="text-sm text-gray-600">Checking coverage at your address…</p>
          </div>
        )}

        {state === 'not_covered' && (
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <PiWarningBold className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 text-sm">We're not in your area yet</p>
                <p className="text-xs text-amber-700 mt-1">
                  We're expanding fast. Join the waitlist and we'll notify you when we arrive.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                className="w-full bg-[#25D366] hover:bg-green-600 text-white gap-2"
                asChild
              >
                <a
                  href={`https://wa.me/27824873900?text=${waMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <PiWhatsappLogoBold className="h-4 w-4" />
                  WhatsApp Us to Join Waitlist
                </a>
              </Button>
              <Button variant="outline" className="w-full" onClick={handleReset}>
                Try a Different Address
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
