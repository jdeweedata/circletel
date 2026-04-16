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
  lead_name: string | null;
  lead_email: string | null;
  lead_phone: string | null;
  lead_address: string | null;
  insight_status: InsightStatus;
  is_signed_up: boolean;
  zoho_created_at: string | null;
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

function exportToCsv(tickets: TicketRow[]) {
  const headers = ['Ticket #', 'Name', 'Email', 'Phone', 'Address', 'Insight', 'Signed Up', 'Agent', 'Created'];
  const rows = tickets.map((t) => [
    t.ticket_number ?? '',
    t.lead_name ?? t.contact_name ?? '',
    t.lead_email ?? '',
    t.lead_phone ?? '',
    t.lead_address ?? '',
    t.insight_status,
    t.is_signed_up ? 'Yes' : 'No',
    t.assigned_agent ?? 'Unassigned',
    t.zoho_created_at ? new Date(t.zoho_created_at).toLocaleDateString('en-ZA') : '',
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `whatsapp-campaign-leads-${new Date().toISOString().slice(0, 10)}.csv`;
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

export default function WhatsAppCampaignPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

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

  // Derived agent rows
  const agentRows = snap
    ? Object.entries(snap.agent_breakdown).map(([agent, count]) => ({
        agent,
        count,
        signUps: tickets.filter((t) => t.assigned_agent === agent && t.is_signed_up).length,
        closed: tickets.filter((t) => t.assigned_agent === agent && t.status === 'Closed').length,
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
            label="Total Leads"
            value={snap?.cumulative_leads ?? '—'}
            subtitle={snap ? `${snap.new_leads_today} yesterday` : undefined}
            icon={<PiUsersBold />}
          />
          <StatCard
            label="Conversions"
            value={snap?.conversions_today ?? '—'}
            subtitle={snap ? `${snap.conversion_rate.toFixed(1)}% rate` : undefined}
            icon={<PiCheckCircleBold />}
          />
          <StatCard
            label="Open Tickets"
            value={snap?.open_tickets ?? '—'}
            subtitle={snap?.unassigned_tickets ? `${snap.unassigned_tickets} unassigned ⚠` : undefined}
            icon={<PiChartBarBold />}
          />
          <StatCard
            label="Avg. Response"
            value={formatDuration(snap?.avg_first_response_ms ?? null)}
            icon={<PiClockBold />}
          />
        </div>

        {/* Tabs */}
        <UnderlineTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Overview Tab */}
        <TabPanel id="overview" activeTab={activeTab}>
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
                {tickets.slice(0, 20).map((t) => (
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
                onClick={() => exportToCsv(tickets)}
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
                  {tickets.map((t) => (
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
              {tickets.map((t) => (
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
