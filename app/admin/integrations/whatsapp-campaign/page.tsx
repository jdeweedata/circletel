// app/admin/integrations/whatsapp-campaign/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PiArrowClockwiseBold,
  PiWhatsappLogoBold,
  PiUsersBold,
  PiCheckCircleBold,
  PiChartBarBold,
  PiClockBold,
  PiDownloadBold,
} from 'react-icons/pi';
import { StatCard } from '@/components/admin/shared/StatCard';
import { SectionCard } from '@/components/admin/shared/SectionCard';
import { UnderlineTabs, TabPanel } from '@/components/admin/shared/UnderlineTabs';
import { InsightBadge } from '@/components/admin/shared/InsightBadge';
import { ConversationThread } from '@/components/admin/whatsapp-campaign/ConversationThread';
import type { InsightStatus, CampaignConversation } from '@/lib/integrations/zoho/desk-campaign-service';
import {
  enrichSalesTicket,
  summarizeSalesQueues,
  type SalesOpsTicket,
  type SalesQueue,
} from '@/lib/integrations/zoho/campaign-sales-ops';

// =============================================================================
// TYPES
// =============================================================================

interface SnapshotRow {
  report_date: string;
  new_leads_today: number;
  cumulative_leads: number;
  open_tickets: number;
  closed_tickets: number;
  unassigned_tickets: number;
  conversion_rate: number;
  avg_first_response_ms: number | null;
  agent_breakdown: Record<string, number>;
  conversions_today: number;
  pipeline_breakdown: Record<string, number>;
}

interface TicketRow {
  ticket_id: string;
  ticket_number: string | null;
  subject: string | null;
  status: string | null;
  assigned_agent: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  lead_name: string | null;
  lead_email: string | null;
  lead_phone: string | null;
  lead_address: string | null;
  insight_status: InsightStatus;
  is_signed_up: boolean;
  order_id: string | null;
  zoho_created_at: string | null;
  first_response_at: string | null;
  closed_at: string | null;
  conversations: CampaignConversation[];
  conversation_count: number;
}

interface ReportData {
  snapshot: SnapshotRow | null;
  tickets: TicketRow[];
  generatedAt: string;
  isLive: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

function formatDuration(ms: number | null): string {
  if (!ms) return 'N/A';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function csvEscape(value: string | number | null | undefined): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function exportToCsv(tickets: SalesOpsTicket[]) {
  const headers = [
    'Queue',
    'SLA Status',
    'Ticket #',
    'Name',
    'Phone',
    'Email',
    'Address',
    'Insight',
    'Signed Up',
    'Order ID',
    'Agent',
    'Lead Age',
    'First Response',
    'Created',
    'Messages',
  ];

  const rows = tickets.map((ticket) => [
    getQueueLabel(ticket.sales_queue),
    ticket.sla_status,
    ticket.ticket_number ?? '',
    ticket.display_name,
    ticket.display_phone ?? '',
    ticket.display_email ?? '',
    ticket.lead_address ?? '',
    ticket.insight_status,
    ticket.is_signed_up ? 'Yes' : 'No',
    ticket.order_id ?? '',
    ticket.assigned_agent ?? 'Unassigned',
    formatAge(ticket.lead_age_ms),
    ticket.first_response_ms === null ? '' : formatDuration(ticket.first_response_ms),
    ticket.zoho_created_at ? new Date(ticket.zoho_created_at).toLocaleString('en-ZA') : '',
    ticket.conversation_count,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `whatsapp-campaign-sales-queue-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// =============================================================================
// PAGE
// =============================================================================

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'leads', label: 'Leads' },
  { id: 'agents', label: 'Agent Performance' },
  { id: 'conversations', label: 'Conversations' },
];

const PIPELINE_ORDER: InsightStatus[] = [
  'signed_up', 'completed', 'in_progress', 'awaiting_details',
  'no_coverage', 'awaiting_agent', 'unresponsive', 'closed_resolved',
];

const SALES_QUEUE_TABS: Array<{ id: SalesQueue | 'all'; label: string }> = [
  { id: 'all', label: 'All Active' },
  { id: 'sla_risk', label: 'SLA Risk' },
  { id: 'needs_agent', label: 'Needs Agent' },
  { id: 'ready_to_sell', label: 'Ready to Sell' },
  { id: 'waiting_on_customer', label: 'Waiting on Customer' },
  { id: 'coverage_issue', label: 'Coverage Issue' },
  { id: 'unresponsive', label: 'Unresponsive' },
  { id: 'converted', label: 'Converted' },
];

function formatAge(ms: number | null): string {
  if (ms === null) return 'N/A';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getQueueLabel(queue: SalesQueue): string {
  return SALES_QUEUE_TABS.find((tab) => tab.id === queue)?.label ?? queue;
}

export default function WhatsAppCampaignPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [activeQueue, setActiveQueue] = useState<SalesQueue | 'all'>('all');

  const fetchData = useCallback(async (live = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/admin/whatsapp-campaign/report${live ? '?live=true' : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json: ReportData = await res.json();
      setData(json);
      return json;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load from DB first; auto-fallback to live Zoho data if DB is empty
    fetchData().then((json) => {
      if (!json || (!json.snapshot && json.tickets.length === 0)) {
        fetchData(true);
      }
    });
  }, [fetchData]);

  const snap = data?.snapshot;
  const tickets = data?.tickets ?? [];

  // Enrich tickets with sales ops data
  const enrichedTickets = tickets
    .map((ticket) => enrichSalesTicket(ticket))
    .sort((a, b) => {
      const queueRank: Record<SalesQueue, number> = {
        sla_risk: 0,
        needs_agent: 1,
        ready_to_sell: 2,
        waiting_on_customer: 3,
        coverage_issue: 4,
        unresponsive: 5,
        converted: 6,
      };
      const rankDiff = queueRank[a.sales_queue] - queueRank[b.sales_queue];
      if (rankDiff !== 0) return rankDiff;
      return (b.lead_age_ms ?? 0) - (a.lead_age_ms ?? 0);
    });

  const queueCounts = summarizeSalesQueues(enrichedTickets);

  const activeSalesTickets =
    activeQueue === 'all'
      ? enrichedTickets.filter((ticket) => ticket.sales_queue !== 'converted')
      : enrichedTickets.filter((ticket) => ticket.sales_queue === activeQueue);

  // Derived agent rows
  const agentRows = snap
    ? Object.entries(snap.agent_breakdown).map(([agent, count]) => ({
        agent,
        count,
        signUps: enrichedTickets.filter((t) => t.assigned_agent === agent && t.is_signed_up).length,
        closed: enrichedTickets.filter((t) => t.assigned_agent === agent && t.status === 'Closed').length,
      }))
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <PiWhatsappLogoBold className="text-green-600 text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">WhatsApp Lead Campaign</h1>
              <p className="text-sm text-slate-500">
                {loading
                  ? 'Loading...'
                  : snap
                    ? `Last updated: ${new Date(data?.generatedAt ?? '').toLocaleString('en-ZA')}${data?.isLive ? ' · Live' : ''}`
                    : 'No data yet — run the daily report or click Refresh Live'}
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <PiArrowClockwiseBold className={loading ? 'animate-spin' : ''} />
            Refresh Live
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Needs Agent"
            value={queueCounts.needs_agent}
            subtitle={`${queueCounts.sla_risk} SLA risk`}
            icon={<PiUsersBold />}
            onClick={() => setActiveQueue('needs_agent')}
            isActive={activeQueue === 'needs_agent'}
          />
          <StatCard
            label="SLA Risk"
            value={queueCounts.sla_risk}
            subtitle="No response after 2h"
            icon={<PiClockBold />}
            onClick={() => setActiveQueue('sla_risk')}
            isActive={activeQueue === 'sla_risk'}
          />
          <StatCard
            label="Ready to Sell"
            value={queueCounts.ready_to_sell}
            subtitle="Details collected, no order"
            icon={<PiChartBarBold />}
            onClick={() => setActiveQueue('ready_to_sell')}
            isActive={activeQueue === 'ready_to_sell'}
          />
          <StatCard
            label="Converted"
            value={queueCounts.converted}
            subtitle={snap ? `${snap.conversions_today} yesterday` : undefined}
            icon={<PiCheckCircleBold />}
            onClick={() => setActiveQueue('converted')}
            isActive={activeQueue === 'converted'}
          />
        </div>

        {/* Tabs */}
        <UnderlineTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Overview Tab */}
        <TabPanel id="overview" activeTab={activeTab}>
          <SectionCard
            title="Daily Sales Queue"
            icon={PiWhatsappLogoBold}
            action={
              <button
                onClick={() => exportToCsv(activeSalesTickets)}
                className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
              >
                <PiDownloadBold /> Export Queue
              </button>
            }
          >
            <div className="flex flex-wrap gap-2 mb-4">
              {SALES_QUEUE_TABS.map((tab) => {
                const count = tab.id === 'all'
                  ? enrichedTickets.filter((ticket) => ticket.sales_queue !== 'converted').length
                  : queueCounts[tab.id];
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveQueue(tab.id)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      activeQueue === tab.id
                        ? 'border-circleTel-orange bg-orange-50 text-circleTel-orange'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label} <span className="ml-1 text-xs opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                    <th className="pb-2 pr-4">Lead</th>
                    <th className="pb-2 pr-4">Queue</th>
                    <th className="pb-2 pr-4">Age</th>
                    <th className="pb-2 pr-4">Response</th>
                    <th className="pb-2 pr-4">Agent</th>
                    <th className="pb-2 pr-4">Address</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeSalesTickets.map((ticket) => (
                    <tr key={ticket.ticket_id} className="hover:bg-slate-50">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-slate-900">{ticket.display_name}</p>
                        <p className="text-xs text-slate-500">
                          {ticket.display_phone ?? ticket.display_email ?? 'No contact captured'} · #{ticket.ticket_number ?? 'N/A'}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-xs font-semibold text-slate-700">{getQueueLabel(ticket.sales_queue)}</span>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{formatAge(ticket.lead_age_ms)}</td>
                      <td className="py-3 pr-4 text-slate-600">
                        {ticket.first_response_ms === null ? ticket.sla_status : formatDuration(ticket.first_response_ms)}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{ticket.assigned_agent ?? 'Unassigned'}</td>
                      <td className="py-3 pr-4 text-slate-600 max-w-[240px] truncate">
                        {ticket.lead_address ?? 'No address captured'}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {ticket.display_phone && (
                            <button
                              onClick={() => navigator.clipboard.writeText(ticket.display_phone ?? '')}
                              className="text-xs font-medium text-slate-600 hover:text-slate-900"
                            >
                              Copy Phone
                            </button>
                          )}
                          {ticket.order_id && (
                            <a
                              href={`/admin/orders/${ticket.order_id}`}
                              className="text-xs font-medium text-circleTel-orange hover:underline"
                            >
                              Open Order
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Pipeline Breakdown */}
            <SectionCard title="Lead Pipeline (All Time)" icon={PiChartBarBold}>
              <div className="space-y-2">
                {PIPELINE_ORDER.map((status) => {
                  const count = snap?.pipeline_breakdown[status] ?? 0;
                  const total = snap?.cumulative_leads ?? 1;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <InsightBadge status={status} className="w-36 justify-center" />
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-[#F5831F] h-2 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-600 w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            {/* Recent Tickets */}
            <SectionCard title="Recent Tickets" icon={PiWhatsappLogoBold}>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {enrichedTickets.slice(0, 20).map((t) => (
                  <div
                    key={t.ticket_id}
                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {t.lead_name ?? t.contact_name ?? '—'}
                      </p>
                      <p className="text-xs text-slate-500">#{t.ticket_number}</p>
                    </div>
                    <InsightBadge status={t.insight_status} />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </TabPanel>

        {/* Leads Tab */}
        <TabPanel id="leads" activeTab={activeTab}>
          <SectionCard
            title="All Leads"
            icon={PiUsersBold}
            action={
              <button
                onClick={() => exportToCsv(enrichedTickets)}
                className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
              >
                <PiDownloadBold /> Export CSV
              </button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">Email</th>
                    <th className="pb-2 pr-4">Phone</th>
                    <th className="pb-2 pr-4">Address</th>
                    <th className="pb-2 pr-4">Insight</th>
                    <th className="pb-2 pr-4">Agent</th>
                    <th className="pb-2">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrichedTickets.map((t) => (
                    <tr key={t.ticket_id} className="hover:bg-slate-50">
                      <td className="py-2 pr-4 font-medium text-slate-900">
                        {t.lead_name ?? t.contact_name ?? '—'}
                        {t.is_signed_up && (
                          <span className="ml-1 text-emerald-600 text-xs">✅</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-slate-600">{t.lead_email ?? '—'}</td>
                      <td className="py-2 pr-4 text-slate-600">{t.lead_phone ?? '—'}</td>
                      <td className="py-2 pr-4 text-slate-600 max-w-[200px] truncate">
                        {t.lead_address ?? '—'}
                      </td>
                      <td className="py-2 pr-4">
                        <InsightBadge status={t.insight_status} />
                      </td>
                      <td className="py-2 pr-4 text-slate-600">
                        {t.assigned_agent ?? 'Unassigned'}
                      </td>
                      <td className="py-2 text-slate-500">
                        {t.zoho_created_at
                          ? new Date(t.zoho_created_at).toLocaleDateString('en-ZA')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </TabPanel>

        {/* Agent Performance Tab */}
        <TabPanel id="agents" activeTab={activeTab}>
          <SectionCard title="Agent Performance" icon={PiUsersBold}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                  <th className="pb-2 pr-4">Agent</th>
                  <th className="pb-2 pr-4">Tickets Assigned</th>
                  <th className="pb-2 pr-4">Sign-Ups</th>
                  <th className="pb-2">Closed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agentRows.map((row) => (
                  <tr key={row.agent} className="hover:bg-slate-50">
                    <td className="py-2 pr-4 font-medium text-slate-900">{row.agent}</td>
                    <td className="py-2 pr-4 text-slate-600">{row.count}</td>
                    <td className="py-2 pr-4 text-emerald-600 font-medium">{row.signUps}</td>
                    <td className="py-2 text-slate-600">{row.closed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>
        </TabPanel>

        {/* Conversations Tab */}
        <TabPanel id="conversations" activeTab={activeTab}>
          <SectionCard title="Conversation Threads" icon={PiWhatsappLogoBold}>
            <div className="space-y-3">
              {enrichedTickets.map((t) => (
                <div key={t.ticket_id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() =>
                      setExpandedTicket(expandedTicket === t.ticket_id ? null : t.ticket_id)
                    }
                    className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-medium text-slate-900">
                        {t.lead_name ?? t.contact_name ?? '—'}
                      </span>
                      <span className="text-xs text-slate-500">#{t.ticket_number}</span>
                      <InsightBadge status={t.insight_status} />
                    </div>
                    <span className="text-xs text-slate-500 ml-2 shrink-0">
                      {t.conversation_count} messages
                    </span>
                  </button>
                  {expandedTicket === t.ticket_id && (
                    <div className="border-t border-slate-100">
                      <ConversationThread conversations={t.conversations} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </TabPanel>
      </div>
    </div>
  );
}
