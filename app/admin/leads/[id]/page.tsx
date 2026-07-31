'use client';

import {
  PiArrowsClockwiseBold,
  PiEnvelopeBold,
  PiMapPinBold,
  PiPhoneBold,
  PiUserBold,
} from 'react-icons/pi';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AdminPage,
  DetailPageHeader,
  SectionCard,
  StatusBadge,
  LoadingState,
  ErrorState,
  type StatusVariant,
} from '@/components/backend';
import { createClient } from '@/lib/supabase/client';
import { getLeadSlaBadge } from '@/lib/leads/sla-badge';

interface AssignedAdmin {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface AdminOption {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface CoverageLead {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  customer_type: string | null;
  status: string | null;
  lead_source: string | null;
  source_campaign: string | null;
  assigned_admin_id: string | null;
  assigned_admin?: AssignedAdmin | null;
  follow_up_notes: string | null;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  follow_up_count: number | null;
  first_response_due_at: string | null;
  first_responded_at: string | null;
  zoho_lead_id: string | null;
  zoho_sync_status: string | null;
  zoho_sync_error: string | null;
  zoho_synced_at: string | null;
  address: string | null;
  suburb: string | null;
  city: string | null;
  province: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

const LEAD_STATUSES = [
  'new',
  'contacted',
  'interested',
  'not_interested',
  'coverage_available',
  'converted_to_order',
  'lost',
  'follow_up_scheduled',
] as const;

function formatStatusLabel(status: string | null | undefined): string {
  if (!status) return '—';
  return status.replace(/_/g, ' ');
}

function getLeadStatusVariant(status: string | null): StatusVariant {
  const s = (status || '').toLowerCase();
  if (s === 'new') return 'info';
  if (s === 'contacted' || s === 'follow_up_scheduled' || s === 'interested') return 'warning';
  if (s === 'converted_to_order' || s === 'coverage_available') return 'success';
  if (s === 'lost' || s === 'not_interested') return 'error';
  return 'neutral';
}

function getZohoVariant(status: string | null): StatusVariant {
  const s = (status || '').toLowerCase();
  if (s === 'synced' || s === 'success') return 'success';
  if (s === 'pending' || s === 'queued') return 'warning';
  if (s === 'error' || s === 'failed') return 'error';
  if (!s) return 'neutral';
  return 'info';
}

function displayName(lead: CoverageLead): string {
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim();
  if (name) return name;
  if (lead.company_name) return lead.company_name;
  if (lead.email) return lead.email;
  return 'Lead';
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    return format(new Date(value), 'dd MMM yyyy HH:mm');
  } catch {
    return value;
  }
}

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 break-words">{value ?? '—'}</dd>
    </div>
  );
}

export default function AdminLeadDetailPage() {
  const params = useParams();
  const leadId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [lead, setLead] = useState<CoverageLead | null>(null);
  const [admins, setAdmins] = useState<AdminOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('new');
  const [assignedAdminId, setAssignedAdminId] = useState<string>('unassigned');
  const [nextFollowUp, setNextFollowUp] = useState('');

  const fetchLead = useCallback(async () => {
    if (!leadId) {
      setError('Invalid lead id');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/leads/${leadId}`, {
        credentials: 'include',
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch lead');
      }

      const data = result.lead as CoverageLead;
      setLead(data);
      setNotes(data.follow_up_notes || '');
      setStatus(data.status || 'new');
      setAssignedAdminId(data.assigned_admin_id || 'unassigned');
      setNextFollowUp(toDatetimeLocalValue(data.next_follow_up_at));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lead');
      setLead(null);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  const fetchAdmins = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error: adminsError } = await supabase
        .from('admin_users')
        .select('id, full_name, email')
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (adminsError) {
        console.warn('[Lead detail] Failed to load admin_users:', adminsError.message);
        return;
      }

      setAdmins(
        (data || []).map((a) => ({
          id: a.id,
          full_name: a.full_name,
          email: a.email,
        }))
      );
    } catch (err) {
      console.warn('[Lead detail] admin_users fetch error', err);
    }
  }, []);

  useEffect(() => {
    fetchLead();
    fetchAdmins();
  }, [fetchLead, fetchAdmins]);

  const handleSave = async () => {
    if (!leadId) return;

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        follow_up_notes: notes,
        status,
        assigned_admin_id: assignedAdminId === 'unassigned' ? null : assignedAdminId,
        next_follow_up_at: nextFollowUp
          ? new Date(nextFollowUp).toISOString()
          : null,
      };

      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save lead');
      }

      const data = result.lead as CoverageLead;
      setLead(data);
      setNotes(data.follow_up_notes || '');
      setStatus(data.status || 'new');
      setAssignedAdminId(data.assigned_admin_id || 'unassigned');
      setNextFollowUp(toDatetimeLocalValue(data.next_follow_up_at));
      toast.success('Lead updated');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed';
      toast.error(message);
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminPage>
        <LoadingState message="Loading lead…" />
      </AdminPage>
    );
  }

  if (error && !lead) {
    return (
      <AdminPage>
        <ErrorState title="Could not load lead" message={error} onRetry={fetchLead} />
      </AdminPage>
    );
  }

  if (!lead) {
    return (
      <AdminPage>
        <ErrorState title="Lead not found" message="This lead does not exist or was removed." />
      </AdminPage>
    );
  }

  const sla = getLeadSlaBadge(lead);
  const title = displayName(lead);
  const addressParts = [lead.address, lead.suburb, lead.city, lead.province]
    .filter(Boolean)
    .join(', ');

  return (
    <AdminPage>
      <DetailPageHeader
        breadcrumbs={[
          { label: 'Leads', href: '/admin/leads' },
          { label: title },
        ]}
        title={title}
        subtitle={lead.company_name && title !== lead.company_name ? lead.company_name : undefined}
        status={{
          label: formatStatusLabel(lead.status),
          variant: getLeadStatusVariant(lead.status),
        }}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={sla.status} variant={sla.variant} showDot />
            <Button variant="outline" size="sm" onClick={fetchLead} disabled={loading || saving}>
              <PiArrowsClockwiseBold className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Refresh
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        }
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Contact" icon={PiUserBold}>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First name" value={lead.first_name || '—'} />
              <Field label="Last name" value={lead.last_name || '—'} />
              <Field
                label="Email"
                value={
                  lead.email ? (
                    <a
                      href={`mailto:${lead.email}`}
                      className="inline-flex items-center gap-1 text-circleTel-orange hover:underline"
                    >
                      <PiEnvelopeBold className="h-3.5 w-3.5" aria-hidden="true" />
                      {lead.email}
                    </a>
                  ) : (
                    '—'
                  )
                }
              />
              <Field
                label="Phone"
                value={
                  lead.phone ? (
                    <a
                      href={`tel:${lead.phone}`}
                      className="inline-flex items-center gap-1 text-circleTel-orange hover:underline"
                    >
                      <PiPhoneBold className="h-3.5 w-3.5" aria-hidden="true" />
                      {lead.phone}
                    </a>
                  ) : (
                    '—'
                  )
                }
              />
              <Field label="Company" value={lead.company_name || '—'} />
              <Field label="Customer type" value={lead.customer_type || '—'} />
              <Field
                label="Address"
                value={
                  addressParts ? (
                    <span className="inline-flex items-start gap-1">
                      <PiMapPinBold className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" aria-hidden="true" />
                      {addressParts}
                    </span>
                  ) : (
                    '—'
                  )
                }
              />
            </dl>
          </SectionCard>

          <SectionCard title="Follow-up">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="follow_up_notes">Notes</Label>
                <Textarea
                  id="follow_up_notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                  placeholder="Log contact attempts, interest, next steps…"
                  className="resize-y"
                />
                <p className="text-xs text-gray-500">
                  Saving notes while status is new stamps first response and increments follow-up
                  count.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {formatStatusLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assigned_admin">Assigned owner</Label>
                  <Select value={assignedAdminId} onValueChange={setAssignedAdminId}>
                    <SelectTrigger id="assigned_admin">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {admins.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.full_name || a.email || a.id}
                        </SelectItem>
                      ))}
                      {/* Keep current assignee visible if not in active list */}
                      {assignedAdminId !== 'unassigned' &&
                        !admins.some((a) => a.id === assignedAdminId) && (
                          <SelectItem value={assignedAdminId}>
                            {lead.assigned_admin?.full_name ||
                              lead.assigned_admin?.email ||
                              assignedAdminId}
                          </SelectItem>
                        )}
                    </SelectContent>
                  </Select>
                  {admins.length === 0 && (
                    <p className="text-xs text-amber-700">
                      Could not load admin list (RLS). You can still save status/notes; reassign may
                      need elevated access.
                    </p>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="next_follow_up_at">Next follow-up</Label>
                  <Input
                    id="next_follow_up_at"
                    type="datetime-local"
                    value={nextFollowUp}
                    onChange={(e) => setNextFollowUp(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <SectionCard title="SLA & activity" compact>
            <dl className="space-y-3">
              <Field
                label="SLA"
                value={<StatusBadge status={sla.status} variant={sla.variant} showDot />}
              />
              <Field label="First response due" value={formatDateTime(lead.first_response_due_at)} />
              <Field label="First responded" value={formatDateTime(lead.first_responded_at)} />
              <Field label="Last contacted" value={formatDateTime(lead.last_contacted_at)} />
              <Field label="Follow-up count" value={lead.follow_up_count ?? 0} />
              <Field
                label="Created"
                value={
                  lead.created_at
                    ? `${formatDateTime(lead.created_at)} (${formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })})`
                    : '—'
                }
              />
              <Field label="Updated" value={formatDateTime(lead.updated_at)} />
            </dl>
          </SectionCard>

          <SectionCard title="Source" compact>
            <dl className="space-y-3">
              <Field
                label="Lead source"
                value={lead.lead_source?.replace(/_/g, ' ') || '—'}
              />
              <Field label="Campaign" value={lead.source_campaign || '—'} />
            </dl>
          </SectionCard>

          <SectionCard title="Zoho (read-only)" compact>
            <dl className="space-y-3">
              <Field
                label="Sync status"
                value={
                  <StatusBadge
                    status={lead.zoho_sync_status || 'none'}
                    variant={getZohoVariant(lead.zoho_sync_status)}
                  />
                }
              />
              <Field label="Zoho lead id" value={lead.zoho_lead_id || '—'} />
              <Field label="Synced at" value={formatDateTime(lead.zoho_synced_at)} />
              {lead.zoho_sync_error && (
                <Field
                  label="Sync error"
                  value={<span className="text-red-700 text-xs">{lead.zoho_sync_error}</span>}
                />
              )}
            </dl>
          </SectionCard>

          <SectionCard title="System" compact>
            <dl className="space-y-3">
              <Field
                label="Lead id"
                value={<code className="text-xs break-all">{lead.id}</code>}
              />
            </dl>
          </SectionCard>
        </div>
      </div>
    </AdminPage>
  );
}
