'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { PiArrowLeftBold, PiPlusBold, PiMagnifyingGlassBold } from 'react-icons/pi'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import {
  decidePromote,
  quotesFromShopFields,
} from '@/lib/hardware-catalogue/promote-decision'
import type { PromoteSuggestionResult } from '@/lib/hardware-catalogue/promote-suggestion'

interface SupplierProduct {
  id: string
  sku: string
  name: string
  manufacturer: string | null
  category: string | null
  cost_price: number | null
  stock_total: number
  supplier: { code: string; name: string }
  suggestion?: PromoteSuggestionResult
}

export default function AdminPromotePage() {
  const { user } = useAdminAuth()
  const router = useRouter()
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>(
    []
  )
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [suggestedOnly, setSuggestedOnly] = useState(true)
  const [selected, setSelected] = useState<SupplierProduct | null>(null)
  const [promoting, setPromoting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    category: '',
    afrihost_url: '',
    afrihost_price: '',
    axxess_url: '',
    axxess_price: '',
    street_note: '',
    confirm_unbenchmarked: false,
    lead_time_min_days: 5,
    lead_time_max_days: 7,
  })

  useEffect(() => {
    loadSupplierProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedOnly])

  async function loadSupplierProducts(nextSearch = search) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (nextSearch.trim()) params.set('search', nextSearch.trim())
      else if (suggestedOnly) params.set('suggested', '1')
      const res = await fetch(`/api/hardware/supplier-products?${params}`)
      const data = await res.json()
      setSupplierProducts(data.data || [])
    } catch (err) {
      console.error('Failed to load supplier products:', err)
    } finally {
      setLoading(false)
    }
  }

  function selectProduct(sp: SupplierProduct) {
    setSelected(sp)
    const slug = sp.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    setForm((current) => ({
      ...current,
      name: sp.name,
      slug,
      category: sp.category?.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/i, '$1') || '',
      confirm_unbenchmarked: false,
    }))
  }

  const decision = useMemo(() => {
    if (!selected) return null
    return decidePromote({
      costExclVat: selected.cost_price || 0,
      quotes: quotesFromShopFields({
        afrihostUrl: form.afrihost_url,
        afrihostPrice: form.afrihost_price
          ? Number(form.afrihost_price)
          : undefined,
        axxessUrl: form.axxess_url,
        axxessPrice: form.axxess_price ? Number(form.axxess_price) : undefined,
      }),
      confirmUnbenchmarked: form.confirm_unbenchmarked,
      streetNote: form.street_note,
      leadTime: {
        min: form.lead_time_min_days,
        max: form.lead_time_max_days,
      },
    })
  }, [selected, form])

  async function handlePromote() {
    if (!selected || !decision?.allowed) return
    setPromoting(true)
    try {
      const res = await fetch('/api/hardware/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_product_id: selected.id,
          name: form.name,
          slug: form.slug,
          category: form.category,
          afrihost_url: form.afrihost_url || undefined,
          afrihost_price: form.afrihost_price
            ? Number(form.afrihost_price)
            : undefined,
          axxess_url: form.axxess_url || undefined,
          axxess_price: form.axxess_price
            ? Number(form.axxess_price)
            : undefined,
          street_note: form.street_note || undefined,
          confirm_unbenchmarked: form.confirm_unbenchmarked,
          lead_time_min_days: form.lead_time_min_days,
          lead_time_max_days: form.lead_time_max_days,
        }),
      })
      const data = await res.json()
      if (data.success) {
        router.push(`/admin/products/hardware/${data.hardware_product_id}`)
      } else {
        alert(`Failed: ${data.error}`)
      }
    } catch (err) {
      console.error('Promote failed:', err)
    } finally {
      setPromoting(false)
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-[#7C93AF]">Authenticating...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push('/admin/products/hardware')}
        className="flex items-center gap-2 text-sm font-semibold text-[#7C93AF] hover:text-[#1B2A4A]"
      >
        <PiArrowLeftBold className="h-4 w-4" />
        Back to Products
      </button>

      <h1 className="text-2xl font-bold text-[#1B2A4A]">
        Promote from Supplier
      </h1>

      <p className="text-sm text-[#7C93AF]">
        The system suggests first-wave SKUs. A person confirms each Promote and
        pastes Afrihost/Axxess shop URLs. Nothing is auto-listed.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={suggestedOnly ? 'default' : 'outline'}
          className={suggestedOnly ? 'bg-[#E87A1E] hover:bg-[#C45A30]' : ''}
          onClick={() => {
            setSuggestedOnly(true)
            setSearch('')
          }}
        >
          Suggested first-wave
        </Button>
        <Button
          variant={!suggestedOnly ? 'default' : 'outline'}
          className={!suggestedOnly ? 'bg-[#E87A1E] hover:bg-[#C45A30]' : ''}
          onClick={() => setSuggestedOnly(false)}
        >
          Search all
        </Button>
      </div>

      <div className="relative">
        <PiMagnifyingGlassBold className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C93AF]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') loadSupplierProducts(search)
          }}
          placeholder="Search by name, SKU, or manufacturer..."
          className="w-full rounded-lg border border-[#DDE7F3] py-2 pl-10 pr-4 text-sm focus:border-[#E87A1E] focus:outline-none focus:ring-1 focus:ring-[#E87A1E]"
        />
      </div>

      {loading ? (
        <p className="py-10 text-center text-[#7C93AF]">Loading...</p>
      ) : (
        <div className="grid gap-4">
          {supplierProducts.slice(0, 50).map((sp) => (
            <Card
              key={sp.id}
              className={`cursor-pointer transition ${
                selected?.id === sp.id
                  ? 'ring-2 ring-[#E87A1E]'
                  : 'hover:ring-1 hover:ring-[#DDE7F3]'
              }`}
              onClick={() => selectProduct(sp)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-[#1B2A4A]">
                      {sp.name}
                    </p>
                    {sp.suggestion?.suggested && (
                      <span className="rounded-full bg-[#FFF4E8] px-2 py-0.5 text-[11px] font-semibold text-[#E87A1E]">
                        Suggested
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#7C93AF]">
                    {sp.supplier.name} · SKU: {sp.sku}
                    {sp.manufacturer && ` · ${sp.manufacturer}`}
                    {sp.category &&
                      ` · ${sp.category.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/i, '$1')}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#1B2A4A]">
                    R
                    {(sp.cost_price || 0).toLocaleString('en-ZA', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-[#7C93AF]">
                    excl VAT
                    {sp.stock_total > 0
                      ? ` · ${sp.stock_total} in stock`
                      : ' · No stock'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selected && decision && (
        <Card className="sticky bottom-0 border-t-2 border-[#E87A1E]">
          <CardContent className="space-y-4 p-6">
            <h3 className="text-lg font-bold text-[#1B2A4A]">
              Promote: {selected.name}
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-[#7C93AF]">
                  Display Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#7C93AF]">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#7C93AF]">
                  Afrihost shop URL
                </label>
                <input
                  type="url"
                  value={form.afrihost_url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, afrihost_url: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#7C93AF]">
                  Afrihost shop price (incl VAT)
                </label>
                <input
                  type="number"
                  value={form.afrihost_price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, afrihost_price: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#7C93AF]">
                  Axxess shop URL
                </label>
                <input
                  type="url"
                  value={form.axxess_url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, axxess_url: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#7C93AF]">
                  Axxess shop price (incl VAT)
                </label>
                <input
                  type="number"
                  value={form.axxess_price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, axxess_price: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#7C93AF]">
                  List Price (incl VAT)
                </label>
                <input
                  type="text"
                  readOnly
                  value={
                    decision.listInclVat != null
                      ? `R${decision.listInclVat.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} · ${decision.status}`
                      : 'Blocked — below 25% floor'
                  }
                  className="mt-1 w-full rounded-lg border border-[#DDE7F3] bg-[#F7FAFC] px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#7C93AF]">
                  Lead time (business days)
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="number"
                    value={form.lead_time_min_days}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        lead_time_min_days: Number(e.target.value) || 5,
                      }))
                    }
                    className="w-full rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm"
                  />
                  <input
                    type="number"
                    value={form.lead_time_max_days}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        lead_time_max_days: Number(e.target.value) || 7,
                      }))
                    }
                    className="w-full rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {decision.status === 'unbenchmarked' && (
              <label className="flex items-start gap-2 text-sm text-[#1B2A4A]">
                <input
                  type="checkbox"
                  checked={form.confirm_unbenchmarked}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      confirm_unbenchmarked: e.target.checked,
                    }))
                  }
                  className="mt-1"
                />
                No Afrihost/Axxess shop hit. Confirm Promote at 35% target
                (unbenchmarked).
              </label>
            )}

            {decision.reason === 'below_floor' && (
              <p className="text-sm font-semibold text-red-600">
                {decision.error}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelected(null)}>
                Cancel
              </Button>
              <Button
                className="gap-2 bg-[#E87A1E] hover:bg-[#C45A30]"
                onClick={handlePromote}
                disabled={promoting || !form.slug || !decision.allowed}
              >
                <PiPlusBold className="h-4 w-4" />
                {promoting ? 'Promoting...' : 'Confirm Promote (draft)'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
