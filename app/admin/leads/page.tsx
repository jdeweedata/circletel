'use client';

import {
  PiArrowsClockwiseBold,
  PiMagnifyingGlassBold,
  PiPhoneBold,
  PiUserBold,
  PiWarningCircleBold,
} from 'react-icons/pi';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AdminPage,
  PageHeader,
  StatusBadge,
  LoadingState,
  EmptyState,
  type StatusVariant,
} from '@/components/backend';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getLeadSlaBadge } from '@/lib/leads/sla-badge';

interface AssignedAdmin {
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
  status: string | null;
  lead_source: string | null;
  assigned_admin_id: string | null;
  assigned_admin?: AssignedAdmin | AssignedAdmin[] | null;
  first_response_due_at: string | null;
  first_responded_at: string | null;
  zoho_sync_status: string | null;
  created_at: string;
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

function ownerName(lead: CoverageLead): string {
  const admin = Array.isArray(lead.assigned_admin)
    ? lead.assigned_admin[0]
    : lead.assigned_admin;
  if (admin?.full_name) return admin.full_name;
  if (admin?.email) return admin.email;
  return lead.assigned_admin_id ? 'Assigned' : 'Unassigned';
}

function leadDisplayName(lead: CoverageLead): string {
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim();
  if (name) return name;
  if (lead.company_name) return lead.company_name;
  if (lead.email) return lead.email;
  return 'Unknown';
}

function formatStatusLabel(status: string | null): string {
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

export default function AdminLeadsQueuePage() {
  const router = useRouter();
  const { user } = useAdminAuth();

  const [leads, setLeads] = useState<CoverageLead[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('offset', String(offset));

      if (search) params.set('q', search);
      if (overdueOnly) {
        params.set('overdue', 'true');
      } else if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      if (ownerFilter === 'unassigned') {
        params.set('assigned_admin_id', 'unassigned');
      } else if (ownerFilter === 'mine' && user?.id) {
        params.set('assigned_admin_id', user.id);
      }

      const response = await fetch(`/api/admin/leads?${params.toString()}`, {
        credentials: 'include',
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch leads');
      }

      setLeads(Array.isArray(result.leads) ? result.leads : []);
      setTotalCount(typeof result.total_count === 'number' ? result.total_count : 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leads');
      setLeads([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [offset, search, statusFilter, ownerFilter, overdueOnly, user?.id]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const overdueCount = useMemo(
    () =>
      leads.filter((l) => getLeadSlaBadge(l).status === 'Overdue').length,
    [leads]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    setSearch(searchInput.trim());
  };

  const pageStart = totalCount === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + limit, totalCount);
  const hasPrev = offset > 0;
  const hasNext = offset + limit < totalCount;

  return (
    <AdminPage>
      <PageHeader
        title="Leads"
        subtitle="Coverage lead follow-up queue — first-response SLA (not Zoho Desk support)"
        actions={
          <Button onClick={fetchLeads} disabled={loading} variant="outline" size="sm">
            <PiArrowsClockwiseBold
              className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            Refresh
          </Button>
        }
      />

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <div className="relative">
              <PiMagnifyingGlassBold
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                aria-hidden="true"
              />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Name, phone, email…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="w-[160px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setOffset(0);
                if (v !== 'all') setOverdueOnly(false);
              }}
              disabled={overdueOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {LEAD_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {formatStatusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[160px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Owner</label>
            <Select
              value={ownerFilter}
              onValueChange={(v) => {
                setOwnerFilter(v);
                setOffset(0);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All owners" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All owners</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="mine" disabled={!user?.id}>
                  Mine
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" size="sm">
            Search
          </Button>

          <Button
            type="button"
            size="sm"
            variant={overdueOnly ? 'default' : 'outline'}
            onClick={() => {
              setOverdueOnly((v) => !v);
              setOffset(0);
              if (!overdueOnly) setStatusFilter('all');
            }}
            className={overdueOnly ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            <PiWarningCircleBold className="h-4 w-4 mr-1.5" aria-hidden="true" />
            Overdue only
            {overdueCount > 0 && !overdueOnly ? (
              <span className="ml-1.5 text-xs opacity-80">({overdueCount} on page)</span>
            ) : null}
          </Button>
        </form>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {loading
              ? 'Loading…'
              : totalCount === 0
                ? 'No leads'
                : `Showing ${pageStart}–${pageEnd} of ${totalCount}`}
          </p>
        </div>

        {loading ? (
          <LoadingState message="Loading leads…" />
        ) : leads.length === 0 ? (
          <EmptyState
            icon={<PiUserBold />}
            title="No leads found"
            description="Try clearing filters or waiting for new coverage / WhatsApp leads."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Zoho</TableHead>
                  <TableHead>SLA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => {
                  const sla = getLeadSlaBadge(lead);
                  return (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/admin/leads/${lead.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[140px]">
                          <PiUserBold className="h-4 w-4 text-gray-400 shrink-0" aria-hidden="true" />
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {leadDisplayName(lead)}
                            </p>
                            {lead.email && (
                              <p className="text-xs text-gray-500 truncate max-w-[180px]">
                                {lead.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {lead.phone ? (
                          <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                            <PiPhoneBold className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                            {lead.phone}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700">
                          {lead.lead_source?.replace(/_/g, ' ') || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={formatStatusLabel(lead.status)}
                          variant={getLeadStatusVariant(lead.status)}
                        />
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                        {lead.created_at
                          ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })
                          : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {ownerName(lead)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={lead.zoho_sync_status || 'none'}
                          variant={getZohoVariant(lead.zoho_sync_status)}
                        />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={sla.status} variant={sla.variant} showDot />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {totalCount > limit && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPrev || loading}
              onClick={() => setOffset(Math.max(0, offset - limit))}
            >
              Previous
            </Button>
            <span className="text-xs text-gray-500">
              Page {Math.floor(offset / limit) + 1} of {Math.ceil(totalCount / limit)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNext || loading}
              onClick={() => setOffset(offset + limit)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </AdminPage>
  );
}
