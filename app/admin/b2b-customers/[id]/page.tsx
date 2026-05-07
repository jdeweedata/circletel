'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  PiBuildingsBold,
  PiArrowLeftBold,
  PiUsersBold,
  PiPlusBold,
  PiTrashBold,
  PiEnvelopeBold,
  PiMapPinBold,
  PiIdentificationCardBold,
  PiWifiHighBold,
  PiPlayBold,
  PiCheckCircleBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface Account {
  id: string;
  corporate_code: string;
  company_name: string;
  trading_name: string | null;
  registration_number: string | null;
  vat_number: string | null;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone: string | null;
  account_status: string;
  total_sites: number;
  active_sites: number;
  industry: string | null;
  created_at: string;
}

interface PortalUser {
  id: string;
  auth_user_id: string;
  display_name: string;
  email: string;
  role: string;
  site_id: string | null;
  created_at: string;
  corporate_sites: { id: string; site_name: string } | null;
}

interface Site {
  id: string;
  site_name: string;
  status: string | null;
  technology: string | null;
  monthly_fee: number | null;
  package_id: string | null;
  installed_at: string | null;
  wholesale_order_ref: string | null;
}

export default function AdminB2BAccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;

  const [account, setAccount] = useState<Account | null>(null);
  const [portalUsers, setPortalUsers] = useState<PortalUser[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [siteStatusFilter, setSiteStatusFilter] = useState('all');
  const [activateSiteId, setActivateSiteId] = useState<string | null>(null);
  const [markActiveId, setMarkActiveId] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  const [activateTechnology, setActivateTechnology] = useState('lte_5g');
  const [activateInstallDate, setActivateInstallDate] = useState('');
  const [activateInstaller, setActivateInstaller] = useState('');
  const [activateWholesaleRef, setActivateWholesaleRef] = useState('');
  const [activateNotes, setActivateNotes] = useState('');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDisplayName, setInviteDisplayName] = useState('');
  const [inviteRole, setInviteRole] = useState('admin');
  const [inviteSiteId, setInviteSiteId] = useState('');

  useEffect(() => {
    fetch(`/api/admin/b2b-customers?search=${accountId}`)
      .then((r) => r.json())
      .then((data) => {
        const match = data.data?.customers?.find((c: Account) => c.id === accountId);
        setAccount(match ?? null);
      })
      .catch(console.error)
      .finally(() => setLoadingAccount(false));
  }, [accountId]);

  const fetchPortalUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`/api/admin/b2b-customers/${accountId}/portal-users`);
      const data = await res.json();
      setPortalUsers(data.portalUsers ?? []);
    } catch (err) {
      console.error('Failed to fetch portal users:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchPortalUsers();
  }, [fetchPortalUsers]);

  const fetchSites = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/b2b-customers/${accountId}/sites`);
      const data = await res.json();
      setSites(data.sites ?? []);
    } catch (err) {
      console.error('Failed to fetch sites:', err);
    }
  }, [accountId]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteDisplayName.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/b2b-customers/${accountId}/portal-users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          display_name: inviteDisplayName,
          role: inviteRole,
          site_id: inviteRole === 'site_user' ? inviteSiteId : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to invite user');
        return;
      }

      setPortalUsers((prev) => [data.portalUser, ...prev]);
      setInviteOpen(false);
      resetInviteForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite user');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm('Remove this user\'s portal access? They will no longer be able to log in to the portal.')) return;

    setDeletingId(userId);
    try {
      const res = await fetch(`/api/admin/b2b-customers/${accountId}/portal-users/${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setPortalUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleActivate() {
    if (!activateSiteId) return;
    setActivating(true);
    try {
      const res = await fetch(`/api/admin/b2b-customers/site-details/${activateSiteId}/activate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'provisioned',
          technology: activateTechnology,
          package_id: 'f6828ecf-4a8d-42c0-9fd7-d7cac5c1537e',
          monthly_fee: 450,
          wholesale_order_ref: activateWholesaleRef || undefined,
          installed_at: activateInstallDate || undefined,
          installed_by: activateInstaller || undefined,
          notes: activateNotes || undefined,
        }),
      });
      if (res.ok) {
        setActivateSiteId(null);
        setActivateTechnology('lte_5g');
        setActivateInstallDate('');
        setActivateInstaller('');
        setActivateWholesaleRef('');
        setActivateNotes('');
        fetchSites();
      }
    } catch (err) {
      console.error('Activate failed:', err);
    } finally {
      setActivating(false);
    }
  }

  async function handleMarkActive() {
    if (!markActiveId) return;
    setActivating(true);
    try {
      const res = await fetch(`/api/admin/b2b-customers/site-details/${markActiveId}/activate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });
      if (res.ok) {
        setMarkActiveId(null);
        fetchSites();
      }
    } catch (err) {
      console.error('Mark active failed:', err);
    } finally {
      setActivating(false);
    }
  }

  function resetInviteForm() {
    setInviteEmail('');
    setInviteDisplayName('');
    setInviteRole('admin');
    setInviteSiteId('');
    setError('');
  }

  if (loadingAccount) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Account not found.</p>
        <Button variant="ghost" onClick={() => router.push('/admin/b2b-customers')} className="mt-4">
          <PiArrowLeftBold className="w-4 h-4 mr-2" /> Back to customers
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/b2b-customers')}>
          <PiArrowLeftBold className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <PiBuildingsBold className="h-6 w-6 text-circleTel-orange" />
            <h1 className="text-2xl font-bold text-gray-900">{account.company_name}</h1>
            <Badge variant={account.account_status === 'active' ? 'default' : 'secondary'}>
              {account.account_status}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {account.corporate_code} &middot; {account.total_sites} sites ({account.active_sites} active)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <PiIdentificationCardBold className="w-4 h-4" /> Company Details
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1.5">
            {account.trading_name && <p><span className="text-gray-500">Trading as:</span> {account.trading_name}</p>}
            {account.registration_number && <p><span className="text-gray-500">Reg:</span> {account.registration_number}</p>}
            {account.vat_number && <p><span className="text-gray-500">VAT:</span> {account.vat_number}</p>}
            {account.industry && <p><span className="text-gray-500">Industry:</span> {account.industry}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <PiEnvelopeBold className="w-4 h-4" /> Primary Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1.5">
            <p className="font-medium">{account.primary_contact_name}</p>
            <p>{account.primary_contact_email}</p>
            {account.primary_contact_phone && <p>{account.primary_contact_phone}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <PiMapPinBold className="w-4 h-4" /> Sites
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1.5">
            <p className="text-2xl font-bold">{account.total_sites}</p>
            <p className="text-gray-500">{account.active_sites} active</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <PiWifiHighBold className="h-5 w-5 text-circleTel-orange" />
            <CardTitle>Sites</CardTitle>
            <Badge variant="outline">{sites.length}</Badge>
          </div>
          <Select value={siteStatusFilter} onValueChange={setSiteStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="provisioned">Provisioned</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Technology</TableHead>
                <TableHead>Monthly Fee</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No sites found.
                  </TableCell>
                </TableRow>
              ) : (
                sites
                  .filter((s) => siteStatusFilter === 'all' || s.status === siteStatusFilter)
                  .map((site) => (
                    <TableRow key={site.id}>
                      <TableCell className="font-medium">{site.site_name}</TableCell>
                      <TableCell>
                        <Badge variant={
                          site.status === 'active' ? 'default' :
                          site.status === 'suspended' ? 'destructive' :
                          'secondary'
                        }>
                          {site.status ?? 'unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {site.technology
                          ? site.technology.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                          : '—'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {site.monthly_fee != null
                          ? `R${Number(site.monthly_fee).toFixed(2)}`
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {(site.status === 'pending' || site.status === 'ready') && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-circleTel-orange border-circleTel-orange hover:bg-orange-50"
                              onClick={() => setActivateSiteId(site.id)}
                            >
                              <PiPlayBold className="w-3 h-3 mr-1" /> Activate
                            </Button>
                          )}
                          {site.status === 'provisioned' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => setMarkActiveId(site.id)}
                            >
                              <PiCheckCircleBold className="w-3 h-3 mr-1" /> Mark Active
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <PiUsersBold className="h-5 w-5 text-circleTel-orange" />
            <CardTitle>Portal Users</CardTitle>
            <Badge variant="outline">{portalUsers.length}</Badge>
          </div>
          <Button
            size="sm"
            className="bg-circleTel-orange hover:bg-orange-600"
            onClick={() => { resetInviteForm(); setInviteOpen(true); }}
          >
            <PiPlusBold className="w-4 h-4 mr-1" /> Invite User
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned Site</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingUsers ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : portalUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No portal users yet. Invite someone to get started.
                  </TableCell>
                </TableRow>
              ) : (
                portalUsers.map((pu) => (
                  <TableRow key={pu.id}>
                    <TableCell className="font-medium">{pu.display_name}</TableCell>
                    <TableCell>{pu.email}</TableCell>
                    <TableCell>
                      <Badge variant={pu.role === 'admin' ? 'default' : 'secondary'}>
                        {pu.role === 'admin' ? 'Admin' : 'Site User'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {pu.corporate_sites?.site_name ?? (pu.role === 'admin' ? 'All sites' : '—')}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(pu.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(pu.id)}
                        disabled={deletingId === pu.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <PiTrashBold className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Portal User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                placeholder="user@company.co.za"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Display Name</label>
              <Input
                value={inviteDisplayName}
                onChange={(e) => setInviteDisplayName(e.target.value)}
                required
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin (sees all sites)</SelectItem>
                  <SelectItem value="site_user">Site User (single site)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inviteRole === 'site_user' && (
              <div>
                <label className="block text-sm font-medium mb-1">Assigned Site</label>
                <Select value={inviteSiteId} onValueChange={setInviteSiteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a site..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.site_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !inviteEmail || !inviteDisplayName || (inviteRole === 'site_user' && !inviteSiteId)}
                className="bg-circleTel-orange hover:bg-orange-600"
              >
                {submitting ? 'Inviting...' : 'Send Invite'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!activateSiteId} onOpenChange={(open) => { if (!open) setActivateSiteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate Site: {sites.find((s) => s.id === activateSiteId)?.site_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Technology</label>
              <Select value={activateTechnology} onValueChange={setActivateTechnology}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lte_5g">LTE / 5G</SelectItem>
                  <SelectItem value="tarana_fwb">Tarana FWB</SelectItem>
                  <SelectItem value="ftth">FTTH</SelectItem>
                  <SelectItem value="fwa">FWA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Package</label>
              <Input value="UNJ-MC-001 — Unjani Managed Connectivity (R450.00/mo)" disabled />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Install Date (optional)</label>
              <Input
                type="date"
                value={activateInstallDate}
                onChange={(e) => setActivateInstallDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Installer Name (optional)</label>
              <Input
                value={activateInstaller}
                onChange={(e) => setActivateInstaller(e.target.value)}
                placeholder="e.g. John from TechInstall"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Wholesale Order Ref (optional)</label>
              <Input
                value={activateWholesaleRef}
                onChange={(e) => setActivateWholesaleRef(e.target.value)}
                placeholder="e.g. WO-2026-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <Input
                value={activateNotes}
                onChange={(e) => setActivateNotes(e.target.value)}
                placeholder="Any additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivateSiteId(null)}>Cancel</Button>
            <Button
              onClick={handleActivate}
              disabled={activating}
              className="bg-circleTel-orange hover:bg-orange-600"
            >
              {activating ? 'Activating...' : 'Activate Site'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!markActiveId} onOpenChange={(open) => { if (!open) setMarkActiveId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Site as Active</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            This will set <strong>{sites.find((s) => s.id === markActiveId)?.site_name}</strong> to <strong>active</strong> status
            and record the activation date as now. This will also trigger a pro-rata invoice for the remaining days in the current month.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkActiveId(null)}>Cancel</Button>
            <Button
              onClick={handleMarkActive}
              disabled={activating}
              className="bg-green-600 hover:bg-green-700"
            >
              {activating ? 'Updating...' : 'Confirm — Mark Active'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
