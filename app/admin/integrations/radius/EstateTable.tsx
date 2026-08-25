'use client'

import { estateKind } from '@/lib/radius/estate-kind'

export interface EstateRow {
  id: string
  name: string
  siteCode: string | null
  status: string | null
  radiusProvider: 'interstellio' | 'radius'
  nasType: string | null
  tunnelType: string | null
  overlayIp: string | null
  isSite?: boolean
  openSessions: number
  lastAcceptAt: string | null
}

export function EstateTable({
  rows,
  onSelectSite,
}: {
  rows: EstateRow[]
  onSelectSite: (siteId: string) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-200">
            <th className="py-2 pr-4 font-medium">Name</th>
            <th className="py-2 pr-4 font-medium">Kind</th>
            <th className="py-2 pr-4 font-medium">Provider</th>
            <th className="py-2 pr-4 font-medium">NAS</th>
            <th className="py-2 pr-4 font-medium">Tunnel</th>
            <th className="py-2 pr-4 font-medium">Overlay</th>
            <th className="py-2 pr-4 font-medium">Sessions</th>
            <th className="py-2 pr-4 font-medium">Last accept</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="py-3 text-slate-500" colSpan={8}>
                No corporate sites found.
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const kind = estateKind(row)
              return (
                <tr
                  key={row.id}
                  data-site-id={row.id}
                  data-estate-kind={kind}
                  className="border-b border-slate-100"
                >
                  <td className="py-2 pr-4">
                    <button
                      type="button"
                      className="text-left text-primary hover:underline"
                      onClick={() => onSelectSite(row.id)}
                    >
                      {row.name}
                    </button>
                    <div className="text-xs text-slate-400">{row.siteCode ?? 'no site code'}</div>
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={
                        kind === 'site'
                          ? 'inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800'
                          : 'inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800'
                      }
                    >
                      {kind === 'site' ? 'Site' : 'Candidate'}
                    </span>
                  </td>
                  <td className="py-2 pr-4">{row.radiusProvider}</td>
                  <td className="py-2 pr-4">{row.nasType ?? '—'}</td>
                  <td className="py-2 pr-4">{row.tunnelType ?? '—'}</td>
                  <td className="py-2 pr-4">{row.overlayIp ?? '—'}</td>
                  <td className="py-2 pr-4">{row.openSessions}</td>
                  <td className="py-2 pr-4">{row.lastAcceptAt ?? '—'}</td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
