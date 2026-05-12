'use client';

import { useState } from 'react';
import { BusinessPortalData, formatZAR, formatDate, timeAgo } from './mock-data';

type SectionType = 'overview' | 'services' | 'billing' | 'support' | 'contracts';

const SectionIcon = ({ type }: { type: SectionType }): string => {
  const icons: Record<SectionType, string> = {
    overview: '📊',
    services: '🔌',
    billing: '💳',
    support: '🆘',
    contracts: '📋',
  };
  return icons[type];
};

const StatusBadge = ({ status }: { status: string }) => {
  const badgeClasses: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    provisioning: 'bg-blue-100 text-blue-800',
    degraded: 'bg-yellow-100 text-yellow-800',
    down: 'bg-red-100 text-red-800',
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    overdue: 'bg-red-100 text-red-800',
    open: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-orange-100 text-orange-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    active_status: 'bg-green-100 text-green-800',
    expiring_soon: 'bg-yellow-100 text-yellow-800',
    expired: 'bg-red-100 text-red-800',
  };

  const displayText = status.replace(/_/g, ' ').charAt(0).toUpperCase() + status.replace(/_/g, ' ').slice(1);
  return (
    <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded ${badgeClasses[status] || 'bg-gray-100 text-gray-800'}`}>
      {displayText}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const priorityClasses: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800',
  };

  const displayText = priority.charAt(0).toUpperCase() + priority.slice(1);
  return (
    <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded ${priorityClasses[priority] || 'bg-gray-100 text-gray-800'}`}>
      {displayText}
    </span>
  );
};

const StatCard = ({ label, value, subtext }: { label: string; value: string | number; subtext?: string }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <div className="text-gray-600 text-sm font-medium mb-1">{label}</div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    {subtext && <div className="text-gray-500 text-xs mt-2">{subtext}</div>}
  </div>
);

const OverviewSection = ({ data }: { data: BusinessPortalData }) => {
  const sites = Array.from(new Set(data.services.map(s => s.site)));
  const recentTickets = data.tickets.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Active Sites" value={data.stats.activeSites} />
        <StatCard label="Total Services" value={data.stats.totalServices} />
        <StatCard label="Monthly Spend" value={formatZAR(data.stats.monthlySpend)} />
        <StatCard label="Avg Uptime" value={`${data.stats.avgUptime.toFixed(2)}%`} />
      </div>

      {/* Two-column grid: Services by Site + Recent Tickets */}
      <div className="grid grid-cols-2 gap-6">
        {/* Services by Site */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Services by Site</h3>
          <div className="space-y-3">
            {sites.map((site) => {
              const siteServices = data.services.filter(s => s.site === site);
              const activeCount = siteServices.filter(s => s.status === 'active').length;
              const totalCount = siteServices.length;
              return (
                <div key={site} className="flex justify-between items-start pb-3 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="font-medium text-gray-900">{site}</div>
                    <div className="text-xs text-gray-500">
                      {activeCount}/{totalCount} services active
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${activeCount === totalCount ? 'text-green-600' : 'text-yellow-600'}`}>
                    {activeCount}/{totalCount}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tickets</h3>
          <div className="space-y-3">
            {recentTickets.map((ticket) => (
              <div key={ticket.id} className="pb-3 border-b border-gray-100 last:border-0">
                <div className="flex items-start justify-between mb-1">
                  <div className="font-medium text-gray-900 text-sm flex-1 mr-2">{ticket.subject}</div>
                  <PriorityBadge priority={ticket.priority} />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{ticket.assignee}</span>
                  <span>{timeAgo(ticket.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ServicesSection = ({ data }: { data: BusinessPortalData }) => {
  const typeLabels: Record<string, string> = {
    fibre: 'Fibre',
    wireless: 'Wireless',
    voip: 'VoIP',
    iot: 'IoT',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Business Services</h2>
        <p className="text-sm text-gray-600 mt-1">All active and provisioning services across your sites</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Service Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Site</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Speed</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Monthly Cost</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">30d Uptime</th>
            </tr>
          </thead>
          <tbody>
            {data.services.map((service, idx) => (
              <tr key={service.id} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{service.name}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{typeLabels[service.type]}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{service.site}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{service.speed}</td>
                <td className="px-6 py-4 text-sm">
                  <StatusBadge status={service.status} />
                </td>
                <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">{formatZAR(service.monthlyPrice)}</td>
                <td className="px-6 py-4 text-sm text-right font-medium">{service.uptime30d.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const BillingSection = ({ data }: { data: BusinessPortalData }) => {
  const totalOutstanding = data.invoices.reduce((sum, inv) => sum + inv.amountDue, 0);
  const latestInvoice = data.invoices[0];

  return (
    <div className="space-y-6">
      {/* Current Balance Card */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-blue-700 text-sm font-medium mb-1">Current Balance</div>
            <div className="text-4xl font-bold text-blue-900">{formatZAR(totalOutstanding)}</div>
            <div className="text-blue-700 text-sm mt-2">
              {totalOutstanding > 0 ? 'Payment due' : 'All invoices paid'}
            </div>
          </div>
          <div className="text-4xl opacity-10">💳</div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Invoice History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Due Date</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Due</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.invoices.map((invoice, idx) => (
                <tr key={invoice.id} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{invoice.number}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{formatDate(invoice.date)}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{formatDate(invoice.dueDate)}</td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">{formatZAR(invoice.amount)}</td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">{formatZAR(invoice.amountDue)}</td>
                  <td className="px-6 py-4 text-sm">
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">Download</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SupportSection = ({ data }: { data: BusinessPortalData }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Support Tickets</h2>
          <p className="text-sm text-gray-600 mt-1">
            {data.stats.openTickets} open, {data.stats.unresolvedCritical} critical
          </p>
        </div>
        <button className="px-4 py-2 bg-orange-600 text-white rounded font-medium text-sm hover:bg-orange-700">
          New Ticket
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Ticket #</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Updated</th>
              </tr>
            </thead>
            <tbody>
              {data.tickets.map((ticket, idx) => (
                <tr key={ticket.id} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                  <td className="px-6 py-4 text-sm font-medium text-blue-600">{ticket.id.toUpperCase()}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{ticket.subject}</td>
                  <td className="px-6 py-4 text-sm">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{ticket.assignee}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{timeAgo(ticket.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ContractsSection = ({ data }: { data: BusinessPortalData }) => {
  const calculateProgress = (startDate: string, endDate: string): number => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = Date.now();
    return Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Active Contracts</h2>
        <p className="text-sm text-gray-600 mt-1">Service level agreements and renewal dates</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {data.contracts.map((contract) => {
          const progress = calculateProgress(contract.startDate, contract.endDate);
          const daysUntilEnd = Math.ceil((new Date(contract.endDate).getTime() - Date.now()) / 86400000);

          return (
            <div key={contract.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{contract.name}</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {formatDate(contract.startDate)} to {formatDate(contract.endDate)}
                  </p>
                </div>
                <StatusBadge status={contract.status} />
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Contract Value</span>
                  <span className="font-semibold text-gray-900">{formatZAR(contract.value)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">SLA Uptime Target</span>
                  <span className="font-semibold text-gray-900">{contract.slaUptime}%</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-600">Contract Timeline</span>
                  <span className="text-xs font-semibold text-gray-900">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  {daysUntilEnd > 0 ? `${daysUntilEnd} days remaining` : 'Expired'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export function VariantB({ data }: { data: BusinessPortalData }) {
  const [activeSection, setActiveSection] = useState<SectionType>('overview');

  const sections: Array<{ id: SectionType; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'services', label: 'Services' },
    { id: 'billing', label: 'Billing' },
    { id: 'support', label: 'Support' },
    { id: 'contracts', label: 'Contracts' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col text-white">
        {/* Logo / Company Area */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center font-bold text-sm">
              CT
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{data.company.name}</div>
              <div className="text-xs text-gray-400 truncate">{data.company.accountNumber}</div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-colors flex items-center gap-3 ${
                activeSection === section.id
                  ? 'bg-orange-600 text-white border-l-4 border-orange-500'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <span className="text-lg">{SectionIcon({ type: section.id })}</span>
              {section.label}
            </button>
          ))}
        </nav>

        {/* Account Manager Card */}
        <div className="p-4 border-t border-gray-800 bg-gray-800 rounded-lg m-3">
          <div className="text-xs text-gray-400 mb-2">Account Manager</div>
          <div className="font-semibold text-sm mb-1">{data.company.accountManager}</div>
          <a href={`mailto:${data.company.accountManagerEmail}`} className="text-orange-500 text-xs hover:text-orange-400">
            {data.company.accountManagerEmail}
          </a>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {sections.find(s => s.id === activeSection)?.label}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {data.company.tier.charAt(0).toUpperCase() + data.company.tier.slice(1)} tier account • SLA: {data.company.slaUptime}%
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-orange-600">{formatZAR(data.stats.monthlySpend)}</div>
            <div className="text-xs text-gray-600">monthly</div>
          </div>
        </header>

        {/* Content Scroll Area */}
        <main className="flex-1 overflow-auto px-8 py-6">
          {activeSection === 'overview' && <OverviewSection data={data} />}
          {activeSection === 'services' && <ServicesSection data={data} />}
          {activeSection === 'billing' && <BillingSection data={data} />}
          {activeSection === 'support' && <SupportSection data={data} />}
          {activeSection === 'contracts' && <ContractsSection data={data} />}
        </main>
      </div>
    </div>
  );
}
