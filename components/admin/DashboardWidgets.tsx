'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  PiArrowRightBold,
  PiCheckCircleBold,
  PiWarningCircleBold,
  PiClockBold,
  PiTrendUpBold,
  PiTrendDownBold,
} from 'react-icons/pi'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SyncSummary {
  recent_syncs: Array<{
    id: string
    supplier_code: string
    supplier_name: string
    status: string
    products_created: number
    products_updated: number
    products_deactivated: number
    error_message: string | null
    duration_ms: number
    started_at: string
  }>
  cost_alerts: Array<{
    hardware_product_id: string
    product_name: string
    product_slug: string
    old_cost: number
    new_cost: number
    change_percent: number
    updated_at: string
  }>
  supplier_status: Array<{
    code: string
    name: string
    status: string
    last_synced: string | null
    is_stale: boolean
  }>
  summary: {
    total_syncs: number
    failed_syncs: number
    products_created: number
    products_updated: number
    cost_alerts_count: number
    stale_suppliers: number
  }
}

export function DashboardWidgets() {
  const [data, setData] = useState<SyncSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/sync-summary?days=7')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-16 animate-pulse rounded bg-gray-100" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const { summary, supplier_status: supplierStatus } = data

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase text-[#7C93AF]">
              Syncs (7 days)
            </p>
            <p className="mt-1 text-2xl font-bold text-[#1B2A4A]">
              {summary.total_syncs}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase text-[#7C93AF]">
              Products Synced
            </p>
            <p className="mt-1 text-2xl font-bold text-green-700">
              +{summary.products_created}
            </p>
            <p className="text-xs text-[#7C93AF]">
              {summary.products_updated} updated
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase text-[#7C93AF]">
              Cost Alerts
            </p>
            <p
              className={`mt-1 text-2xl font-bold ${
                summary.cost_alerts_count > 0
                  ? 'text-amber-600'
                  : 'text-green-700'
              }`}
            >
              {summary.cost_alerts_count}
            </p>
            <p className="text-xs text-[#7C93AF]">
              Price changes &gt;5%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase text-[#7C93AF]">
              Sync Health
            </p>
            <p
              className={`mt-1 text-2xl font-bold ${
                summary.failed_syncs > 0 ||
                summary.stale_suppliers > 0
                  ? 'text-red-600'
                  : 'text-green-700'
              }`}
            >
              {summary.failed_syncs > 0 ||
              summary.stale_suppliers > 0
                ? '⚠️'
                : '✓'}
            </p>
            <p className="text-xs text-[#7C93AF]">
              {summary.failed_syncs} failed ·{' '}
              {summary.stale_suppliers} stale
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Supplier Status */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1B2A4A]">
                Supplier Status
              </h3>
              <Link
                href="/admin/suppliers"
                className="text-xs font-semibold text-[#E87A1E] hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {supplierStatus.map((s) => (
                <div
                  key={s.code}
                  className="flex items-center justify-between rounded-lg border border-[#DDE7F3] p-3"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        s.status === 'success'
                          ? 'bg-green-500'
                          : s.status === 'failed'
                            ? 'bg-red-500'
                            : 'bg-gray-300'
                      }`}
                    />
                    <span className="text-sm font-semibold text-[#31527B]">
                      {s.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.is_stale && (
                      <span className="text-xs text-amber-600">
                        ⚠ Stale
                      </span>
                    )}
                    <span className="text-xs text-[#7C93AF]">
                      {s.last_synced
                        ? new Date(
                            s.last_synced
                          ).toLocaleDateString('en-ZA')
                        : 'Never'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cost Alerts */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1B2A4A]">
                Cost Change Alerts
              </h3>
              <Link
                href="/admin/products/hardware"
                className="text-xs font-semibold text-[#E87A1E] hover:underline"
              >
                View products
              </Link>
            </div>
            {data.cost_alerts.length === 0 ? (
              <p className="py-4 text-center text-xs text-[#7C93AF]">
                No significant cost changes this week.
              </p>
            ) : (
              <div className="space-y-2">
                {data.cost_alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.hardware_product_id}
                    className="flex items-center justify-between rounded-lg border border-[#DDE7F3] p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#31527B]">
                        {alert.product_name}
                      </p>
                      <p className="text-xs text-[#7C93AF]">
                        R{alert.old_cost.toLocaleString()} → R
                        {alert.new_cost.toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      className={
                        alert.change_percent > 0
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }
                    >
                      {alert.change_percent > 0 ? (
                        <PiTrendUpBold className="mr-1 h-3 w-3" />
                      ) : (
                        <PiTrendDownBold className="mr-1 h-3 w-3" />
                      )}
                      {Math.abs(alert.change_percent)}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sync Logs */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1B2A4A]">
              Recent Sync Activity
            </h3>
          </div>
          {data.recent_syncs.length === 0 ? (
            <p className="py-4 text-center text-xs text-[#7C93AF]">
              No sync activity in the last 7 days.
            </p>
          ) : (
            <div className="space-y-1">
              {data.recent_syncs.slice(0, 5).map((sync) => (
                <div
                  key={sync.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[#F9FAFB]"
                >
                  <div className="flex items-center gap-3">
                    {sync.status === 'completed' ? (
                      <PiCheckCircleBold className="h-4 w-4 text-green-600" />
                    ) : sync.status === 'failed' ? (
                      <PiWarningCircleBold className="h-4 w-4 text-red-600" />
                    ) : (
                      <PiClockBold className="h-4 w-4 text-gray-400" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-[#31527B]">
                        {sync.supplier_name}
                      </p>
                      <p className="text-xs text-[#7C93AF]">
                        {sync.status === 'completed'
                          ? `+${sync.products_created} created, ${sync.products_updated} updated`
                          : sync.error_message || sync.status}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-[#7C93AF]">
                    {new Date(
                      sync.started_at
                    ).toLocaleString('en-ZA')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
