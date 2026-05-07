'use client';

import { useEffect, useState } from 'react';
import {
  PiLifebuoyBold,
  PiPaperPlaneTiltBold,
  PiCheckCircleBold,
  PiClockBold,
} from 'react-icons/pi';
import { usePortalAuth } from '@/lib/portal/portal-auth-provider';

type TicketType = 'support' | 'fault_report' | 'activation_request' | 'change_request';

const TICKET_TYPE_OPTIONS: { value: TicketType; label: string }[] = [
  { value: 'support', label: 'Support Request' },
  { value: 'fault_report', label: 'Fault Report' },
  { value: 'activation_request', label: 'Activate Site' },
  { value: 'change_request', label: 'Change Request' },
];

interface Site {
  id: string;
  site_name: string;
  status?: string;
}

interface Ticket {
  id: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  ticket_type: TicketType | null;
  created_at: string;
  resolved_at: string | null;
  corporate_sites: { id: string; site_name: string } | null;
}

export default function PortalSupportPage() {
  const { user, isAdmin } = usePortalAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [ticketType, setTicketType] = useState<TicketType>('support');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [siteId, setSiteId] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [activationNotes, setActivationNotes] = useState('');

  const isActivation = ticketType === 'activation_request';
  const isStandardForm = !isActivation;

  const activationSites = sites.filter(
    (s) => s.status === 'pending' || s.status === 'ready'
  );

  useEffect(() => {
    Promise.all([
      fetch('/api/portal/support').then((r) => r.json()),
      fetch('/api/portal/sites').then((r) => r.json()),
    ])
      .then(([ticketData, siteData]) => {
        setTickets(ticketData.tickets ?? []);
        setSites(siteData.sites ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  function canSubmit() {
    if (submitting) return false;
    if (isActivation) {
      return !!siteId;
    }
    return !!subject.trim() && !!description.trim();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (isActivation) {
      if (!siteId) return;
      const selectedSite = sites.find((s) => s.id === siteId);
      const siteName = selectedSite?.site_name ?? 'Unknown Site';
      const dateStr = preferredDate || 'As soon as possible';
      const notesStr = activationNotes.trim() || 'None';

      const autoSubject = `Activate: ${siteName}`;
      const autoDescription = `Activation request for ${siteName}. Preferred date: ${dateStr}. Notes: ${notesStr}`;

      setSubmitting(true);
      setSuccess(false);
      try {
        const res = await fetch('/api/portal/support', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticket_type: 'activation_request',
            subject: autoSubject,
            description: autoDescription,
            priority: 'medium',
            site_id: siteId,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to submit activation request');
        }

        const data = await res.json();
        setTickets((prev) => [data.ticket, ...prev]);
        setSiteId('');
        setPreferredDate('');
        setActivationNotes('');
        setTicketType('support');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to submit';
        setError(message);
      } finally {
        setSubmitting(false);
      }
    } else {
      if (!subject.trim() || !description.trim()) return;

      setSubmitting(true);
      setSuccess(false);
      try {
        const body: Record<string, string> = {
          ticket_type: ticketType,
          subject,
          description,
          priority,
        };
        if (siteId) body.site_id = siteId;

        const res = await fetch('/api/portal/support', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error('Failed to submit ticket');

        const data = await res.json();
        setTickets((prev) => [data.ticket, ...prev]);
        setSubject('');
        setDescription('');
        setPriority('medium');
        setSiteId('');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
      } catch (err) {
        console.error('Submit error:', err);
      } finally {
        setSubmitting(false);
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-circleTel-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <PiLifebuoyBold className="w-7 h-7 text-gray-400" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support</h1>
          <p className="text-gray-500 mt-0.5">Submit a support request or view ticket history</p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <PiCheckCircleBold className="w-5 h-5 text-green-600 shrink-0" />
          <p className="text-sm text-green-800">
            Your {isActivation ? 'activation request' : 'support ticket'} has been submitted. Our team will be in touch shortly.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-gray-900 mb-4">New Request</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task 2.1: Ticket type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Request Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TICKET_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setTicketType(opt.value);
                    setSiteId('');
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    ticketType === opt.value
                      ? 'border-circleTel-orange bg-circleTel-orange/10 text-circleTel-orange'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Task 2.2: Conditional form rendering */}
          {isActivation ? (
            <>
              {/* Task 2.4: Only show pending/ready sites */}
              <div>
                <label htmlFor="activation-site" className="block text-sm font-medium text-gray-700 mb-1">
                  Site to Activate <span className="text-red-500">*</span>
                </label>
                {activationSites.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    No sites available for activation (only sites with status &ldquo;pending&rdquo; or &ldquo;ready&rdquo; can be activated).
                  </p>
                ) : (
                  <select
                    id="activation-site"
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-circleTel-orange focus:ring-1 focus:ring-circleTel-orange outline-none bg-white"
                  >
                    <option value="">— Select a site —</option>
                    {activationSites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.site_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label htmlFor="preferred-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Activation Date (optional)
                </label>
                <input
                  id="preferred-date"
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-circleTel-orange focus:ring-1 focus:ring-circleTel-orange outline-none bg-white"
                />
              </div>

              <div>
                <label htmlFor="activation-notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  id="activation-notes"
                  value={activationNotes}
                  onChange={(e) => setActivationNotes(e.target.value)}
                  rows={3}
                  placeholder="Any additional information about the activation request"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-circleTel-orange focus:ring-1 focus:ring-circleTel-orange outline-none resize-y"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  placeholder="Brief description of the issue"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-circleTel-orange focus:ring-1 focus:ring-circleTel-orange outline-none"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  placeholder="Describe the issue in detail — include any error messages or affected areas"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-circleTel-orange focus:ring-1 focus:ring-circleTel-orange outline-none resize-y"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-circleTel-orange focus:ring-1 focus:ring-circleTel-orange outline-none bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {isAdmin && sites.length > 0 && (
                  <div>
                    <label htmlFor="site" className="block text-sm font-medium text-gray-700 mb-1">
                      Related Site (optional)
                    </label>
                    <select
                      id="site"
                      value={siteId}
                      onChange={(e) => setSiteId(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-circleTel-orange focus:ring-1 focus:ring-circleTel-orange outline-none bg-white"
                    >
                      <option value="">— General (no specific site) —</option>
                      {sites.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.site_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={!canSubmit()}
              className="inline-flex items-center gap-2 bg-circleTel-orange text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-circleTel-orange/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PiPaperPlaneTiltBold className="w-4 h-4" />
              {submitting
                ? 'Submitting...'
                : isActivation
                  ? 'Submit Activation Request'
                  : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border">
        <div className="px-4 py-3 border-b flex items-center gap-2">
          <PiClockBold className="w-5 h-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Ticket History</h2>
          <span className="text-xs text-gray-400 ml-auto">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</span>
        </div>
        {tickets.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-500">
            No support tickets yet.
          </div>
        ) : (
          <ul className="divide-y">
            {tickets.map((t) => (
              <li key={t.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.subject}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.description}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {/* Task 2.5: Ticket type badge */}
                      <TicketTypeBadge ticketType={t.ticket_type} />
                      <PriorityBadge priority={t.priority} />
                      <StatusBadge status={t.status} />
                      {t.corporate_sites && (
                        <span className="text-xs text-gray-400">{t.corporate_sites.site_name}</span>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(t.created_at).toLocaleDateString('en-ZA', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  {t.resolved_at && (
                    <span className="text-xs text-green-600 whitespace-nowrap">
                      Resolved {new Date(t.resolved_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TicketTypeBadge({ ticketType }: { ticketType: TicketType | null }) {
  const styles: Record<string, string> = {
    support: 'bg-gray-100 text-gray-600',
    fault_report: 'bg-red-100 text-red-700',
    activation_request: 'bg-purple-100 text-purple-700',
    change_request: 'bg-teal-100 text-teal-700',
  };

  const labels: Record<string, string> = {
    support: 'Support',
    fault_report: 'Fault',
    activation_request: 'Activation',
    change_request: 'Change',
  };

  const type = ticketType ?? 'support';

  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[type] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[type] ?? type}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[priority] ?? 'bg-gray-100 text-gray-600'}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-500',
  };

  const labels: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
  };

  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[status] ?? status}
    </span>
  );
}
