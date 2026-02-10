'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  Phone,
  Mail,
  Plus,
  Download,
  Key,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Upload,
  Search,
  ExternalLink,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { SiteEditSheet } from '@/components/admin/corporate/SiteEditSheet';

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
}

interface CredentialStats {
  totalSites: number;
  withCredentials: number;
  provisioned: number;
  pending: number;
  failed: number;
}

export default function CorporateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const corporateId = params.id as string;

  const [corporate, setCorporate] = React.useState<CorporateAccount | null>(null);
  const [sites, setSites] = React.useState<CorporateSite[]>([]);
  const [credentialStats, setCredentialStats] = React.useState<CredentialStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [sitesLoading, setSitesLoading] = React.useState(false);
  const [generatingCredentials, setGeneratingCredentials] = React.useState(false);
  const [exportingCredentials, setExportingCredentials] = React.useState(false);
  const [siteSearch, setSiteSearch] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('overview');
  const [editingSite, setEditingSite] = React.useState<CorporateSite | null>(null);
  const [editSheetOpen, setEditSheetOpen] = React.useState(false);

  React.useEffect(() => {
    if (corporateId) {
      fetchCorporate();
    }
  }, [corporateId]);

  React.useEffect(() => {
    if (corporateId && activeTab === 'sites') {
      fetchSites();
    }
    if (corporateId && activeTab === 'pppoe') {
      fetchCredentialStats();
      fetchSites();
    }
  }, [corporateId, activeTab]);

  const fetchCorporate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/corporate/${corporateId}`);
      if (!response.ok) throw new Error('Failed to fetch corporate');
      const data = await response.json();
      setCorporate(data);
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
      const params = new URLSearchParams({ limit: '100' });
      if (siteSearch) params.set('search', siteSearch);

      const response = await fetch(`/api/admin/corporate/${corporateId}/sites?${params}`);
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

      // Get filename from content-disposition header
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 'credentials.csv';

      // Download the file
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'provisioned':
        return <Badge className="bg-blue-100 text-blue-800">Provisioned</Badge>;
      case 'ready':
        return <Badge className="bg-cyan-100 text-cyan-800">Ready</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      case 'decommissioned':
        return <Badge className="bg-gray-100 text-gray-800">Decommissioned</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading corporate details...</p>
        </div>
      </div>
    );
  }

  if (!corporate) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-300 mx-auto" />
          <p className="text-gray-500 mt-4">Corporate account not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/corporate')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/corporate')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{corporate.companyName}</h1>
              <span className="font-mono text-lg text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {corporate.corporateCode}
              </span>
              {getStatusBadge(corporate.accountStatus)}
            </div>
            {corporate.tradingName && (
              <p className="text-gray-500 mt-1">Trading as: {corporate.tradingName}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/admin/corporate/${corporateId}/sites/new`)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Site
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Sites</p>
                <p className="text-2xl font-bold">{corporate.totalSites}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Sites</p>
                <p className="text-2xl font-bold">{corporate.activeSites}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Sites</p>
                <p className="text-2xl font-bold">{corporate.pendingSites}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Target Sites</p>
                <p className="text-2xl font-bold">{corporate.expectedSites || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sites">Sites ({corporate.totalSites})</TabsTrigger>
          <TabsTrigger value="pppoe">PPPoE Credentials</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Registration Number</p>
                    <p className="font-medium">{corporate.registrationNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">VAT Number</p>
                    <p className="font-medium">{corporate.vatNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Industry</p>
                    <p className="font-medium">{corporate.industry || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Account Status</p>
                    {getStatusBadge(corporate.accountStatus)}
                  </div>
                </div>
                {corporate.physicalAddress?.city && (
                  <div>
                    <p className="text-sm text-gray-500">Headquarters</p>
                    <p className="font-medium">
                      {[
                        corporate.physicalAddress.street,
                        corporate.physicalAddress.city,
                        corporate.physicalAddress.province,
                        corporate.physicalAddress.postal_code,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contacts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Contacts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Primary Contact */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Primary Contact</p>
                  <p className="font-medium">{corporate.primaryContactName}</p>
                  {corporate.primaryContactPosition && (
                    <p className="text-sm text-gray-500">{corporate.primaryContactPosition}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-sm">
                    <a href={`mailto:${corporate.primaryContactEmail}`} className="flex items-center text-blue-600 hover:underline">
                      <Mail className="h-4 w-4 mr-1" />
                      {corporate.primaryContactEmail}
                    </a>
                    {corporate.primaryContactPhone && (
                      <a href={`tel:${corporate.primaryContactPhone}`} className="flex items-center text-blue-600 hover:underline">
                        <Phone className="h-4 w-4 mr-1" />
                        {corporate.primaryContactPhone}
                      </a>
                    )}
                  </div>
                </div>

                {/* Billing Contact */}
                {corporate.billingContactName && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Billing Contact</p>
                    <p className="font-medium">{corporate.billingContactName}</p>
                    <div className="flex gap-4 mt-2 text-sm">
                      {corporate.billingContactEmail && (
                        <a href={`mailto:${corporate.billingContactEmail}`} className="flex items-center text-blue-600 hover:underline">
                          <Mail className="h-4 w-4 mr-1" />
                          {corporate.billingContactEmail}
                        </a>
                      )}
                      {corporate.billingContactPhone && (
                        <span className="flex items-center text-gray-600">
                          <Phone className="h-4 w-4 mr-1" />
                          {corporate.billingContactPhone}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Technical Contact */}
                {corporate.technicalContactName && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Technical Contact</p>
                    <p className="font-medium">{corporate.technicalContactName}</p>
                    <div className="flex gap-4 mt-2 text-sm">
                      {corporate.technicalContactEmail && (
                        <a href={`mailto:${corporate.technicalContactEmail}`} className="flex items-center text-blue-600 hover:underline">
                          <Mail className="h-4 w-4 mr-1" />
                          {corporate.technicalContactEmail}
                        </a>
                      )}
                      {corporate.technicalContactPhone && (
                        <span className="flex items-center text-gray-600">
                          <Phone className="h-4 w-4 mr-1" />
                          {corporate.technicalContactPhone}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contract Info */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Contract Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Contract Start</p>
                    <p className="font-medium">
                      {corporate.contractStartDate
                        ? new Date(corporate.contractStartDate).toLocaleDateString()
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contract End</p>
                    <p className="font-medium">
                      {corporate.contractEndDate
                        ? new Date(corporate.contractEndDate).toLocaleDateString()
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Expected Sites</p>
                    <p className="font-medium">{corporate.expectedSites || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Deployment Progress</p>
                    <p className="font-medium">
                      {corporate.expectedSites
                        ? `${Math.round((corporate.totalSites / corporate.expectedSites) * 100)}%`
                        : '-'}
                    </p>
                  </div>
                </div>
                {corporate.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="mt-1">{corporate.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sites Tab */}
        <TabsContent value="sites" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sites</CardTitle>
                  <CardDescription>{sites.length} sites found</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search sites..."
                      value={siteSearch}
                      onChange={(e) => setSiteSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchSites()}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" onClick={() => router.push(`/admin/corporate/${corporateId}/sites/bulk`)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Import
                  </Button>
                  <Button onClick={() => router.push(`/admin/corporate/${corporateId}/sites/new`)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Site
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {sitesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-blue-600 rounded-full mx-auto"></div>
                </div>
              ) : sites.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="text-gray-500 mt-4">No sites found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Account Number</TableHead>
                      <TableHead>Site Name</TableHead>
                      <TableHead>Province</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>PPPoE</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sites.map((site) => (
                      <TableRow key={site.id}>
                        <TableCell>{site.siteNumber}</TableCell>
                        <TableCell>
                          <span className="font-mono font-semibold text-blue-600">
                            {site.accountNumber}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{site.siteName}</TableCell>
                        <TableCell>{site.province || '-'}</TableCell>
                        <TableCell>
                          {site.siteContactName ? (
                            <div className="text-sm">
                              <p>{site.siteContactName}</p>
                              {site.siteContactPhone && (
                                <p className="text-gray-500">{site.siteContactPhone}</p>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {site.pppoeUsername ? (
                            <span className="font-mono text-sm text-green-600">{site.pppoeUsername}</span>
                          ) : (
                            <span className="text-gray-400">Not generated</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(site.status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingSite(site);
                              setEditSheetOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PPPoE Tab */}
        <TabsContent value="pppoe" className="space-y-4 mt-6">
          {/* Credential Stats */}
          {credentialStats && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-500">Total Sites</p>
                  <p className="text-2xl font-bold">{credentialStats.totalSites}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-500">With Credentials</p>
                  <p className="text-2xl font-bold text-blue-600">{credentialStats.withCredentials}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-500">Provisioned</p>
                  <p className="text-2xl font-bold text-green-600">{credentialStats.provisioned}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{credentialStats.pending}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-500">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{credentialStats.failed}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                PPPoE Credential Management
              </CardTitle>
              <CardDescription>
                Generate and manage PPPoE credentials for all sites
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={handleGenerateCredentials}
                  disabled={generatingCredentials}
                >
                  {generatingCredentials ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Generate Missing Credentials
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportCredentials}
                  disabled={exportingCredentials || !credentialStats?.withCredentials}
                >
                  {exportingCredentials ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export Credentials CSV
                    </>
                  )}
                </Button>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Exported CSV contains decrypted passwords for router pre-configuration.
                  Handle this file securely and delete after use.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sites with Credentials */}
          <Card>
            <CardHeader>
              <CardTitle>Credential Status by Site</CardTitle>
            </CardHeader>
            <CardContent>
              {sitesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-blue-600 rounded-full mx-auto"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
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
                          <span className="font-mono font-semibold">{site.accountNumber}</span>
                        </TableCell>
                        <TableCell>{site.siteName}</TableCell>
                        <TableCell>
                          {site.pppoeUsername ? (
                            <span className="font-mono text-sm">{site.pppoeUsername}</span>
                          ) : (
                            <span className="text-gray-400 italic">Not generated</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {site.pppoeCredentialId ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Generated
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-600">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Site Edit Sheet */}
      <SiteEditSheet
        site={editingSite}
        corporateId={corporateId}
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        onSaved={() => {
          fetchSites();
          fetchCorporate();
        }}
      />
    </div>
  );
}
