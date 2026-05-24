'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  PiArrowLeftBold,
  PiFloppyDiskBold,
  PiClockCounterClockwiseBold,
} from 'react-icons/pi'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import type { HardwareProductTerms } from '@/lib/hardware-catalogue/types'
import type { TermsHistoryEntry } from '@/lib/hardware-catalogue/terms'

interface Props {
  params: Promise<{ id: string }>
}

export default function AdminTermsPage({ params }: Props) {
  const { user } = useAdminAuth()
  const router = useRouter()
  const [product, setProduct] = useState<{
    id: string
    name: string
    slug: string
  } | null>(null)
  const [terms, setTerms] = useState<HardwareProductTerms | null>(null)
  const [history, setHistory] = useState<TermsHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    warranty_period: '',
    return_policy: '',
    refund_policy: '',
    delivery_estimate: '',
    warranty_notes: '',
    is_back_to_back: true,
  })

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData() {
    const { id } = await params
    try {
      const [productRes, termsRes, historyRes] = await Promise.all([
        fetch(`/api/hardware/products/${id}`),
        fetch(`/api/hardware/products/${id}/terms`),
        fetch(`/api/hardware/products/${id}/terms/history`),
      ])

      const productData = await productRes.json()
      const termsData = await termsRes.json()
      const historyData = await historyRes.json()

      setProduct(productData)
      setTerms(termsData)
      setHistory(historyData.history || [])

      if (termsData) {
        setForm({
          warranty_period: termsData.warranty_period || '',
          return_policy: termsData.return_policy || '',
          refund_policy: termsData.refund_policy || '',
          delivery_estimate: termsData.delivery_estimate || '',
          warranty_notes: termsData.warranty_notes || '',
          is_back_to_back: termsData.is_back_to_back ?? true,
        })
      }
    } catch (err) {
      console.error('Failed to load terms data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { id } = await params
      const res = await fetch(`/api/hardware/products/${id}/terms`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        loadData()
      } else {
        const err = await res.json()
        alert(`Failed to save: ${err.error}`)
      }
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-[#7C93AF]">Authenticating...</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-[#7C93AF]">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() =>
              router.push(
                `/admin/products/hardware/${params.then((p) => p.id)}`
              )
            }
            className="flex items-center gap-2 text-sm font-semibold text-[#7C93AF] hover:text-[#1B2A4A]"
          >
            <PiArrowLeftBold className="h-4 w-4" />
            Back to Product
          </button>
          <h1 className="mt-2 text-2xl font-bold text-[#1B2A4A]">
            Terms & Conditions
          </h1>
          {product && (
            <p className="mt-1 text-sm text-[#7C93AF]">
              {product.name}
            </p>
          )}
        </div>
        <Button
          className="gap-2 bg-[#E87A1E] hover:bg-[#C45A30]"
          onClick={handleSave}
          disabled={saving}
        >
          <PiFloppyDiskBold className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Terms'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Terms form */}
        <Card>
          <CardContent className="space-y-6 p-6">
            {/* Back-to-back toggle */}
            <div className="flex items-center gap-3 rounded-lg bg-[#FDF2E9] p-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_back_to_back}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      is_back_to_back: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <span className="text-sm font-bold text-[#AE5B16]">
                  Back-to-Back with Supplier Terms
                </span>
              </label>
              <span className="text-xs text-[#AE5B16]/70">
                When enabled, terms automatically mirror supplier
                warranty/return policies.
              </span>
            </div>

            {/* Warranty */}
            <div>
              <label className="block text-sm font-bold text-[#1B2A4A]">
                Warranty Period
              </label>
              <input
                type="text"
                value={form.warranty_period}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    warranty_period: e.target.value,
                  }))
                }
                placeholder="e.g., 12 months manufacturer warranty"
                className="mt-1 w-full rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm focus:border-[#E87A1E] focus:outline-none focus:ring-1 focus:ring-[#E87A1E]"
              />
              {terms?.source_supplier_warranty_months && (
                <p className="mt-1 text-xs text-[#7C93AF]">
                  Source: {terms.source_supplier_warranty_months} months
                  from {terms.source_supplier_code}
                </p>
              )}
            </div>

            {/* Return Policy */}
            <div>
              <label className="block text-sm font-bold text-[#1B2A4A]">
                Return Policy
              </label>
              <textarea
                value={form.return_policy}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    return_policy: e.target.value,
                  }))
                }
                rows={3}
                placeholder="e.g., 7-day return for defects with RMA"
                className="mt-1 w-full rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm focus:border-[#E87A1E] focus:outline-none focus:ring-1 focus:ring-[#E87A1E]"
              />
            </div>

            {/* Refund Policy */}
            <div>
              <label className="block text-sm font-bold text-[#1B2A4A]">
                Refund Policy
              </label>
              <textarea
                value={form.refund_policy}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    refund_policy: e.target.value,
                  }))
                }
                rows={2}
                placeholder="e.g., Refund within 7 days if unopened"
                className="mt-1 w-full rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm focus:border-[#E87A1E] focus:outline-none focus:ring-1 focus:ring-[#E87A1E]"
              />
            </div>

            {/* Delivery Estimate */}
            <div>
              <label className="block text-sm font-bold text-[#1B2A4A]">
                Delivery Estimate
              </label>
              <input
                type="text"
                value={form.delivery_estimate}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    delivery_estimate: e.target.value,
                  }))
                }
                placeholder="e.g., 3-5 business days nationwide"
                className="mt-1 w-full rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm focus:border-[#E87A1E] focus:outline-none focus:ring-1 focus:ring-[#E87A1E]"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-bold text-[#1B2A4A]">
                Additional Notes
              </label>
              <textarea
                value={form.warranty_notes}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    warranty_notes: e.target.value,
                  }))
                }
                rows={2}
                placeholder="Any additional warranty or T&C notes"
                className="mt-1 w-full rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm focus:border-[#E87A1E] focus:outline-none focus:ring-1 focus:ring-[#E87A1E]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Version history sidebar */}
        <Card>
          <CardContent className="space-y-4 p-6">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[#1B2A4A]">
              <PiClockCounterClockwiseBold className="h-4 w-4" />
              Version History
            </h3>
            {history.length === 0 ? (
              <p className="text-xs text-[#7C93AF]">
                No changes yet. Terms history will appear here after
                updates.
              </p>
            ) : (
              <div className="space-y-3">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-[#DDE7F3] p-3"
                  >
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className="text-xs"
                      >
                        v{entry.version}
                      </Badge>
                      <span className="text-xs text-[#7C93AF]">
                        {new Date(
                          entry.created_at
                        ).toLocaleDateString('en-ZA')}
                      </span>
                    </div>
                    {entry.change_description && (
                      <p className="mt-2 text-xs font-semibold text-[#31527B]">
                        {entry.change_description}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-[#7C93AF]">
                      By: {entry.changed_by}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
