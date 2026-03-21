'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  PiArrowLeftBold,
  PiArrowsClockwiseBold,
  PiBuildingsBold,
  PiCalendarBold,
  PiCheckCircleBold,
  PiClockBold,
  PiDownloadSimpleBold,
  PiEnvelopeBold,
  PiFileTextBold,
  PiGlobeBold,
  PiKeyBold,
  PiMagnifyingGlassBold,
  PiMapPinBold,
  PiPencilBold,
  PiPhoneBold,
  PiPlusBold,
  PiShieldBold,
  PiSparkleBold,
  PiTargetBold,
  PiUploadSimpleBold,
  PiUsersBold,
  PiWarningCircleBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { StatCard } from '@/components/admin/shared/StatCard';
import { SectionCard } from '@/components/admin/shared/SectionCard';
import { UnderlineTabs, TabPanel } from '@/components/admin/shared/UnderlineTabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// =============================================================================
// Types
// =============================================================================

interface CorporateAccount {
  id: string;
  corporateCode: string;
  companyName: string;
  tradingName?: string | null;
  registrationNumber?: string | null;
  vatNumber?: string | null;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone?: string | null;
  primaryContactPosition?: string | null;
  billingContactName?: string | null;
  billingContactEmail?: string | null;
  billingContactPhone?: string | null;
  technicalContactName?: string | null;
  technicalContactEmail?: string | null;
  technicalContactPhone?: string | null;
  physicalAddress?: { street?: string; city?: string; province?: string; postal_code?: string } | null;
  accountStatus: 'active' | 'suspended' | 'pending' | 'archived';
  totalSites: number;
  activeSites: number;
  pendingSites: number;
  industry?: string | null;
  expectedSites?: number | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CorporateSite {
  id: string;
  siteNumber: number;
  accountNumber: string;
  siteName: string;
  siteContactName?: string | null;
  siteContactPhone?: string | null;
  province?: string | null;
  status: string;
  pppoeUsername?: string | null;
  pppoeCredentialId?: string | null;
  installedAt?: string | null;
  createdAt: string;
  networkPath?: 'circletel_bng' | 'mtn_breakout' | null;
  technology?: 'tarana_fwb' | 'lte_5g' | 'ftth' | 'fwa' | null;
  mtnStaticIp?: string | null;
  taranaRnSerial?: string | null;
  ruijieApSerial?: string | null;
  mikrotikSerial?: string | null;
}

interface CredentialStats {
  totalSites: number;
  withCredentials: number;
  provisioned: number;
  pending: number;
  failed: number;
}

// =============================================================================
// Constants
// =============================================================================

const STATUS_CONFIG: Record<string, { color: string; dot: string }> = {
  active: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  provisioned: { color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  ready: { color: 'bg-cyan-100 text-cyan-700 border-cyan-200', dot: 'bg-cyan-500' },
  pending: { color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  suspended: { color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  decommissioned: { color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  archived: { color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
};

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'sites', label: 'Sites' },
  { id: 'pppoe', label: 'PPPoE Credentials' },
] as const;

const TECH_BADGES: Record<string, string> = {
  tarana_fwb: 'bg-orange-100 text-orange-700 border-orange-200',
  lte_5g: 'bg-purple-100 text-purple-700 border-purple-200',
  ftth: 'bg-green-100 text-green-700 border-green-200',
  fwa: 'bg-amber-100 text-amber-700 border-amber-200',
};

const TECH_LABELS: Record<string, string> = {
  tarana_fwb: 'Tarana FWB',
  lte_5g: 'LTE/5G',
  ftth: 'FTTH',
  fwa: 'FWA',
};

// =============================================================================
// Page Component
// =============================================================================

export default function CorporateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const corporateId = params.id as string;

  const [corporate, setCorporate] = useState<CorporateAccount | null>(null);
  const [sites, setSites] = useState<CorporateSite[]>([]);
  const [credentialStats, setCredentialStats] = useState<CredentialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [generatingCredentials, setGeneratingCredentials] = useState(false);
  const [exportingCredentials, setExportingCredentials] = useState(false);
  const [siteSearch, setSiteSearch] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (corporateId) fetchCorporate();
  }, [corporateId]);

  useEffect(() => {
    if (corporateId && (activeTab === 'sites' || activeTab === 'pppoe')) {
      fetchSites();
    }
    if (corporateId && activeTab === 'pppoe') {
      fetchCredentialStats();
    }
  }, [corporateId, activeTab]);

  const fetchCorporate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/corporate/${corporateId}`);
      if (!response.ok) throw new Error('Failed to fetch corporate');
      setCorporate(await response.json());
    } catch (error) {
      console.error('Error fetching corporate:', error);
      toast.error('Failed to load corporate details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      setSitesLoading(true);
      const p = new URLSearchParams({ limit: '100' });
      if (siteSearch) p.set('search', siteSearch);
      const response = await fetch(`/api/admin/corporate/${corporateId}/sites?${p}`);
      if (!response.ok) throw new Error('Failed to fetch sites');
      const data = await response.json();
      setSites(data.data || []);
    } catch (error) {
      console.error('Error fetching sites:', error);
    } finally {
      setSitesLoading(false);
    }
  };

  const fetchCredentialStats = async () => {
    try {
      const response = await fetch(`/api/admin/corporate/${corporateId}/pppoe/generate`);
      if (response.ok) {
        const data = await response.json();
        setCredentialStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching credential stats:', error);
    }
  };

  const handleGenerateCredentials = async () => {
    try {
      setGeneratingCredentials(true);
      const response = await fetch(`/api/admin/corporate/${corporateId}/pppoe/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generateAll: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate credentials');
      toast.success(`Generated ${data.generatedCount} credentials`);
      fetchCredentialStats();
      fetchSites();
    } catch (error) {
      console.error('Error generating credentials:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate credentials');
    } finally {
      setGeneratingCredentials(false);
    }
  };

  const handleExportCredentials = async () => {
    try {
      setExportingCredentials(true);
      const response = await fetch(`/api/admin/corporate/${corporateId}/pppoe/export`);
      if (!response.ok) throw new Error('Failed to export credentials');
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 'credentials.csv';
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Credentials exported successfully');
    } catch (error) {
      console.error('Error exporting credentials:', error);
      toast.error('Failed to export credentials');
    } finally {
      setExportingCredentials(false);
    }
  };

  const statusBadge = (status: string) => {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.archived;
    return (
      <Badge variant="outline" className={cn('text-xs border', cfg.color)}>
        <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', cfg.dot)} />
        {status}
      </Badge>
    );
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 -m-6 p-6 space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
              <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Not Found
  if (!corporate) {
    return (
      <div className="min-h-screen bg-slate-50 -m-6 p-6 flex items-center justify-center">
        <div className="text-center">
          <PiWarningCircleBold className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-900 mb-1">Corporate Not Found</p>
          <p className="text-slate-500 text-sm mb-6">The corporate account doesn&apos;t exist.</p>
          <Button variant="outline" onClick={() => router.push('/admin/corporate')}>
            <PiArrowLeftBold className="w-4 h-4 mr-2" />
            Back to Corporates
          </Button>
        </div>
      </div>
    );
  }

  const deploymentProgress = corporate.expectedSites
    ? Math.round((corporate.totalSites / corporate.expectedSites) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 -m-6 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link href="/admin" className="hover:text-slate-700">Admin</Link>
          <PiMapPinBold className="w-3 h-3" />
          <Link href="/admin/corporate" className="hover:text-slate-700">Corporate</Link>
          <PiMapPinBold className="w-3 h-3" />
          <span className="text-slate-900">{corporate.companyName}</span>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/corporate" className="text-slate-400 hover:text-slate-600">
              <PiArrowLeftBold className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">{corporate.companyName}</h1>
            <span className="font-mono text-sm font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-200">
              {corporate.corporateCode}
            </span>
            {statusBadge(corporate.accountStatus)}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push(`/admin/corporate/${corporateId}/edit`)}>
              <PiPencilBold className="w-4 h-4 mr-2" />
              Edit Details
            </Button>
            <Button onClick={() => router.push(`/admin/corporate/${corporateId}/sites/new`)}>
              <PiPlusBold className="w-4 h-4 mr-2" />
              Add Site
            </Button>
          </div>
        </div>
        {corporate.tradingName && (
          <p className="text-slate-500 mt-1 ml-8">Trading as: {corporate.tradingName}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Sites"
          value={String(corporate.totalSites)}
          icon={<PiMapPinBold className="w-5 h-5" />}
          iconBgColor="bg-violet-100"
          iconColor="text-violet-600"
        />
        <StatCard
          label="Active Sites"
          value={String(corporate.activeSites)}
          icon={<PiCheckCircleBold className="w-5 h-5" />}
          iconBgColor="bg-emerald-100"
          iconColor="text-emerald-600"
          subtitle={corporate.totalSites > 0 ? `${Math.round((corporate.activeSites / corporate.totalSites) * 100)}% of total` : undefined}
        />
        <StatCard
          label="Pending Sites"
          value={String(corporate.pendingSites)}
          icon={<PiClockBold className="w-5 h-5" />}
          iconBgColor="bg-amber-100"
          iconColor="text-amber-600"
        />
        <StatCard
          label="Target Sites"
          value={String(corporate.expectedSites ?? '—')}
          icon={<PiTargetBold className="w-5 h-5" />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          subtitle={corporate.expectedSites ? `${deploymentProgress}% deployed` : undefined}
        />
      </div>

      {/* Tabs */}
      <UnderlineTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} className="mb-6" />

      {/* ============================================================= */}
      {/* OVERVIEW TAB */}
      {/* ============================================================= */}
      <TabPanel id="overview" activeTab={activeTab} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Company Details */}
          <div className="lg:col-span-2">
            <SectionCard title="Company Details" icon={PiBuildingsBold}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                <InfoRow label="Registration Number" value={corporate.registrationNumber} />
                <InfoRow label="VAT Number" value={corporate.vatNumber} />
                <InfoRow label="Industry" value={corporate.industry} />
                <InfoRow label="Status" value={statusBadge(corporate.accountStatus)} />
                <InfoRow label="Created" value={new Date(corporate.createdAt).toLocaleDateString('en-ZA')} />
                <InfoRow label="Last Updated" value={new Date(corporate.updatedAt).toLocaleDateString('en-ZA')} />
              </div>
              {corporate.physicalAddress?.city && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-3">
                  <PiMapPinBold className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Headquarters</p>
                    <p className="text-sm text-slate-900">
                      {[
                        corporate.physicalAddress.street,
                        corporate.physicalAddress.city,
                        corporate.physicalAddress.province,
                        corporate.physicalAddress.postal_code,
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>

          {/* Contract */}
          <SectionCard title="Contract" icon={PiFileTextBold}>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <PiCalendarBold className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Contract Period</p>
                  <p className="text-sm font-medium text-slate-900">
                    {corporate.contractStartDate ? new Date(corporate.contractStartDate).toLocaleDateString('en-ZA') : 'Not set'}
                    {' — '}
                    {corporate.contractEndDate ? new Date(corporate.contractEndDate).toLocaleDateString('en-ZA') : 'Ongoing'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <PiTargetBold className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Target Deployment</p>
                  <p className="text-sm font-medium text-slate-900">{corporate.expectedSites ?? '—'} sites</p>
                </div>
              </div>
              {corporate.expectedSites && (
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-500">Progress</span>
                    <span className="font-semibold text-slate-900">{deploymentProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${Math.min(deploymentProgress, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    {corporate.totalSites} of {corporate.expectedSites} sites deployed
                  </p>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Contacts */}
        <SectionCard title="Contacts" icon={PiUsersBold}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ContactCard
              type="Primary Contact"
              name={corporate.primaryContactName}
              position={corporate.primaryContactPosition}
              email={corporate.primaryContactEmail}
              phone={corporate.primaryContactPhone}
              color="orange"
            />
            {corporate.billingContactName && (
              <ContactCard
                type="Billing Contact"
                name={corporate.billingContactName}
                email={corporate.billingContactEmail}
                phone={corporate.billingContactPhone}
                color="emerald"
              />
            )}
            {corporate.technicalContactName && (
              <ContactCard
                type="Technical Contact"
                name={corporate.technicalContactName}
                email={corporate.technicalContactEmail}
                phone={corporate.technicalContactPhone}
                color="blue"
              />
            )}
          </div>
        </SectionCard>

        {/* Notes */}
        {corporate.notes && (
          <SectionCard title="Notes" icon={PiFileTextBold}>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{corporate.notes}</p>
          </SectionCard>
        )}
      </TabPanel>

      {/* ============================================================= */}
      {/* SITES TAB */}
      {/* ============================================================= */}
      <TabPanel id="sites" activeTab={activeTab} className="space-y-4">
        {/* Search + Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search sites..."
              value={siteSearch}
              onChange={(e) => setSiteSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchSites()}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <span className="text-sm text-slate-500">{sites.length} site{sites.length !== 1 ? 's' : ''}</span>
          <div className="ml-auto flex gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push(`/admin/corporate/${corporateId}/sites/bulk`)}>
              <PiUploadSimpleBold className="w-4 h-4 mr-2" />
              Bulk Import
            </Button>
            <Button size="sm" onClick={() => router.push(`/admin/corporate/${corporateId}/sites/new`)}>
              <PiPlusBold className="w-4 h-4 mr-2" />
              Add Site
            </Button>
          </div>
        </div>

        {/* Sites Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {sitesLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : sites.length === 0 ? (
            <div className="p-12 text-center">
              <PiMapPinBold className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-medium text-slate-900 mb-1">No sites found</p>
              <p className="text-sm text-slate-500 mb-4">Start by adding your first site</p>
              <Button onClick={() => router.push(`/admin/corporate/${corporateId}/sites/new`)}>
                <PiPlusBold className="w-4 h-4 mr-2" />
                Add Site
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>#</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Site Name</TableHead>
                  <TableHead>Technology</TableHead>
                  <TableHead>Province</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sites.map((site) => (
                  <TableRow
                    key={site.id}
                    className="cursor-pointer group"
                    onClick={() => router.push(`/admin/corporate/${corporateId}/sites/${site.id}`)}
                  >
                    <TableCell className="text-slate-400">{site.siteNumber}</TableCell>
                    <TableCell>
                      <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-sm">
                        {site.accountNumber}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                      {site.siteName}
                    </TableCell>
                    <TableCell>
                      {site.technology ? (
                        <Badge variant="outline" className={TECH_BADGES[site.technology] ?? ''}>
                          {TECH_LABELS[site.technology] ?? site.technology}
                        </Badge>
                      ) : <span className="text-slate-400">—</span>}
                    </TableCell>
                    <TableCell className="text-slate-600">{site.province || '—'}</TableCell>
                    <TableCell>
                      {site.networkPath === 'circletel_bng' && (
                        <div>
                          <span className="text-sm text-emerald-600 font-medium">CircleTel BNG</span>
                          {site.pppoeUsername && (
                            <p className="font-mono text-xs text-slate-400 truncate max-w-[120px]">
                              {site.pppoeUsername.split('@')[0]}
                            </p>
                          )}
                        </div>
                      )}
                      {site.networkPath === 'mtn_breakout' && (
                        <div>
                          <span className="text-sm text-purple-600 font-medium">MTN Breakout</span>
                          {site.mtnStaticIp && (
                            <p className="font-mono text-xs text-slate-400">{site.mtnStaticIp}</p>
                          )}
                        </div>
                      )}
                      {!site.networkPath && <span className="text-slate-400">—</span>}
                    </TableCell>
                    <TableCell>{statusBadge(site.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-blue-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/corporate/${corporateId}/sites/${site.id}`);
                        }}
                      >
                        <PiPencilBold className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </TabPanel>

      {/* ============================================================= */}
      {/* PPPOE TAB */}
      {/* ============================================================= */}
      <TabPanel id="pppoe" activeTab={activeTab} className="space-y-6">
        {/* Credential Stats */}
        {credentialStats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard label="Total Sites" value={String(credentialStats.totalSites)} icon={<PiMapPinBold className="w-5 h-5" />} iconBgColor="bg-slate-100" iconColor="text-slate-600" />
            <StatCard label="With Credentials" value={String(credentialStats.withCredentials)} icon={<PiKeyBold className="w-5 h-5" />} iconBgColor="bg-blue-100" iconColor="text-blue-600" />
            <StatCard label="Provisioned" value={String(credentialStats.provisioned)} icon={<PiCheckCircleBold className="w-5 h-5" />} iconBgColor="bg-emerald-100" iconColor="text-emerald-600" />
            <StatCard label="Pending" value={String(credentialStats.pending)} icon={<PiClockBold className="w-5 h-5" />} iconBgColor="bg-amber-100" iconColor="text-amber-600" />
            <StatCard label="Failed" value={String(credentialStats.failed)} icon={<PiWarningCircleBold className="w-5 h-5" />} iconBgColor="bg-red-100" iconColor="text-red-600" />
          </div>
        )}

        {/* Actions */}
        <SectionCard title="PPPoE Credential Management" icon={PiKeyBold}>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleGenerateCredentials} disabled={generatingCredentials}>
                {generatingCredentials ? (
                  <><PiArrowsClockwiseBold className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                ) : (
                  <><PiSparkleBold className="w-4 h-4 mr-2" />Generate Missing Credentials</>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleExportCredentials}
                disabled={exportingCredentials || !credentialStats?.withCredentials}
              >
                {exportingCredentials ? (
                  <><PiArrowsClockwiseBold className="w-4 h-4 mr-2 animate-spin" />Exporting...</>
                ) : (
                  <><PiDownloadSimpleBold className="w-4 h-4 mr-2" />Export Credentials CSV</>
                )}
              </Button>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <PiWarningCircleBold className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 text-sm">Security Notice</p>
                <p className="text-sm text-amber-700 mt-0.5">
                  Exported CSV contains decrypted passwords. Handle securely and delete after use.
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Credential Status Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 text-sm">Credential Status by Site</h3>
          </div>
          {sitesLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-white">
                  <TableHead>Account Number</TableHead>
                  <TableHead>Site Name</TableHead>
                  <TableHead>PPPoE Username</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sites.map((site) => (
                  <TableRow key={site.id}>
                    <TableCell>
                      <span className="font-mono font-bold text-orange-600">{site.accountNumber}</span>
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">{site.siteName}</TableCell>
                    <TableCell>
                      {site.pppoeUsername ? (
                        <span className="font-mono text-sm text-slate-600">{site.pppoeUsername}</span>
                      ) : (
                        <span className="text-slate-400 italic text-sm">Not generated</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {site.pppoeCredentialId ? (
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          <PiCheckCircleBold className="w-3 h-3 mr-1" />
                          Generated
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
                          <PiClockBold className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </TabPanel>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900 text-right">{value || '—'}</span>
    </div>
  );
}

function ContactCard({
  type, name, position, email, phone, color,
}: {
  type: string;
  name: string;
  position?: string | null;
  email?: string | null;
  phone?: string | null;
  color: 'orange' | 'emerald' | 'blue';
}) {
  const colors = {
    orange: { border: 'border-l-orange-500', bg: 'bg-orange-100', text: 'text-orange-600' },
    emerald: { border: 'border-l-emerald-500', bg: 'bg-emerald-100', text: 'text-emerald-600' },
    blue: { border: 'border-l-blue-500', bg: 'bg-blue-100', text: 'text-blue-600' },
  };
  const c = colors[color];

  return (
    <div className={`bg-white rounded-lg border border-slate-200 ${c.border} border-l-3 p-4`}>
      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{type}</p>
      <p className="font-semibold text-slate-900">{name}</p>
      {position && <p className="text-sm text-slate-500">{position}</p>}
      <div className="flex flex-col gap-1 mt-3">
        {email && (
          <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
            <PiEnvelopeBold className="w-3.5 h-3.5" />
            <span className="truncate">{email}</span>
          </a>
        )}
        {phone && (
          <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
            <PiPhoneBold className="w-3.5 h-3.5" />
            {phone}
          </a>
        )}
      </div>
    </div>
  );
}
