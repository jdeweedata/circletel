'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  PiMagnifyingGlassBold,
  PiUserBold,
  PiWifiHighBold,
  PiWifiSlashBold,
  PiBuildingsBold,
  PiUserCircleBold,
  PiEnvelopeBold,
  PiPhoneBold,
  PiMapPinBold,
  PiCaretRightBold,
  PiDevicesBold,
  PiArrowsClockwiseBold,
  PiWarningCircleBold,
  PiCurrencyDollarBold,
  PiFunnelBold,
  PiXBold,
  PiCaretDownBold,
} from 'react-icons/pi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { StatCard } from '@/components/admin/shared/StatCard';
import { SectionCard } from '@/components/admin/shared/SectionCard';
import { UnderlineTabs, TabPanel } from '@/components/admin/shared/UnderlineTabs';
import type { NetworkDevice, NetworkDeviceStats, DeviceType, DeviceChannel, DeviceStatus } from '@/lib/network/types';
import { DEVICE_TYPE_LABELS, DEVICE_TYPE_COLORS, CHANNEL_LABELS, STATUS_COLORS } from '@/lib/network/types';

// =============================================================================
// Customer Search Types (kept from original page)
// =============================================================================

interface Customer {
  id: string;
  type: 'consumer' | 'corporate';
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface CustomerDevice {
  sn: string;
  device_name: string;
  model: string | null;
  status: string;
  group_name: string | null;
  online_clients: number;
  synced_at: string;
}

// =============================================================================
// Helpers
// =============================================================================

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

const formatCurrency = (value: number) => `R${Number(value).toLocaleString()}`;

const TABS = [
  { id: 'inventory', label: 'All Devices' },
  { id: 'sites', label: 'By Site' },
  { id: 'search', label: 'Customer Search' },
] as const;

function getEffectiveStatus(device: NetworkDevice): string {
  if (device.device_type === 'ruijie_ap' && device.ruijie_status) {
    return device.ruijie_status;
  }
  return device.status;
}

function statusDotColor(status: string): string {
  switch (status) {
    case 'active': case 'online': case 'deployed': return 'bg-emerald-500';
    case 'signal_issues': return 'bg-amber-500';
    case 'offline': return 'bg-slate-400';
    case 'pending': return 'bg-yellow-500';
    case 'reserved': return 'bg-indigo-400';
    default: return 'bg-red-400';
  }
}

// =============================================================================
// Page Component
// =============================================================================

export default function NetworkInventoryPage() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [stats, setStats] = useState<NetworkDeviceStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Site tab filters
  const [siteFilterProvince, setSiteFilterProvince] = useState('all');
  const [siteFilterChannel, setSiteFilterChannel] = useState('all');
  const [siteFilterStatus, setSiteFilterStatus] = useState('all');
  const [siteViewMode, setSiteViewMode] = useState<'cards' | 'table'>('table');

  // Customer search state (tab 3)
  const [custQuery, setCustQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [custDevices, setCustDevices] = useState<CustomerDevice[]>([]);
  const [custLoading, setCustLoading] = useState(false);
  const [custSearchPerformed, setCustSearchPerformed] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, []);

  async function fetchDevices() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType) params.set('type', filterType);
      if (filterChannel) params.set('channel', filterChannel);
      if (filterStatus) params.set('status', filterStatus);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/admin/network/devices?${params}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setDevices(json.devices ?? []);
        setStats(json.stats ?? null);
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setLoading(false);
    }
  }

  // Re-fetch when filters change
  useEffect(() => {
    fetchDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterChannel, filterStatus]);

  const handleSearch = () => {
    fetchDevices();
  };

  const clearFilters = () => {
    setFilterType('');
    setFilterChannel('');
    setFilterStatus('');
    setSearchQuery('');
  };

  const hasActiveFilters = filterType || filterChannel || filterStatus || searchQuery;

  // Group devices by site
  const devicesBySite = useMemo(() => {
    const grouped: Record<string, NetworkDevice[]> = {};
    for (const d of devices) {
      const site = d.site_name || 'Unassigned';
      if (!grouped[site]) grouped[site] = [];
      grouped[site].push(d);
    }
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [devices]);

  // Unique provinces for site filter
  const uniqueProvinces = useMemo(() => {
    const provinces = new Set<string>();
    for (const d of devices) {
      if (d.province) provinces.add(d.province);
    }
    return Array.from(provinces).sort();
  }, [devices]);

  // Filtered sites
  const filteredSites = useMemo(() => {
    return devicesBySite.filter(([, siteDevices]) => {
      if (siteFilterProvince !== 'all' && !siteDevices.some(d => d.province === siteFilterProvince)) return false;
      if (siteFilterChannel !== 'all' && !siteDevices.some(d => d.channel === siteFilterChannel)) return false;
      if (siteFilterStatus === 'issues' && !siteDevices.some(d => d.status === 'signal_issues')) return false;
      if (siteFilterStatus === 'active' && !siteDevices.some(d => d.status === 'active' || d.status === 'deployed')) return false;
      if (siteFilterStatus === 'offline' && !siteDevices.some(d => d.status === 'offline')) return false;
      return true;
    });
  }, [devicesBySite, siteFilterProvince, siteFilterChannel, siteFilterStatus]);

  // Flat list of devices for table view (from filtered sites)
  const flatSiteDevices = useMemo(() => {
    return filteredSites.flatMap(([, siteDevices]) => siteDevices);
  }, [filteredSites]);

  const siteHasActiveFilters = siteFilterProvince !== 'all' || siteFilterChannel !== 'all' || siteFilterStatus !== 'all';

  const clearSiteFilters = () => {
    setSiteFilterProvince('all');
    setSiteFilterChannel('all');
    setSiteFilterStatus('all');
  };

  // Customer search handlers
  const handleCustSearch = async () => {
    if (!custQuery.trim()) return;
    setCustLoading(true);
    setCustSearchPerformed(true);
    try {
      const res = await fetch(`/api/admin/search/customers?q=${encodeURIComponent(custQuery)}`, { credentials: 'include' });
      const data = await res.json();
      setCustomers(data.results || []);
      setSelectedCustomer(null);
      setCustDevices([]);
    } finally {
      setCustLoading(false);
    }
  };

  const handleSelectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}/devices?type=${customer.type}`, { credentials: 'include' });
      const data = await res.json();
      setCustDevices(data.devices || []);
    } finally {
      setCustLoading(false);
    }
  };

  // Stat computations
  const onlineCount = stats ? (stats.by_status['active'] ?? 0) + (stats.by_status['deployed'] ?? 0) : 0;
  const issueCount = stats?.by_status['signal_issues'] ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 -m-6 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link href="/admin" className="hover:text-slate-700">Admin</Link>
          <PiCaretRightBold className="w-3 h-3" />
          <Link href="/admin/support" className="hover:text-slate-700">Support</Link>
          <PiCaretRightBold className="w-3 h-3" />
          <span className="text-slate-900">Network Inventory</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Network Inventory</h1>
            <p className="text-slate-500 mt-1">All deployed devices across Tarana FWB, Arlan 5G/LTE, and Ruijie WiFi</p>
          </div>
          <Button variant="outline" onClick={fetchDevices} disabled={loading}>
            <PiArrowsClockwiseBold className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Devices"
            value={String(stats.total)}
            icon={<PiDevicesBold className="w-5 h-5" />}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            subtitle={`${stats.by_type['tarana_router'] ?? 0} Tarana, ${stats.by_type['tozed_cpe'] ?? 0} Tozed, ${stats.by_type['ruijie_ap'] ?? 0} AP`}
          />
          <StatCard
            label="Online / Active"
            value={String(onlineCount)}
            icon={<PiWifiHighBold className="w-5 h-5" />}
            iconBgColor="bg-emerald-100"
            iconColor="text-emerald-600"
          />
          <StatCard
            label="Signal Issues"
            value={String(issueCount)}
            icon={<PiWarningCircleBold className="w-5 h-5" />}
            iconBgColor={issueCount > 0 ? 'bg-amber-100' : 'bg-slate-100'}
            iconColor={issueCount > 0 ? 'text-amber-600' : 'text-slate-400'}
          />
          <StatCard
            label="Monthly Cost"
            value={formatCurrency(stats.total_monthly_cost)}
            icon={<PiCurrencyDollarBold className="w-5 h-5" />}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
            subtitle="Wholesale + Arlan lines"
          />
        </div>
      )}

      {/* Tabs */}
      <UnderlineTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} className="mb-6" />

      {/* ============================================================= */}
      {/* ALL DEVICES TAB */}
      {/* ============================================================= */}
      <TabPanel id="inventory" activeTab={activeTab} className="space-y-4">
        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <PiFunnelBold className="w-4 h-4" />
            Filters:
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="">All Types</option>
            <option value="tarana_router">Tarana Router</option>
            <option value="tozed_cpe">Tozed 5G CPE</option>
            <option value="ruijie_ap">Ruijie AP</option>
            <option value="sim_card">SIM Card</option>
          </select>
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="">All Channels</option>
            <option value="mtn_wholesale">MTN Wholesale</option>
            <option value="arlan">Arlan MTN</option>
            <option value="internal">Internal</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="deployed">Deployed</option>
            <option value="offline">Offline</option>
            <option value="signal_issues">Signal Issues</option>
            <option value="pending">Pending</option>
            <option value="reserved">Reserved</option>
          </select>
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search serial, name, site, PPPoE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <PiXBold className="w-3 h-3 mr-1" /> Clear
            </Button>
          )}
        </div>

        {/* Device Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : devices.length === 0 ? (
            <div className="p-12 text-center">
              <PiDevicesBold className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No devices found</p>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearFilters} className="mt-2">Clear filters</Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-4 py-3 text-slate-500 font-medium w-8"></th>
                    <th className="px-4 py-3 text-slate-500 font-medium">Device</th>
                    <th className="px-4 py-3 text-slate-500 font-medium">Type</th>
                    <th className="px-4 py-3 text-slate-500 font-medium">Serial Number</th>
                    <th className="px-4 py-3 text-slate-500 font-medium">Site</th>
                    <th className="px-4 py-3 text-slate-500 font-medium">Channel</th>
                    <th className="px-4 py-3 text-slate-500 font-medium">PPPoE / SIM</th>
                    <th className="px-4 py-3 text-slate-500 font-medium">Customer</th>
                    <th className="px-4 py-3 text-slate-500 font-medium text-right">Cost</th>
                    <th className="px-4 py-3 text-slate-500 font-medium w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {devices.map((device) => {
                    const effectiveStatus = getEffectiveStatus(device);
                    const detailHref = device.ruijie_device_sn
                      ? `/admin/network/devices/${device.ruijie_device_sn}`
                      : undefined;
                    return (
                      <tr key={device.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`w-2.5 h-2.5 rounded-full inline-block ${statusDotColor(effectiveStatus)}`}
                            title={effectiveStatus} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{device.device_name}</div>
                          {device.signal_notes && (
                            <div className="text-xs text-amber-600 mt-0.5">{device.signal_notes}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={DEVICE_TYPE_COLORS[device.device_type]}>
                            {DEVICE_TYPE_LABELS[device.device_type]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-slate-600">
                            {device.serial_number.length > 20
                              ? device.serial_number.slice(0, 20) + '...'
                              : device.serial_number}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{device.site_name || '—'}</td>
                        <td className="px-4 py-3">
                          {device.channel ? (
                            <span className="text-xs text-slate-600">{CHANNEL_LABELS[device.channel]}</span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-slate-500">
                            {device.pppoe_username
                              ? device.pppoe_username.replace('@circletel.co.za', '')
                              : device.sim_number || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {device.customer_name ? (
                            <Link
                              href={`/admin/orders/${device.consumer_order_id}`}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              {device.customer_name}
                            </Link>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700">
                          {device.monthly_cost ? formatCurrency(device.monthly_cost) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {detailHref ? (
                            <Link href={detailHref} className="text-slate-400 hover:text-slate-600">
                              <PiCaretRightBold className="w-4 h-4" />
                            </Link>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loading && devices.length > 0 && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-sm text-slate-500">
              Showing {devices.length} device{devices.length !== 1 ? 's' : ''}
              {hasActiveFilters ? ' (filtered)' : ''}
            </div>
          )}
        </div>
      </TabPanel>

      {/* ============================================================= */}
      {/* BY SITE TAB */}
      {/* ============================================================= */}
      <TabPanel id="sites" activeTab={activeTab} className="space-y-4">
        {/* Site Filters Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <PiFunnelBold className="w-4 h-4" />
            Filter:
          </div>

          <Select value={siteFilterProvince} onValueChange={setSiteFilterProvince}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder="Province" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Provinces</SelectItem>
              {uniqueProvinces.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={siteFilterChannel} onValueChange={setSiteFilterChannel}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="mtn_wholesale">MTN Wholesale</SelectItem>
              <SelectItem value="arlan">Arlan MTN</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
            </SelectContent>
          </Select>

          <Select value={siteFilterStatus} onValueChange={setSiteFilterStatus}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="issues">Signal Issues</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>

          {siteHasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearSiteFilters}>
              <PiXBold className="w-3 h-3 mr-1" /> Clear
            </Button>
          )}

          <div className="ml-auto flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setSiteViewMode('table')}
              className={`px-3 py-1.5 text-sm ${siteViewMode === 'table' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              Table
            </button>
            <button
              onClick={() => setSiteViewMode('cards')}
              className={`px-3 py-1.5 text-sm ${siteViewMode === 'cards' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              Cards
            </button>
          </div>
        </div>

        {/* Summary bar */}
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span>{filteredSites.length} site{filteredSites.length !== 1 ? 's' : ''}</span>
          <span className="text-slate-300">|</span>
          <span>{flatSiteDevices.length} device{flatSiteDevices.length !== 1 ? 's' : ''}</span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {flatSiteDevices.filter(d => d.status === 'signal_issues').length} with issues
          </span>
          <span className="text-slate-300">|</span>
          <span>{formatCurrency(flatSiteDevices.reduce((sum, d) => sum + (Number(d.monthly_cost) || 0), 0))}/mo</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filteredSites.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <PiMapPinBold className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No sites match your filters</p>
            {siteHasActiveFilters && (
              <Button variant="link" onClick={clearSiteFilters} className="mt-2">Clear filters</Button>
            )}
          </div>
        ) : siteViewMode === 'table' ? (
          /* ---- TABLE VIEW ---- */
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Province</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Technology</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>PPPoE / SIM</TableHead>
                  <TableHead>Signal Notes</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flatSiteDevices.map((device) => {
                  const effectiveStatus = getEffectiveStatus(device);
                  const detailHref = device.ruijie_device_sn
                    ? `/admin/network/devices/${device.ruijie_device_sn}`
                    : undefined;
                  return (
                    <TableRow key={device.id}>
                      <TableCell>
                        <span className={`w-2.5 h-2.5 rounded-full inline-block ${statusDotColor(effectiveStatus)}`} title={effectiveStatus} />
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {device.site_name || '—'}
                      </TableCell>
                      <TableCell className="text-slate-600">{device.province || '—'}</TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-800">{device.device_name}</div>
                        <div className="text-xs font-mono text-slate-400">{device.serial_number.length > 16 ? device.serial_number.slice(0, 16) + '…' : device.serial_number}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${DEVICE_TYPE_COLORS[device.device_type]}`}>
                          {DEVICE_TYPE_LABELS[device.device_type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 text-xs">{device.technology || '—'}</TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {device.channel ? CHANNEL_LABELS[device.channel] : '—'}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-slate-500">
                          {device.pppoe_username
                            ? device.pppoe_username.replace('@circletel.co.za', '')
                            : device.sim_number || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {device.signal_notes ? (
                          <span className="text-xs text-amber-600">{device.signal_notes}</span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-slate-700">
                        {device.monthly_cost ? formatCurrency(device.monthly_cost) : '—'}
                      </TableCell>
                      <TableCell>
                        {detailHref ? (
                          <Link href={detailHref} className="text-slate-400 hover:text-blue-600">
                            <PiCaretRightBold className="w-4 h-4" />
                          </Link>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* ---- CARDS VIEW ---- */
          <div className="space-y-4">
            {filteredSites.map(([siteName, siteDevices]) => {
              const hasIssues = siteDevices.some(d => d.status === 'signal_issues');
              const siteProvince = siteDevices[0]?.province;
              const siteTech = [...new Set(siteDevices.map(d => d.technology).filter(Boolean))].join(', ');
              const siteCost = siteDevices.reduce((sum, d) => sum + (Number(d.monthly_cost) || 0), 0);

              return (
                <div key={siteName} className={`bg-white rounded-xl border ${hasIssues ? 'border-amber-200' : 'border-slate-200'} overflow-hidden`}>
                  <div className={`px-4 py-3 flex items-center justify-between ${hasIssues ? 'bg-amber-50' : 'bg-slate-50'} border-b border-slate-100`}>
                    <div className="flex items-center gap-3">
                      <PiMapPinBold className={`w-5 h-5 ${hasIssues ? 'text-amber-600' : 'text-slate-500'}`} />
                      <div>
                        <h3 className="font-semibold text-slate-900">{siteName}</h3>
                        <p className="text-xs text-slate-500">
                          {siteProvince}{siteTech ? ` · ${siteTech}` : ''}
                          {' · '}{siteDevices.length} device{siteDevices.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      {hasIssues && (
                        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                          <PiWarningCircleBold className="w-3 h-3 mr-1" />
                          Signal Issues
                        </Badge>
                      )}
                    </div>
                    {siteCost > 0 && (
                      <span className="text-sm text-slate-500">{formatCurrency(siteCost)}/mo</span>
                    )}
                  </div>
                  <div className="divide-y divide-slate-50">
                    {siteDevices.map((device) => {
                      const effectiveStatus = getEffectiveStatus(device);
                      return (
                        <div key={device.id} className="px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full ${statusDotColor(effectiveStatus)}`} />
                            <div>
                              <span className="text-sm font-medium text-slate-700">{device.device_name}</span>
                              {device.signal_notes && (
                                <span className="text-xs text-amber-600 ml-2">{device.signal_notes}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className={`text-xs ${DEVICE_TYPE_COLORS[device.device_type]}`}>
                              {DEVICE_TYPE_LABELS[device.device_type]}
                            </Badge>
                            <span className="text-xs font-mono text-slate-400">
                              {device.pppoe_username
                                ? device.pppoe_username.replace('@circletel.co.za', '')
                                : device.sim_number
                                ? `SIM ${device.sim_number.slice(-4)}`
                                : device.serial_number.slice(0, 12)}
                            </span>
                            {device.ruijie_device_sn && (
                              <Link
                                href={`/admin/network/devices/${device.ruijie_device_sn}`}
                                className="text-slate-400 hover:text-blue-600"
                              >
                                <PiCaretRightBold className="w-4 h-4" />
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </TabPanel>

      {/* ============================================================= */}
      {/* CUSTOMER SEARCH TAB (preserved from original page) */}
      {/* ============================================================= */}
      <TabPanel id="search" activeTab={activeTab} className="space-y-6">
        {/* Search Input */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search by customer name, email, or phone number..."
                  value={custQuery}
                  onChange={(e) => setCustQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustSearch()}
                  className="pl-10 h-11"
                />
              </div>
              <Button onClick={handleCustSearch} disabled={custLoading || !custQuery.trim()} className="h-11 px-6">
                {custLoading ? (
                  <PiArrowsClockwiseBold className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <PiMagnifyingGlassBold className="w-4 h-4 mr-2" />
                )}
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Customer + Device Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer List */}
          <div className="lg:col-span-1">
            <Card>
              <div className="p-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <PiUserBold className="w-5 h-5 text-slate-600" />
                  Customers
                  {customers.length > 0 && <Badge variant="secondary" className="ml-auto">{customers.length}</Badge>}
                </h2>
              </div>
              <CardContent className="p-0">
                {!custSearchPerformed ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <PiMagnifyingGlassBold className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">Search for a customer</p>
                    <p className="text-sm text-slate-400 mt-1">Enter a name, email, or phone number above</p>
                  </div>
                ) : customers.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-slate-500 font-medium">No customers found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                    {customers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className={`w-full text-left p-4 transition-colors ${
                          selectedCustomer?.id === customer.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900 truncate">{customer.name}</p>
                            {customer.email && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <PiEnvelopeBold className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span className="text-sm text-slate-500 truncate">{customer.email}</span>
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <PiPhoneBold className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span className="text-sm text-slate-500">{customer.phone}</span>
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className={
                            customer.type === 'corporate' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-purple-50 text-purple-700 border-purple-200'
                          }>
                            {customer.type === 'consumer' ? 'Consumer' : 'Corporate'}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Device List */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <PiWifiHighBold className="w-5 h-5 text-slate-600" />
                  Linked Devices
                  {selectedCustomer && custDevices.length > 0 && <Badge variant="secondary">{custDevices.length}</Badge>}
                </h2>
                {selectedCustomer && (
                  <p className="text-sm text-slate-500 mt-1">
                    Devices for <span className="font-medium text-slate-700">{selectedCustomer.name}</span>
                  </p>
                )}
              </div>
              <CardContent className="p-0">
                {!selectedCustomer ? (
                  <div className="p-12 text-center">
                    <PiDevicesBold className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Select a customer</p>
                    <p className="text-sm text-slate-400 mt-1">Choose from the list to view linked devices</p>
                  </div>
                ) : custDevices.length === 0 ? (
                  <div className="p-12 text-center">
                    <PiWifiSlashBold className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No devices found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {custDevices.map((device) => (
                      <Link
                        key={device.sn}
                        href={`/admin/network/devices/${device.sn}`}
                        className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            device.status === 'online' ? 'bg-emerald-100' : 'bg-slate-100'
                          }`}>
                            {device.status === 'online' ? (
                              <PiWifiHighBold className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <PiWifiSlashBold className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 group-hover:text-blue-600">{device.device_name}</p>
                            <p className="text-sm text-slate-500">{device.model || 'Unknown'} · {device.sn}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <Badge variant="outline" className={
                              device.status === 'online' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                            }>
                              {device.status}
                            </Badge>
                            <p className="text-xs text-slate-400 mt-1">{device.online_clients} clients · {formatRelativeTime(device.synced_at)}</p>
                          </div>
                          <PiCaretRightBold className="w-5 h-5 text-slate-300 group-hover:text-slate-500" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </TabPanel>
    </div>
  );
}
