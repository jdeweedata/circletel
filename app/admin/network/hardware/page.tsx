'use client';

/**
 * Hardware → Location → Active Customer inventory
 * Hardware-first rows from v_hardware_installations (Ruijie / Interstellio / Tarana RN).
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PiArrowsClockwiseBold,
  PiHardDrivesBold,
  PiLinkBold,
  PiLinkBreakBold,
  PiMagnifyingGlassBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  LoadingState,
  ErrorState,
  StatCard,
} from '@/components/backend';

type HardwareSource = 'ruijie' | 'interstellio' | 'tarana';

interface HardwareRow {
  hardware_source: HardwareSource;
  hardware_id: string;
  hardware_label: string | null;
  hardware_model: string | null;
  hardware_status: string | null;
  last_seen_at: string | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  service_id: string | null;
  service_status: string | null;
  service_active: boolean | null;
  package_name: string | null;
  location_type: string | null;
  location_id: string | null;
  location_name: string | null;
  location_address: string | null;
  province: string | null;
  link_method: string | null;
}

interface ApiResponse {
  rows: HardwareRow[];
  totals: {
    total: number;
    linked: number;
    unlinked: number;
    by_source: Record<HardwareSource, number>;
  };
}

const SOURCE_LABEL: Record<HardwareSource, string> = {
  ruijie: 'Ruijie',
  interstellio: 'Interstellio',
  tarana: 'Tarana RN',
};

function statusBadgeClass(status: string | null): string {
  const s = (status || '').toLowerCase();
  if (['online', 'enabled', 'active'].includes(s)) {
    return 'bg-green-50 text-green-700 border-green-200';
  }
  if (['offline', 'disabled', 'down'].includes(s)) {
    return 'bg-red-50 text-red-700 border-red-200';
  }
  if (['unknown', 'pending'].includes(s)) {
    return 'bg-gray-50 text-gray-600 border-gray-200';
  }
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

function detailHref(row: HardwareRow): string | null {
  if (row.hardware_source === 'ruijie') {
    return `/admin/network/devices/${encodeURIComponent(row.hardware_id)}`;
  }
  if (row.customer_id) {
    return `/admin/customers/${row.customer_id}`;
  }
  return null;
}

export default function HardwareInstallationsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [source, setSource] = useState<string>('all');
  const [linked, setLinked] = useState<string>('all');
  const [serviceStatus, setServiceStatus] = useState<string>('all');
  const [q, setQ] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const params = new URLSearchParams();
        if (source !== 'all') params.set('source', source);
        if (linked !== 'all') params.set('linked', linked);
        if (serviceStatus !== 'all') params.set('service_status', serviceStatus);
        if (q) params.set('q', q);

        const res = await fetch(
          `/api/admin/network/hardware-installations?${params.toString()}`,
          { credentials: 'include' }
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to load');
        }
        const json = (await res.json()) as ApiResponse;
        setData(json);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [source, linked, serviceStatus, q]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) {
    return (
      <AdminPage>
        <LoadingState message="Loading hardware inventory…" />
      </AdminPage>
    );
  }

  if (error && !data) {
    return (
      <AdminPage>
        <ErrorState
          title="Unable to load inventory"
          message={error}
          onRetry={() => fetchData()}
        />
      </AdminPage>
    );
  }

  const totals = data?.totals;
  const rows = data?.rows || [];

  return (
    <AdminPage>
      <PageHeader
        title="Hardware Installations"
        subtitle="Network hardware linked to locations and active customer services"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <PiArrowsClockwiseBold
              className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total hardware"
          value={totals?.total ?? 0}
          icon={<PiHardDrivesBold className="w-5 h-5" />}
        />
        <StatCard
          label="Linked to service"
          value={totals?.linked ?? 0}
          icon={<PiLinkBold className="w-5 h-5" />}
        />
        <StatCard
          label="Unlinked"
          value={totals?.unlinked ?? 0}
          icon={<PiLinkBreakBold className="w-5 h-5" />}
        />
        <StatCard
          label="By source"
          value={`${totals?.by_source.ruijie ?? 0} / ${totals?.by_source.interstellio ?? 0} / ${totals?.by_source.tarana ?? 0}`}
          subtitle="Ruijie / Interstellio / Tarana"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <form
          className="flex gap-2 flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            setQ(searchInput.trim());
          }}
        >
          <div className="relative flex-1">
            <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search serial, customer, location…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>

        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            <SelectItem value="ruijie">Ruijie</SelectItem>
            <SelectItem value="interstellio">Interstellio</SelectItem>
            <SelectItem value="tarana">Tarana RN</SelectItem>
          </SelectContent>
        </Select>

        <Select value={linked} onValueChange={setLinked}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Link" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All links</SelectItem>
            <SelectItem value="linked">Linked</SelectItem>
            <SelectItem value="unlinked">Unlinked</SelectItem>
          </SelectContent>
        </Select>

        <Select value={serviceStatus} onValueChange={setServiceStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Service status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any service</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Hardware</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Link</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500 py-10">
                  No hardware rows match these filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const href = detailHref(row);
                return (
                  <TableRow key={`${row.hardware_source}:${row.hardware_id}`}>
                    <TableCell>
                      <Badge variant="outline">
                        {SOURCE_LABEL[row.hardware_source]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {row.hardware_label || row.hardware_id}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {row.hardware_id}
                      </div>
                      {row.hardware_model && (
                        <div className="text-xs text-gray-400">{row.hardware_model}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusBadgeClass(row.hardware_status)}
                      >
                        {row.hardware_status || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {row.customer_name || row.customer_id ? (
                        <div>
                          {row.customer_id ? (
                            <Link
                              href={`/admin/customers/${row.customer_id}`}
                              className="text-circleTel-orange hover:underline font-medium"
                            >
                              {row.customer_name || 'Customer'}
                            </Link>
                          ) : (
                            <span className="font-medium">{row.customer_name}</span>
                          )}
                          {row.customer_email && (
                            <div className="text-xs text-gray-500">{row.customer_email}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Unlinked</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.service_id ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={statusBadgeClass(row.service_status)}
                            >
                              {row.service_status || '—'}
                            </Badge>
                            {row.service_active === false && (
                              <span className="text-xs text-amber-600">inactive flag</span>
                            )}
                          </div>
                          {row.package_name && (
                            <div className="text-xs text-gray-500 mt-1">{row.package_name}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No service</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.location_name || row.location_address ? (
                        <div>
                          <div className="font-medium text-sm">
                            {row.location_name || 'Location'}
                          </div>
                          {row.location_address && (
                            <div className="text-xs text-gray-500 line-clamp-2">
                              {row.location_address}
                            </div>
                          )}
                          {row.province && (
                            <div className="text-xs text-gray-400">{row.province}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No location</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.link_method ? (
                        <span className="text-xs font-mono text-gray-600">
                          {row.link_method}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">
                          Unlinked — map via install register
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {href ? (
                        <Link href={href}>
                          <Button variant="ghost" size="sm">
                            Open
                          </Button>
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </AdminPage>
  );
}
