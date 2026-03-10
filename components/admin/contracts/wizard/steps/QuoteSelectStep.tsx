'use client'

import { useEffect, useState } from 'react'
import { PiMagnifyingGlassBold } from 'react-icons/pi'
import { useWizardContext } from '../ContractWizardProvider'
import { formatCurrency } from '@/lib/utils/format'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Quote {
  id: string
  quote_number: string
  company_name: string
  contact_name: string
  contact_email: string
  contact_phone: string
  installation_address: string
  package_name: string
  monthly_total: number
  status: string
  created_at: string
}

// ---------------------------------------------------------------------------
// Status badge helper
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1)

  const colourMap: Record<string, string> = {
    accepted: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    sent: 'bg-blue-100 text-blue-700',
    draft: 'bg-gray-100 text-gray-600',
    expired: 'bg-red-100 text-red-600',
  }

  const colour = colourMap[status] ?? 'bg-gray-100 text-gray-600'

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colour}`}>
      {label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuoteSelectStep() {
  const { state, updateState, prefillFromQuote, nextStep } = useWizardContext()

  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // -------------------------------------------------------------------------
  // Fetch quotes
  // -------------------------------------------------------------------------

  async function fetchQuotes() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/quotes/business/list?status=accepted&limit=50')
      if (!res.ok) {
        throw new Error(`Failed to load quotes (${res.status})`)
      }
      const data = await res.json()
      // API may return { quotes: [...] } or a plain array
      const list: Quote[] = Array.isArray(data) ? data : (data.quotes ?? [])
      setQuotes(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quotes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuotes()
  }, [])

  // -------------------------------------------------------------------------
  // Filtered list
  // -------------------------------------------------------------------------

  const term = search.toLowerCase().trim()

  const filtered = term
    ? quotes.filter(
        (q) =>
          q.quote_number.toLowerCase().includes(term) ||
          q.company_name.toLowerCase().includes(term) ||
          q.contact_name.toLowerCase().includes(term)
      )
    : quotes

  // -------------------------------------------------------------------------
  // Select handler
  // -------------------------------------------------------------------------

  function handleSelect(quote: Quote) {
    updateState('selectedQuoteId', quote.id)
    prefillFromQuote(quote as unknown as Record<string, unknown>)
    nextStep()
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Select a Quote</h2>
        <p className="mt-2 text-sm text-gray-500">
          Choose an accepted quote to convert into a contract.
        </p>
      </div>

      {/* Search */}
      {!loading && !error && (
        <div className="relative mb-4">
          <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by quote number, company or contact…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="text-center py-12">
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <Button variant="outline" onClick={fetchQuotes}>
            Try again
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <p className="text-center text-sm text-gray-500 py-12">
          {search ? 'No quotes match your search.' : 'No accepted quotes found.'}
        </p>
      )}

      {/* Quote list */}
      {!loading && !error && filtered.length > 0 && (
        <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1">
          {filtered.map((quote) => {
            const isSelected = state.selectedQuoteId === quote.id

            return (
              <button
                key={quote.id}
                type="button"
                onClick={() => handleSelect(quote)}
                className={[
                  'w-full text-left p-4 rounded-lg border-2 transition-colors duration-150',
                  isSelected
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300 bg-white',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">
                        {quote.quote_number}
                      </span>
                      <StatusBadge status={quote.status} />
                    </div>
                    <p className="mt-1 text-sm font-medium text-gray-800 truncate">
                      {quote.company_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {quote.contact_name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 truncate">
                      {quote.package_name}
                    </p>
                  </div>

                  {/* Right: monthly total */}
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(quote.monthly_total)}
                    </p>
                    <p className="text-xs text-gray-400">/month</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
