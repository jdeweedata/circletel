'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PiArrowLeftBold, PiPlusBold, PiMagnifyingGlassBold } from 'react-icons/pi'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import type { HardwareProductDetail } from '@/lib/hardware-catalogue/types'

interface SupplierProduct {
  id: string
  sku: string
  name: string
  manufacturer: string | null
  cost_price: number | null
  stock_total: number
  supplier: { code: string; name: string }
}

export default function AdminPromotePage() {
  const { user } = useAdminAuth()
  const router = useRouter()
  const [supplierProducts, setSupplierProducts] = useState<
    SupplierProduct[]
  >([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<SupplierProduct | null>(null)
  const [promoting, setPromoting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    retail_price: 0,
    category: '',
    default_markup_percent: 25,
  })

  useEffect(() => {
    loadSupplierProducts()
  }, [])

  async function loadSupplierProducts() {
    try {
      const res = await fetch(
        '/api/hardware/supplier-products?limit=200'
      )
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
    const retailPrice =
      Math.round(
        (sp.cost_price || 0) *
          (1 + form.default_markup_percent / 100)
      ) || 0
    setForm({
      name: sp.name,
      slug,
      retail_price: retailPrice,
      category: '',
      default_markup_percent: 25,
    })
  }

  async function handlePromote() {
    if (!selected) return
    setPromoting(true)
    try {
      const res = await fetch('/api/hardware/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_product_id: selected.id,
          ...form,
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

  const filtered = supplierProducts.filter(
    (sp) =>
      !search ||
      sp.name.toLowerCase().includes(search.toLowerCase()) ||
      sp.sku.toLowerCase().includes(search.toLowerCase()) ||
      (sp.manufacturer || '')
        .toLowerCase()
        .includes(search.toLowerCase())
  )

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
        Select a product from your supplier feeds to add to the CircleTel
        hardware catalogue.
      </p>

      {/* Search */}
      <div className="relative">
        <PiMagnifyingGlassBold className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C93AF]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, SKU, or manufacturer..."
          className="w-full rounded-lg border border-[#DDE7F3] py-2 pl-10 pr-4 text-sm focus:border-[#E87A1E] focus:outline-none focus:ring-1 focus:ring-[#E87A1E]"
        />
      </div>

      {/* Supplier product list */}
      {loading ? (
        <p className="py-10 text-center text-[#7C93AF]">Loading...</p>
      ) : (
        <div className="grid gap-4">
          {filtered.slice(0, 50).map((sp) => (
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
                  <p className="text-sm font-bold text-[#1B2A4A]">
                    {sp.name}
                  </p>
                  <p className="text-xs text-[#7C93AF]">
                    {sp.supplier.name} · SKU: {sp.sku}
                    {sp.manufacturer && ` · ${sp.manufacturer}`}
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

      {/* Promotion form */}
      {selected && (
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
                  Retail Price (incl VAT)
                </label>
                <input
                  type="number"
                  value={form.retail_price}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      retail_price: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#7C93AF]">
                  Category
                </label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                  placeholder="e.g., Networking"
                  className="mt-1 w-full rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setSelected(null)}
              >
                Cancel
              </Button>
              <Button
                className="gap-2 bg-[#E87A1E] hover:bg-[#C45A30]"
                onClick={handlePromote}
                disabled={promoting || !form.slug}
              >
                <PiPlusBold className="h-4 w-4" />
                {promoting ? 'Promoting...' : 'Promote to Catalogue'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
