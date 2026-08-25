'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import {
  PiCaretRightBold,
  PiTicketBold,
  PiUsersBold,
  PiArrowsClockwiseBold,
  PiPrinterBold,
  PiCopyBold,
  PiWifiHighBold,
} from 'react-icons/pi';
import { UnderlineTabs, TabPanel, SectionCard } from '@/components/admin/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { issuedCodesAfterAttempt } from './issued-codes';
import { EstateTable, type EstateRow } from './EstateTable';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TAB_CONFIG = [
  { id: 'vouchers', label: 'Voucher Issuance' },
  { id: 'subscribers', label: 'Home Lines' },
] as const;

type TabId = (typeof TAB_CONFIG)[number]['id'];

interface Subscriber {
  id: string;
  username: string;
  profileId: string;
  enabled: boolean;
  siteCode?: string;
  name?: string | null;
  paidThrough?: string | null;
}

interface SubscriberList {
  provider: 'interstellio' | 'radius';
  items: Subscriber[];
  total: number;
  page: number;
  pages: number;
  perPage: number;
}

interface DisconnectResult {
  success: boolean;
  attemptedSessions: number;
  successfulSessions: number;
  failedSessions: number;
}

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export default function RadiusAdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>('vouchers');
  const [isLoading, setIsLoading] = useState(false);
  const [estate, setEstate] = useState<EstateRow[]>([]);
  const [estateGrossCents, setEstateGrossCents] = useState(0);
  const [estateVouchers, setEstateVouchers] = useState(0);

  // Voucher issuance
  const [voucherCount, setVoucherCount] = useState('10');
  const [voucherProfile, setVoucherProfile] = useState('');
  const [voucherPrice, setVoucherPrice] = useState('');
  const [voucherPriceUnit, setVoucherPriceUnit] = useState<'zar' | 'cents'>('zar');
  const [voucherExpiresAt, setVoucherExpiresAt] = useState('');
  const [voucherAgentCode, setVoucherAgentCode] = useState('');
  const [issuedCodes, setIssuedCodes] = useState<string[]>([]);
  const [isIssuing, setIsIssuing] = useState(false);

  // Subscriber management
  const [siteId, setSiteId] = useState('');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subscriberProvider, setSubscriberProvider] = useState<
    'interstellio' | 'radius' | null
  >(null);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);
  const [profileChangeTarget, setProfileChangeTarget] = useState<string | null>(null);
  const [newProfileId, setNewProfileId] = useState('');

  // Provision form
  const [provUsername, setProvUsername] = useState('');
  const [provPassword, setProvPassword] = useState('');
  const [provProfileId, setProvProfileId] = useState('');
  const [provPaidThrough, setProvPaidThrough] = useState('');
  const [provVirtualId, setProvVirtualId] = useState('');
  const [provServiceId, setProvServiceId] = useState('');
  const [provName, setProvName] = useState('');
  const [isProvisioning, setIsProvisioning] = useState(false);

  useEffect(() => {
    return () => {
      setIssuedCodes([]);
    };
  }, []);

  const parsePriceCents = useCallback((): number | null => {
    const raw = voucherPrice.trim();
    if (!raw) return null;
    const value = Number(raw);
    if (Number.isNaN(value) || value < 0) return null;
    if (voucherPriceUnit === 'zar') {
      return Math.round(value * 100);
    }
    if (!Number.isInteger(value)) return null;
    return value;
  }, [voucherPrice, voucherPriceUnit]);

  const handleIssueVouchers = async (event: React.FormEvent) => {
    event.preventDefault();

    const count = Number.parseInt(voucherCount, 10);
    const priceCents = parsePriceCents();

    if (!Number.isInteger(count) || count <= 0) {
      toast.error('Count must be a positive whole number');
      return;
    }
    if (!voucherProfile.trim()) {
      toast.error('Profile is required');
      return;
    }
    if (priceCents === null) {
      toast.error('Enter a valid price');
      return;
    }
    if (!voucherExpiresAt) {
      toast.error('Expiry date is required');
      return;
    }

    const expiresAt = new Date(voucherExpiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
      toast.error('Expiry date is invalid');
      return;
    }

    setIssuedCodes([]);
    setIsIssuing(true);
    try {
      const body: Record<string, unknown> = {
        count,
        profile: voucherProfile.trim(),
        priceCents,
        expiresAt: expiresAt.toISOString(),
      };
      const agentCode = voucherAgentCode.trim();
      if (agentCode) body.agentCode = agentCode;

      const res = await fetch('/api/admin/integrations/radius/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as { codes?: string[]; error?: string };

      const nextCodes = issuedCodesAfterAttempt(data.codes, count);
      if (!res.ok || nextCodes.length === 0) {
        toast.error(data.error ?? 'Voucher batch failed — incomplete or rejected');
        return;
      }

      setIssuedCodes(nextCodes);
    } catch {
      toast.error('Voucher batch request failed');
    } finally {
      setIsIssuing(false);
    }
  };

  const handleCopyCodes = async () => {
    if (issuedCodes.length === 0) return;
    try {
      await navigator.clipboard.writeText(issuedCodes.join('\n'));
      toast.success('Codes copied to clipboard');
    } catch {
      toast.error('Failed to copy codes');
    }
  };

  const handlePrintCodes = () => {
    if (issuedCodes.length === 0) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Unable to open print window');
      return;
    }
    const printDocument = printWindow.document;
    printDocument.title = 'RADIUS Voucher Codes';
    printDocument.body.replaceChildren();
    printDocument.body.style.fontFamily = 'monospace';
    printDocument.body.style.padding = '2rem';

    const heading = printDocument.createElement('h1');
    heading.textContent = `RADIUS Voucher Codes (${issuedCodes.length})`;
    const codes = printDocument.createElement('pre');
    codes.textContent = issuedCodes.join('\n');
    printDocument.body.append(heading, codes);
    printDocument.close();
    printWindow.print();
  };

  const fetchEstate = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/integrations/radius/estate');
      if (!res.ok) return;
      const data = (await res.json()) as {
        sites?: EstateRow[];
        voucherCount?: number;
        voucherGrossCents?: number;
      };
      setEstate(data.sites ?? []);
      setEstateVouchers(data.voucherCount ?? 0);
      setEstateGrossCents(data.voucherGrossCents ?? 0);
    } catch {
      /* estate is informational; site tools still work */
    }
  }, []);

  useEffect(() => {
    void fetchEstate();
  }, [fetchEstate]);

  const fetchSubscribers = useCallback(async () => {
    if (!isUuid(siteId)) return;

    setSubscriberProvider(null);
    setIsLoadingSubscribers(true);
    try {
      const res = await fetch(
        `/api/admin/integrations/radius/subscribers?siteId=${encodeURIComponent(siteId)}&perPage=50`
      );
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        toast.error(data.error ?? 'Failed to load subscribers');
        return;
      }
      const data = (await res.json()) as SubscriberList;
      setSubscribers(data.items ?? []);
      setSubscriberProvider(data.provider);
    } catch {
      toast.error('Failed to load subscribers');
    } finally {
      setIsLoadingSubscribers(false);
    }
  }, [siteId]);

  useEffect(() => {
    if (isUuid(siteId)) {
      fetchSubscribers();
    } else {
      setSubscribers([]);
      setSubscriberProvider(null);
    }
  }, [siteId, fetchSubscribers]);

  const requireSiteId = (): boolean => {
    if (!isUuid(siteId)) {
      toast.error('Site ID must be a valid UUID');
      return false;
    }
    return true;
  };

  const handleProvision = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requireSiteId()) return;
    if (!subscriberProvider) {
      toast.error('Load the site before provisioning a home line');
      return;
    }

    if (
      !provUsername.trim() ||
      !provPassword ||
      !provProfileId.trim()
    ) {
      toast.error('All required provision fields must be filled');
      return;
    }

    setIsProvisioning(true);
    try {
      const body: Record<string, unknown> = {
        siteId,
        username: provUsername.trim(),
        password: provPassword,
        profileId: provProfileId.trim(),
      };
      if (subscriberProvider === 'radius') {
        if (!provPaidThrough) {
          toast.error('Paid-through date is required');
          return;
        }
        const paidThrough = new Date(provPaidThrough);
        if (Number.isNaN(paidThrough.getTime())) {
          toast.error('Paid-through date is invalid');
          return;
        }
        body.paidThrough = paidThrough.toISOString();
      } else {
        if (!provVirtualId.trim() || !provServiceId.trim()) {
          toast.error('Virtual ID and service ID are required');
          return;
        }
        body.virtualId = provVirtualId.trim();
        body.serviceId = provServiceId.trim();
      }
      if (provName.trim()) body.name = provName.trim();

      const res = await fetch('/api/admin/integrations/radius/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to provision home line');
        return;
      }

      toast.success('Home line provisioned');
      setProvUsername('');
      setProvPassword('');
      setProvProfileId('');
      setProvPaidThrough('');
      setProvVirtualId('');
      setProvServiceId('');
      setProvName('');
      fetchSubscribers();
    } catch {
      toast.error('Provision request failed');
    } finally {
      setIsProvisioning(false);
    }
  };

  const postSubscriberAction = async (
    username: string,
    path: string,
    body: Record<string, unknown>,
    successMessage: string
  ) => {
    if (!requireSiteId()) return;

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/integrations/radius/subscribers/${encodeURIComponent(username)}/${path}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? `Failed to ${path} subscriber`);
        return;
      }
      toast.success(successMessage);
      fetchSubscribers();
      return data;
    } catch {
      toast.error(`Failed to ${path} subscriber`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnable = (username: string) =>
    postSubscriberAction(username, 'enable', { siteId }, 'Subscriber enabled');

  const handleDisable = (username: string) =>
    postSubscriberAction(username, 'disable', { siteId }, 'Subscriber disabled');

  const handleChangeProfile = async (username: string) => {
    if (!newProfileId.trim()) {
      toast.error('Profile ID is required');
      return;
    }
    const result = await postSubscriberAction(
      username,
      'profile',
      { siteId, profileId: newProfileId.trim() },
      'Profile changed'
    );
    if (result) {
      setProfileChangeTarget(null);
      setNewProfileId('');
    }
  };

  const handleDisconnect = async (username: string) => {
    if (!requireSiteId()) return;

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/integrations/radius/subscribers/${encodeURIComponent(username)}/disconnect`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ siteId }),
        }
      );
      const data = (await res.json()) as DisconnectResult & { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to disconnect sessions');
        return;
      }
      toast.success(
        `Disconnect: ${data.successfulSessions}/${data.attemptedSessions} sessions (${data.failedSessions} failed)`
      );
    } catch {
      toast.error('Disconnect request failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link href="/admin/integrations" className="hover:text-primary">
              Integrations
            </Link>
            <PiCaretRightBold className="w-3 h-3" />
            <span className="text-slate-900">Owned RADIUS</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-6 mt-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Owned RADIUS
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Issue voucher batches and manage home-line subscribers on the owned RADIUS stack.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <SectionCard icon={PiWifiHighBold} title="Estate">
          <p className="text-sm text-slate-500 mb-4">
            {estateVouchers} vouchers issued · R{(estateGrossCents / 100).toFixed(2)} gross.
            A Site has a NAS on the Overlay. A flipped clinic without a NAS is a candidate.
            Empty Home Lines on a RADIUS Site is a valid success state.
          </p>
          <EstateTable
            rows={estate}
            onSelectSite={(id) => {
              setSiteId(id);
              setActiveTab('subscribers');
            }}
          />
        </SectionCard>

        <UnderlineTabs
          tabs={TAB_CONFIG.map((tab) => ({
            ...tab,
            label:
              tab.id === 'subscribers'
                ? `Home Lines (${subscribers.length})`
                : tab.label,
          }))}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as TabId)}
        />

        <TabPanel id="vouchers" activeTab={activeTab} className="mt-6 space-y-6">
          <SectionCard icon={PiTicketBold} title="Issue Voucher Batch">
            <form onSubmit={handleIssueVouchers} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="voucher-count">Count</Label>
                  <Input
                    id="voucher-count"
                    type="number"
                    min={1}
                    value={voucherCount}
                    onChange={(e) => setVoucherCount(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voucher-profile">Profile</Label>
                  <Input
                    id="voucher-profile"
                    value={voucherProfile}
                    onChange={(e) => setVoucherProfile(e.target.value)}
                    placeholder="e.g. voucher-24h"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voucher-price">Price</Label>
                  <div className="flex gap-2">
                    <Input
                      id="voucher-price"
                      type="number"
                      min={0}
                      step={voucherPriceUnit === 'zar' ? '0.01' : '1'}
                      value={voucherPrice}
                      onChange={(e) => setVoucherPrice(e.target.value)}
                      required
                      className="flex-1"
                    />
                    <select
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      value={voucherPriceUnit}
                      onChange={(e) =>
                        setVoucherPriceUnit(e.target.value as 'zar' | 'cents')
                      }
                    >
                      <option value="zar">ZAR</option>
                      <option value="cents">Cents</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voucher-expires">Expires</Label>
                  <Input
                    id="voucher-expires"
                    type="datetime-local"
                    value={voucherExpiresAt}
                    onChange={(e) => setVoucherExpiresAt(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voucher-agent">Agent code (optional)</Label>
                  <Input
                    id="voucher-agent"
                    value={voucherAgentCode}
                    onChange={(e) => setVoucherAgentCode(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <Button type="submit" disabled={isIssuing}>
                {isIssuing ? 'Issuing…' : 'Issue batch'}
              </Button>
            </form>
          </SectionCard>

          {issuedCodes.length > 0 && (
            <SectionCard icon={PiTicketBold} title={`Issued Codes (${issuedCodes.length})`}>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={handleCopyCodes}>
                    <PiCopyBold className="w-4 h-4 mr-1" />
                    Copy all
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={handlePrintCodes}>
                    <PiPrinterBold className="w-4 h-4 mr-1" />
                    Print
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIssuedCodes([])}
                  >
                    Clear
                  </Button>
                </div>
                <Textarea
                  readOnly
                  value={issuedCodes.join('\n')}
                  rows={Math.min(issuedCodes.length + 1, 12)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-slate-500">
                  Codes are cleared when you leave this page. Do not share outside the handover
                  workflow.
                </p>
              </div>
            </SectionCard>
          )}
        </TabPanel>

        <TabPanel id="subscribers" activeTab={activeTab} className="mt-6 space-y-6">
          <SectionCard icon={PiUsersBold} title="Site Context">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="site-id">Site ID (UUID)</Label>
                <Input
                  id="site-id"
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value.trim())}
                  placeholder="11111111-1111-4111-8111-111111111111"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={fetchSubscribers}
                disabled={!isUuid(siteId) || isLoadingSubscribers}
              >
                <PiArrowsClockwiseBold className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </div>
          </SectionCard>

          <SectionCard icon={PiUsersBold} title="Provision Home Line">
            <form onSubmit={handleProvision} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prov-username">Username</Label>
                  <Input
                    id="prov-username"
                    value={provUsername}
                    onChange={(e) => setProvUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prov-password">Password</Label>
                  <Input
                    id="prov-password"
                    type="password"
                    value={provPassword}
                    onChange={(e) => setProvPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prov-profile">Profile ID</Label>
                  <Input
                    id="prov-profile"
                    value={provProfileId}
                    onChange={(e) => setProvProfileId(e.target.value)}
                    required
                  />
                </div>
                {subscriberProvider === 'radius' && (
                  <div className="space-y-2">
                    <Label htmlFor="prov-paid-through">Paid through</Label>
                    <Input
                      id="prov-paid-through"
                      type="datetime-local"
                      value={provPaidThrough}
                      onChange={(e) => setProvPaidThrough(e.target.value)}
                      required
                    />
                  </div>
                )}
                {subscriberProvider === 'interstellio' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="prov-virtual-id">Virtual ID</Label>
                      <Input
                        id="prov-virtual-id"
                        value={provVirtualId}
                        onChange={(e) => setProvVirtualId(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prov-service-id">Service ID</Label>
                      <Input
                        id="prov-service-id"
                        value={provServiceId}
                        onChange={(e) => setProvServiceId(e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="prov-name">Display name (optional)</Label>
                  <Input
                    id="prov-name"
                    value={provName}
                    onChange={(e) => setProvName(e.target.value)}
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isProvisioning || !isUuid(siteId) || !subscriberProvider}
              >
                {isProvisioning ? 'Provisioning…' : 'Provision home line'}
              </Button>
            </form>
          </SectionCard>

          <SectionCard icon={PiUsersBold} title="Subscribers">
            {!isUuid(siteId) ? (
              <p className="text-sm text-slate-500">Enter a valid site UUID to load subscribers.</p>
            ) : isLoadingSubscribers ? (
              <p className="text-sm text-slate-500">Loading subscribers…</p>
            ) : subscribers.length === 0 ? (
              <p className="text-sm text-slate-500">No subscribers found for this site.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="py-2 pr-4 font-medium">Username</th>
                      <th className="py-2 pr-4 font-medium">Profile</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                      <th className="py-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((sub) => (
                      <tr key={sub.id} className="border-b border-slate-100">
                        <td className="py-3 pr-4 font-mono">{sub.username}</td>
                        <td className="py-3 pr-4">{sub.profileId}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={
                              sub.enabled
                                ? 'text-green-700'
                                : 'text-slate-400'
                            }
                          >
                            {sub.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-2">
                            {sub.enabled ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isLoading}
                                onClick={() => handleDisable(sub.username)}
                              >
                                Disable
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isLoading}
                                onClick={() => handleEnable(sub.username)}
                              >
                                Enable
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isLoading}
                              onClick={() => {
                                setProfileChangeTarget(sub.username);
                                setNewProfileId(sub.profileId);
                              }}
                            >
                              Change profile
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isLoading}
                              onClick={() => handleDisconnect(sub.username)}
                            >
                              Disconnect
                            </Button>
                          </div>
                          {profileChangeTarget === sub.username && (
                            <div className="mt-2 flex flex-wrap gap-2 items-end">
                              <div className="space-y-1">
                                <Label htmlFor={`profile-${sub.username}`}>New profile ID</Label>
                                <Input
                                  id={`profile-${sub.username}`}
                                  value={newProfileId}
                                  onChange={(e) => setNewProfileId(e.target.value)}
                                  className="w-48"
                                />
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                disabled={isLoading}
                                onClick={() => handleChangeProfile(sub.username)}
                              >
                                Apply
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setProfileChangeTarget(null);
                                  setNewProfileId('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </TabPanel>
      </div>
    </div>
  );
}
