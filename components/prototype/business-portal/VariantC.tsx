'use client';

import { useState } from 'react';
import {
  PiCaretRightBold,
  PiBuildingsBold,
  PiWifiHighBold,
  PiCurrencyCircleDollarBold,
  PiHeadsetBold,
  PiFileTextBold,
  PiChartLineUpBold,
  PiEnvelopeBold,
  PiDownloadSimpleBold,
  PiClockBold,
  PiMapPinBold,
  PiUserBold,
  PiPhoneBold,
  PiCheckCircleBold,
  PiWarningBold,
  PiXCircleBold,
  PiArrowUpBold,
  PiLightningBold,
  PiGearBold,
} from 'react-icons/pi';
import { StatusBadge, StatCard, SectionCard, UnderlineTabs, TabPanel, InfoRow } from '@/components/admin/shared';
import { BusinessPortalData, formatZAR, formatDate, timeAgo } from './mock-data';

const TAB_CONFIG = [
  { id: 'overview', label: 'Overview' },
  { id: 'services', label: 'Services' },
  { id: 'billing', label: 'Billing' },
  { id: 'support', label: 'Support' },
  { id: 'activity', label: 'Activity' },
] as const;

type TabId = typeof TAB_CONFIG[number]['id'];

type ActivityFilter = 'all' | 'services' | 'billing' | 'support';

const TIER_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'neutral'> = {
  enterprise: 'info',
  premium: 'warning',
  standard: 'neutral',
};

const SERVICE_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  active: 'success',
  degraded: 'warning',
  down: 'error',
  provisioning: 'info',
};

const INVOICE_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'error',
  draft: 'neutral',
};

const TICKET_PRIORITY_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  critical: 'error',
  high: 'warning',
  medium: 'info',
  low: 'neutral',
};

function getEventColor(type: string) {
  switch (type) {
    case 'service': return 'bg-blue-500';
    case 'invoice': return 'bg-emerald-500';
    case 'payment': return 'bg-green-500';
    case 'ticket': return 'bg-red-500';
    case 'contract': return 'bg-purple-500';
    default: return 'bg-slate-400';
  }
}

function getEventIcon(type: string) {
  switch (type) {
    case 'service': return PiWifiHighBold;
    case 'invoice': return PiFileTextBold;
    case 'payment': return PiCurrencyCircleDollarBold;
    case 'ticket': return PiHeadsetBold;
    case 'contract': return PiFileTextBold;
    default: return PiClockBold;
  }
}

export function VariantC({ data }: { data: BusinessPortalData }) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');

  const filteredActivity = data.activity
    .filter((event) => {
      if (activityFilter === 'all') return true;
      if (activityFilter === 'services') return event.type === 'service';
      if (activityFilter === 'billing') return ['invoice', 'payment'].includes(event.type);
      if (activityFilter === 'support') return event.type === 'ticket';
      return false;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const nextInvoice = data.invoices.find((inv) => inv.status !== 'paid');
  const expiringContracts = data.contracts.filter((c) => c.status === 'expiring_soon');
  const activeServices = data.services.filter((s) => s.status === 'active');
  const degradedServices = data.services.filter((s) => s.status === 'degraded' || s.status === 'down');

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Header — matches OrderHeader pattern */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="hover:text-primary cursor-pointer">Business Portal</span>
            <PiCaretRightBold className="w-3 h-3" />
            <span className="hover:text-primary cursor-pointer">Accounts</span>
            <PiCaretRightBold className="w-3 h-3" />
            <span className="text-slate-900">{data.company.name}</span>
          </div>

          {/* Title Row */}
          <div className="flex flex-wrap items-center justify-between gap-6 mt-4">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                {data.company.name}
              </h2>
              <StatusBadge
                status={data.company.tier.charAt(0).toUpperCase() + data.company.tier.slice(1)}
                variant={TIER_VARIANT[data.company.tier] || 'neutral'}
              />
            </div>

            {/* Action Buttons — grouped icon buttons + primary CTA */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
                <button
                  type="button"
                  className="p-2.5 text-slate-600 hover:bg-slate-50 transition-colors"
                  title="Contact Account Manager"
                  aria-label="Contact Account Manager"
                >
                  <PiEnvelopeBold className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="p-2.5 text-slate-600 hover:bg-slate-50 transition-colors border-l border-slate-200"
                  title="Open Support Ticket"
                  aria-label="Open Support Ticket"
                >
                  <PiHeadsetBold className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="p-2.5 text-slate-600 hover:bg-slate-50 transition-colors border-l border-slate-200"
                  title="Download Statement"
                  aria-label="Download Statement"
                >
                  <PiDownloadSimpleBold className="w-5 h-5" />
                </button>
              </div>

              <button
                type="button"
                className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
              >
                <PiCurrencyCircleDollarBold className="w-5 h-5" />
                Pay Invoice
              </button>
            </div>
          </div>

          {/* Account number subtitle */}
          <p className="text-sm text-slate-500 mt-1">{data.company.accountNumber}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Stat Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            label="Active Sites"
            value={data.stats.activeSites}
            icon={<PiMapPinBold className="w-5 h-5" />}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatCard
            label="Total Services"
            value={data.stats.totalServices}
            icon={<PiWifiHighBold className="w-5 h-5" />}
            iconBgColor="bg-emerald-100"
            iconColor="text-emerald-600"
            subtitle={degradedServices.length > 0 ? `${degradedServices.length} need attention` : undefined}
          />
          <StatCard
            label="Monthly Spend"
            value={formatZAR(data.stats.monthlySpend)}
            icon={<PiCurrencyCircleDollarBold className="w-5 h-5" />}
            iconBgColor="bg-orange-100"
            iconColor="text-orange-600"
          />
          <StatCard
            label="Avg Uptime"
            value={`${data.stats.avgUptime.toFixed(1)}%`}
            icon={<PiChartLineUpBold className="w-5 h-5" />}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            subtitle={`SLA target: ${data.company.slaUptime}%`}
          />
          <StatCard
            label="Open Tickets"
            value={data.stats.openTickets}
            icon={<PiHeadsetBold className="w-5 h-5" />}
            iconBgColor="bg-red-100"
            iconColor="text-red-600"
          />
        </div>

        {/* Tabs */}
        <UnderlineTabs
          tabs={TAB_CONFIG}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as TabId)}
        />

        {/* OVERVIEW TAB */}
        <TabPanel id="overview" activeTab={activeTab} className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column — 2/3 width */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Activity Stream */}
              <SectionCard
                title="Recent Activity"
                icon={PiClockBold}
                action={
                  <button
                    onClick={() => setActiveTab('activity')}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View All
                  </button>
                }
              >
                <div className="space-y-0 relative">
                  <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-slate-200" />
                  {data.activity.slice(0, 5).map((event) => {
                    const Icon = getEventIcon(event.type);
                    return (
                      <div key={event.id} className="flex gap-4 py-3 relative">
                        <div className={`z-10 size-6 rounded-full flex items-center justify-center ring-4 ring-white ${getEventColor(event.type)}`}>
                          <Icon className="w-3 h-3 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-bold text-slate-900">{event.title}</p>
                              <p className="text-xs text-slate-500">{event.description}</p>
                            </div>
                            <span className="text-xs text-slate-400 whitespace-nowrap font-medium">
                              {timeAgo(event.timestamp)}
                            </span>
                          </div>
                          {event.metadata && Object.keys(event.metadata).length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {Object.entries(event.metadata).map(([key, value]) => (
                                <span
                                  key={`${key}-${value}`}
                                  className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                                >
                                  {value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>

              {/* Service Health Overview */}
              <SectionCard title="Service Health" icon={PiWifiHighBold}>
                <div className="divide-y divide-slate-100">
                  {data.services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`size-2.5 rounded-full flex-shrink-0 ${
                          service.status === 'active' ? 'bg-emerald-500' :
                          service.status === 'degraded' ? 'bg-amber-500' :
                          service.status === 'down' ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{service.name}</p>
                          <p className="text-xs text-slate-500">{service.site}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs text-slate-500">{service.speed}</span>
                        <StatusBadge
                          status={service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                          variant={SERVICE_STATUS_VARIANT[service.status] || 'neutral'}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* Right column — 1/3 width */}
            <div className="space-y-6">
              {/* Account Details */}
              <SectionCard title="Account Details" icon={PiBuildingsBold}>
                <div className="space-y-0 divide-y divide-slate-100">
                  <InfoRow label="Account Number" value={data.company.accountNumber} />
                  <InfoRow label="Account Manager" value={data.company.accountManager} />
                  <InfoRow
                    label="Contact"
                    value={
                      <a href={`mailto:${data.company.accountManagerEmail}`} className="text-primary hover:underline text-sm">
                        {data.company.accountManagerEmail}
                      </a>
                    }
                  />
                  <InfoRow label="Tier" value={
                    <StatusBadge
                      status={data.company.tier.charAt(0).toUpperCase() + data.company.tier.slice(1)}
                      variant={TIER_VARIANT[data.company.tier] || 'neutral'}
                    />
                  } />
                  <InfoRow label="SLA Uptime" value={`${data.company.slaUptime}%`} />
                </div>
              </SectionCard>

              {/* Upcoming */}
              <SectionCard title="Upcoming" icon={PiClockBold}>
                <div className="space-y-3">
                  {nextInvoice && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <PiFileTextBold className="w-4 h-4 text-amber-600" />
                        <p className="text-xs font-semibold text-amber-700">Invoice Due</p>
                      </div>
                      <p className="text-sm font-bold text-slate-900">{nextInvoice.number}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">
                          {formatZAR(nextInvoice.amountDue)}
                        </span>
                        <span className="text-xs text-slate-500">{formatDate(nextInvoice.dueDate)}</span>
                      </div>
                    </div>
                  )}
                  {expiringContracts.map((contract) => (
                    <div key={contract.id} className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <PiFileTextBold className="w-4 h-4 text-purple-600" />
                        <p className="text-xs font-semibold text-purple-700">Contract Expiring</p>
                      </div>
                      <p className="text-sm font-bold text-slate-900">{contract.name}</p>
                      <p className="text-xs text-slate-500 mt-1">Ends {formatDate(contract.endDate)}</p>
                    </div>
                  ))}
                  {!nextInvoice && expiringContracts.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">Nothing upcoming</p>
                  )}
                </div>
              </SectionCard>

              {/* SLA Performance */}
              <SectionCard title="SLA Performance" icon={PiChartLineUpBold}>
                <div className="text-center py-2">
                  <div className="text-4xl font-extrabold text-emerald-600 tracking-tight">
                    {data.stats.avgUptime.toFixed(2)}%
                  </div>
                  <p className="text-xs text-slate-500 mt-1">30-day average uptime</p>
                  <div className="mt-4 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${data.stats.avgUptime}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Target: {data.company.slaUptime.toFixed(2)}%
                  </p>
                </div>
              </SectionCard>
            </div>
          </div>
        </TabPanel>

        {/* SERVICES TAB */}
        <TabPanel id="services" activeTab={activeTab} className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.services.map((service) => (
              <SectionCard
                key={service.id}
                title={service.name}
                icon={PiWifiHighBold}
                action={
                  <StatusBadge
                    status={service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                    variant={SERVICE_STATUS_VARIANT[service.status] || 'neutral'}
                    showDot
                  />
                }
              >
                <div className="space-y-0 divide-y divide-slate-100">
                  <InfoRow label="Site" value={service.site} />
                  <InfoRow label="Type" value={service.type.toUpperCase()} />
                  <InfoRow label="Speed" value={service.speed} />
                  <InfoRow label="Monthly Cost" value={formatZAR(service.monthlyPrice)} />
                  {service.uptime !== undefined && (
                    <InfoRow label="Uptime" value={
                      <span className={service.uptime >= 99.5 ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                        {service.uptime.toFixed(2)}%
                      </span>
                    } />
                  )}
                </div>
              </SectionCard>
            ))}
          </div>
        </TabPanel>

        {/* BILLING TAB */}
        <TabPanel id="billing" activeTab={activeTab} className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SectionCard title="Invoices" icon={PiFileTextBold}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice</th>
                        <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                        <th className="text-right py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                        <th className="text-right py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-slate-50">
                          <td className="py-3 px-2 font-semibold text-slate-900">{invoice.number}</td>
                          <td className="py-3 px-2 text-slate-500">{formatDate(invoice.date)}</td>
                          <td className="py-3 px-2 text-slate-500">{formatDate(invoice.dueDate)}</td>
                          <td className="py-3 px-2 text-right font-semibold text-slate-900">{formatZAR(invoice.amountDue)}</td>
                          <td className="py-3 px-2 text-right">
                            <StatusBadge
                              status={invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                              variant={INVOICE_STATUS_VARIANT[invoice.status] || 'neutral'}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
            <div className="space-y-6">
              <SectionCard title="Billing Summary" icon={PiCurrencyCircleDollarBold}>
                <div className="space-y-0 divide-y divide-slate-100">
                  <InfoRow label="Monthly Recurring" value={<span className="font-bold">{formatZAR(data.stats.monthlySpend)}</span>} />
                  <InfoRow label="Active Services" value={activeServices.length} />
                  <InfoRow label="Next Due" value={nextInvoice ? formatDate(nextInvoice.dueDate) : 'None'} />
                </div>
              </SectionCard>
              {nextInvoice && nextInvoice.status !== 'paid' && (
                <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 text-center">
                  <p className="text-sm font-semibold text-slate-900 mb-1">Payment Due</p>
                  <p className="text-2xl font-extrabold text-primary">{formatZAR(nextInvoice.amountDue)}</p>
                  <p className="text-xs text-slate-500 mt-1">Due {formatDate(nextInvoice.dueDate)}</p>
                  <button className="mt-4 w-full bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-primary/20">
                    Pay Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </TabPanel>

        {/* SUPPORT TAB */}
        <TabPanel id="support" activeTab={activeTab} className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.tickets.map((ticket) => (
              <SectionCard
                key={ticket.id}
                title={ticket.subject}
                icon={PiHeadsetBold}
                action={
                  <StatusBadge
                    status={ticket.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    variant={ticket.status === 'resolved' ? 'success' : ticket.status === 'open' ? 'warning' : 'info'}
                  />
                }
              >
                <div className="space-y-0 divide-y divide-slate-100">
                  <InfoRow label="Ticket" value={<span className="font-mono text-xs">{ticket.id}</span>} />
                  <InfoRow label="Priority" value={
                    <StatusBadge
                      status={ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                      variant={TICKET_PRIORITY_VARIANT[ticket.priority] || 'neutral'}
                    />
                  } />
                  <InfoRow label="Site" value={ticket.site} />
                  <InfoRow label="Created" value={formatDate(ticket.createdAt)} />
                  {ticket.lastUpdate && (
                    <InfoRow label="Last Update" value={timeAgo(ticket.lastUpdate)} />
                  )}
                </div>
              </SectionCard>
            ))}
            {data.tickets.length === 0 && (
              <div className="lg:col-span-2 text-center py-12">
                <PiCheckCircleBold className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No open tickets</p>
              </div>
            )}
          </div>
        </TabPanel>

        {/* ACTIVITY TAB — the activity stream, now in a dedicated tab */}
        <TabPanel id="activity" activeTab={activeTab} className="mt-6">
          <SectionCard
            title="Activity Timeline"
            icon={PiClockBold}
            action={
              <div className="flex gap-1">
                {(['all', 'services', 'billing', 'support'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActivityFilter(filter)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                      activityFilter === filter
                        ? 'bg-primary text-white'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            }
          >
            <div className="space-y-0 relative">
              <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-slate-200" />
              {filteredActivity.length > 0 ? (
                filteredActivity.map((event) => {
                  const Icon = getEventIcon(event.type);
                  return (
                    <div key={event.id} className="flex gap-4 py-4 relative hover:bg-slate-50 -mx-6 px-6 transition-colors">
                      <div className={`z-10 size-8 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm ${getEventColor(event.type)}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{event.title}</p>
                            <p className="text-sm text-slate-500">{event.description}</p>
                          </div>
                          <span className="text-xs text-slate-400 whitespace-nowrap font-medium pt-0.5">
                            {timeAgo(event.timestamp)}
                          </span>
                        </div>
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {Object.entries(event.metadata).map(([key, value]) => {
                              if (key === 'priority') {
                                const variant = TICKET_PRIORITY_VARIANT[value as string] || 'neutral';
                                return (
                                  <StatusBadge
                                    key={`${key}-${value}`}
                                    status={String(value)}
                                    variant={variant}
                                  />
                                );
                              }
                              return (
                                <span
                                  key={`${key}-${value}`}
                                  className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-medium"
                                >
                                  {value}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center">
                  <p className="text-slate-500">No activity in this category</p>
                </div>
              )}
            </div>
          </SectionCard>
        </TabPanel>
      </div>
    </div>
  );
}
