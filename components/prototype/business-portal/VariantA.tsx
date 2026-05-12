'use client';

import { BusinessPortalData, formatZAR, formatDate, timeAgo } from './mock-data';

const BRAND = {
  orange: '#E87A1E',
  navy: '#1B2A4A',
};

export function VariantA({ data }: { data: BusinessPortalData }) {
  const statusColors = {
    active: { bg: 'bg-green-100', text: 'text-green-900', dot: 'bg-green-500' },
    provisioning: { bg: 'bg-blue-100', text: 'text-blue-900', dot: 'bg-blue-500' },
    degraded: { bg: 'bg-yellow-100', text: 'text-yellow-900', dot: 'bg-yellow-500' },
    down: { bg: 'bg-red-100', text: 'text-red-900', dot: 'bg-red-500' },
  };

  const priorityColors = {
    critical: 'bg-red-500 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-500 text-white',
    low: 'bg-gray-400 text-white',
  };

  return (
    <div className="min-h-screen bg-gray-900" style={{ '--orange': BRAND.orange, '--navy': BRAND.navy } as any}>
      {/* Top Bar */}
      <div className="border-b border-gray-700 bg-gray-800 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {data.company.name}
                </h1>
                <p className="text-sm text-gray-400">{data.company.accountNumber}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            {/* Account Tier Badge */}
            <div className="text-right">
              <div
                className="inline-block rounded-full px-3 py-1 text-sm font-semibold text-white"
                style={{ backgroundColor: BRAND.orange }}
              >
                {data.company.tier.toUpperCase()} TIER
              </div>
              <p className="mt-2 text-xs text-gray-400">Account Manager: {data.company.accountManager}</p>
            </div>

            {/* SLA Gauge */}
            <div className="flex flex-col items-center">
              <SLACircleGauge uptime={data.company.slaUptime} />
              <p className="mt-2 text-xs font-semibold text-gray-300">SLA Target</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Service Health Grid */}
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Service Health
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.services.map((service) => {
                const color = statusColors[service.status as keyof typeof statusColors];
                const isPulsing = service.status === 'degraded' || service.status === 'down';

                return (
                  <div
                    key={service.id}
                    className={`relative rounded-lg border border-gray-700 bg-gray-800 p-4 transition-all ${isPulsing ? 'animate-pulse' : ''}`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${color.dot}`}></div>
                        <div>
                          <p className="font-semibold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                            {service.name}
                          </p>
                          <p className="text-xs text-gray-400">{service.site}</p>
                        </div>
                      </div>
                      <span className={`rounded px-2 py-1 text-xs font-semibold uppercase ${color.bg} ${color.text}`}>
                        {service.status}
                      </span>
                    </div>

                    <div className="mb-3 space-y-2 border-t border-gray-700 pt-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Speed</span>
                        <span className="font-mono text-white">{service.speed}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Monthly</span>
                        <span className="font-semibold text-white">{formatZAR(service.monthlyPrice)}</span>
                      </div>
                    </div>

                    {/* Uptime Bar */}
                    <div className="border-t border-gray-700 pt-3">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-gray-400">30-day uptime</span>
                        <span className="font-semibold" style={{ color: BRAND.orange }}>
                          {service.uptime30d}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${service.uptime30d}%`,
                            backgroundColor: service.uptime30d >= 99.5 ? '#10b981' : service.uptime30d >= 98 ? '#f59e0b' : '#ef4444',
                          }}
                        ></div>
                      </div>
                      {service.lastIncident && (
                        <p className="mt-2 text-xs text-gray-500">Last incident: {formatDate(service.lastIncident)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Split Bottom Section */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Alerts & Incidents (Left: 2 cols) */}
            <div className="lg:col-span-2">
              <h2 className="mb-4 text-xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Alerts & Incidents
              </h2>
              <div className="space-y-3 rounded-lg border border-gray-700 bg-gray-800 p-4">
                {data.tickets.length > 0 ? (
                  data.tickets
                    .sort((a, b) => {
                      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                      return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
                    })
                    .map((ticket) => (
                      <div key={ticket.id} className="flex items-start gap-3 border-b border-gray-700 pb-3 last:border-0 last:pb-0">
                        <div className={`mt-1 h-3 w-3 flex-shrink-0 rounded-full ${priorityColors[ticket.priority as keyof typeof priorityColors].split(' ')[0]}`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">{ticket.subject}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${priorityColors[ticket.priority as keyof typeof priorityColors]}`}>
                              {ticket.priority.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-400">{ticket.assignee}</span>
                            <span className="text-xs text-gray-500">• {timeAgo(ticket.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-gray-400">No open tickets</p>
                )}
              </div>
            </div>

            {/* Financial Summary (Right: 1 col) */}
            <div>
              <h2 className="mb-4 text-xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Financial Summary
              </h2>
              <div className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4">
                {/* Current Invoice Status */}
                <div className="border-b border-gray-700 pb-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Current Invoice</p>
                  {data.invoices[0] && (
                    <>
                      <p className="text-lg font-bold text-white">{formatZAR(data.invoices[0].amount)}</p>
                      <p className={`text-xs font-semibold uppercase ${data.invoices[0].status === 'pending' ? 'text-yellow-500' : data.invoices[0].status === 'overdue' ? 'text-red-500' : 'text-green-500'}`}>
                        {data.invoices[0].status}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">Due: {formatDate(data.invoices[0].dueDate)}</p>
                    </>
                  )}
                </div>

                {/* Monthly Spend Trend */}
                <div className="border-b border-gray-700 pb-4">
                  <p className="mb-3 text-xs font-semibold uppercase text-gray-400">4-Month Trend</p>
                  <div className="flex items-end gap-2">
                    {data.invoices.slice(0, 4).reverse().map((invoice, idx) => {
                      const maxAmount = Math.max(...data.invoices.slice(0, 4).map((i) => i.amount));
                      const barHeight = (invoice.amount / maxAmount) * 100;

                      return (
                        <div key={invoice.id} className="flex flex-1 flex-col items-center">
                          <div
                            className="w-full rounded-t transition-all"
                            style={{
                              height: `${Math.max(barHeight, 10)}px`,
                              backgroundColor: BRAND.orange,
                            }}
                          ></div>
                          <p className="mt-1 text-xs text-gray-500">{formatDate(invoice.date).split(' ')[0]}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Next Payment */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Next Payment Due</p>
                  {data.invoices[0] && (
                    <>
                      <p className="text-sm font-bold text-white">{formatDate(data.invoices[0].dueDate)}</p>
                      <p className="mt-2 text-xs text-gray-400">Amount: {formatZAR(data.invoices[0].amountDue)}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SLACircleGauge({ uptime }: { uptime: number }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (uptime / 100) * circumference;

  return (
    <div className="relative h-24 w-24">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        {/* Background circle */}
        <circle cx="60" cy="60" r="45" fill="none" stroke="#374151" strokeWidth="6" />
        {/* Progress circle */}
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="#E87A1E"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-bold text-white">{uptime}%</p>
          <p className="text-xs text-gray-400">uptime</p>
        </div>
      </div>
    </div>
  );
}
