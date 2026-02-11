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
  Pencil,
  Target,
  FileText,
  Calendar,
  Globe,
  Shield,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

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

// Stat Card Component with gradient styling
function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  trend?: string;
}) {
  return (
    <div className="group relative bg-ui-card rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-ui-border overflow-hidden">
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-circleTel-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <p className="card-title">{label}</p>
          <p className="text-3xl font-bold text-ui-text-primary tracking-tight">{value}</p>
          {trend && (
            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

// Contact Card Component
function ContactCard({
  type,
  name,
  position,
  email,
  phone,
  icon: Icon,
  accentColor,
}: {
  type: string;
  name: string;
  position?: string | null;
  email?: string | null;
  phone?: string | null;
  icon: React.ElementType;
  accentColor: string;
}) {
  return (
    <div className="group relative bg-ui-card rounded-xl p-5 border border-ui-border hover:border-ui-text-muted/30 hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Accent line */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentColor} opacity-60 group-hover:opacity-100 transition-opacity`} />

      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg ${accentColor.replace('bg-', 'bg-').replace('-500', '-100')} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${accentColor.replace('bg-', 'text-')}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-ui-text-muted uppercase tracking-wider mb-1">{type}</p>
          <p className="font-semibold text-ui-text-primary truncate">{name}</p>
          {position && <p className="muted-text">{position}</p>}
          <div className="flex flex-col gap-1 mt-3">
            {email && (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-1.5 text-sm text-circleTel-orange hover:text-circleTel-warm-orange hover:underline transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span className="truncate">{email}</span>
              </a>
            )}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-1.5 body-text hover:text-ui-text-primary transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                {phone}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Info Row Component
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-ui-border last:border-0">
      <span className="muted-text">{label}</span>
      <span className="font-medium text-ui-text-primary text-right">{value || '—'}</span>
    </div>
  );
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

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Active' },
      provisioned: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Provisioned' },
      ready: { bg: 'bg-cyan-50', text: 'text-cyan-700', label: 'Ready' },
      pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' },
      suspended: { bg: 'bg-red-50', text: 'text-red-700', label: 'Suspended' },
      decommissioned: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Decommissioned' },
      archived: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Archived' },
    };
    const config = configs[status] || { bg: 'bg-slate-100', text: 'text-slate-600', label: status };
    return (
      <Badge className={`${config.bg} ${config.text} border-0 font-medium`}>
        {config.label}
      </Badge>
    );
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
              <Building2 className="w-6 h-6 text-orange-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-slate-500 mt-6 font-medium">Loading corporate details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not Found State
  if (!corporate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Corporate Not Found</h2>
            <p className="text-slate-500 mb-6">The corporate account you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/admin/corporate')} className="bg-orange-500 hover:bg-orange-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Corporates
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const deploymentProgress = corporate.expectedSites
    ? Math.round((corporate.totalSites / corporate.expectedSites) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 relative">
      {/* Subtle crosshatch pattern */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/admin/corporate')}
              className="rounded-xl hover:bg-white/80 shadow-sm border border-slate-100"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="page-title">
                  {corporate.companyName}
                </h1>
                <span className="font-mono text-sm font-bold text-circleTel-orange bg-circleTel-orange/10 px-3 py-1.5 rounded-lg border border-circleTel-orange/20">
                  {corporate.corporateCode}
                </span>
                {getStatusBadge(corporate.accountStatus)}
              </div>
              {corporate.tradingName && (
                <p className="muted-text">Trading as: {corporate.tradingName}</p>
              )}
              {corporate.industry && (
                <div className="flex items-center gap-2 mt-2">
                  <Globe className="w-4 h-4 text-ui-text-muted" />
                  <span className="muted-text">{corporate.industry}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/corporate/${corporateId}/edit`)}
              className="bg-white hover:bg-slate-50 border-slate-200"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Details
            </Button>
            <Button
              onClick={() => router.push(`/admin/corporate/${corporateId}/sites/new`)}
              className="bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Site
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Sites"
            value={corporate.totalSites}
            icon={MapPin}
            iconBg="bg-gradient-to-br from-violet-500 to-purple-600"
            iconColor="text-white"
          />
          <StatCard
            label="Active Sites"
            value={corporate.activeSites}
            icon={CheckCircle}
            iconBg="bg-gradient-to-br from-emerald-500 to-green-600"
            iconColor="text-white"
            trend={corporate.activeSites > 0 ? `${Math.round((corporate.activeSites / corporate.totalSites) * 100)}% of total` : undefined}
          />
          <StatCard
            label="Pending Sites"
            value={corporate.pendingSites}
            icon={Clock}
            iconBg="bg-gradient-to-br from-amber-500 to-orange-500"
            iconColor="text-white"
          />
          <StatCard
            label="Target Sites"
            value={corporate.expectedSites || '—'}
            icon={Target}
            iconBg="bg-gradient-to-br from-blue-500 to-indigo-600"
            iconColor="text-white"
            trend={corporate.expectedSites ? `${deploymentProgress}% deployed` : undefined}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-ui-card shadow-sm border border-ui-border p-1 rounded-xl">
            <TabsTrigger
              value="overview"
              className="rounded-lg data-[state=active]:bg-circleTel-orange data-[state=active]:text-white data-[state=active]:shadow-lg px-6 transition-all"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="sites"
              className="rounded-lg data-[state=active]:bg-circleTel-orange data-[state=active]:text-white data-[state=active]:shadow-lg px-6 transition-all"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Sites ({corporate.totalSites})
            </TabsTrigger>
            <TabsTrigger
              value="pppoe"
              className="rounded-lg data-[state=active]:bg-circleTel-orange data-[state=active]:text-white data-[state=active]:shadow-lg px-6 transition-all"
            >
              <Key className="w-4 h-4 mr-2" />
              PPPoE Credentials
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Company Details Card */}
              <div className="lg:col-span-2 bg-ui-card rounded-2xl shadow-sm border border-ui-border overflow-hidden">
                <div className="p-6 border-b border-ui-border bg-gradient-to-r from-ui-bg to-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ui-sidebar to-ui-text-primary flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="section-heading text-lg">Company Details</h3>
                      <p className="muted-text">Corporate registration and business info</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <InfoRow label="Registration Number" value={corporate.registrationNumber} />
                      <InfoRow label="VAT Number" value={corporate.vatNumber} />
                      <InfoRow label="Industry" value={corporate.industry} />
                      <InfoRow label="Account Status" value={getStatusBadge(corporate.accountStatus)} />
                    </div>
                    <div className="space-y-1">
                      <InfoRow label="Created" value={new Date(corporate.createdAt).toLocaleDateString()} />
                      <InfoRow label="Last Updated" value={new Date(corporate.updatedAt).toLocaleDateString()} />
                      <InfoRow label="Total Sites" value={corporate.totalSites} />
                      <InfoRow label="Active Sites" value={corporate.activeSites} />
                    </div>
                  </div>

                  {corporate.physicalAddress?.city && (
                    <div className="mt-6 pt-6 border-t border-ui-border">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-circleTel-orange/10 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-circleTel-orange" />
                        </div>
                        <div>
                          <p className="card-title mb-1">Headquarters</p>
                          <p className="text-ui-text-primary">
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
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contract Info Card */}
              <div className="bg-ui-card rounded-2xl shadow-sm border border-ui-border overflow-hidden">
                <div className="p-6 border-b border-ui-border bg-gradient-to-r from-circleTel-orange/10 to-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-circleTel-orange to-circleTel-warm-orange flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="section-heading text-lg">Contract</h3>
                      <p className="muted-text">Agreement details</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-ui-bg rounded-xl">
                    <Calendar className="w-5 h-5 text-ui-text-muted" />
                    <div>
                      <p className="muted-text-sm">Contract Period</p>
                      <p className="font-medium text-ui-text-primary">
                        {corporate.contractStartDate
                          ? new Date(corporate.contractStartDate).toLocaleDateString()
                          : 'Not set'}
                        {' — '}
                        {corporate.contractEndDate
                          ? new Date(corporate.contractEndDate).toLocaleDateString()
                          : 'Ongoing'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-ui-bg rounded-xl">
                    <Target className="w-5 h-5 text-ui-text-muted" />
                    <div>
                      <p className="muted-text-sm">Target Deployment</p>
                      <p className="font-medium text-ui-text-primary">
                        {corporate.expectedSites || '—'} sites
                      </p>
                    </div>
                  </div>

                  {corporate.expectedSites && (
                    <div className="pt-2">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="muted-text">Deployment Progress</span>
                        <span className="font-semibold text-circleTel-orange">{deploymentProgress}%</span>
                      </div>
                      <div className="h-2 bg-ui-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-circleTel-orange to-circleTel-warm-orange rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(deploymentProgress, 100)}%` }}
                        />
                      </div>
                      <p className="muted-text-sm mt-2">
                        {corporate.totalSites} of {corporate.expectedSites} sites deployed
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contacts Section */}
            <div className="bg-ui-card rounded-2xl shadow-sm border border-ui-border overflow-hidden">
              <div className="p-6 border-b border-ui-border bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="section-heading text-lg">Contacts</h3>
                    <p className="muted-text">Key personnel for this corporate account</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ContactCard
                    type="Primary Contact"
                    name={corporate.primaryContactName}
                    position={corporate.primaryContactPosition}
                    email={corporate.primaryContactEmail}
                    phone={corporate.primaryContactPhone}
                    icon={Shield}
                    accentColor="bg-orange-500"
                  />
                  {corporate.billingContactName && (
                    <ContactCard
                      type="Billing Contact"
                      name={corporate.billingContactName}
                      email={corporate.billingContactEmail}
                      phone={corporate.billingContactPhone}
                      icon={FileText}
                      accentColor="bg-emerald-500"
                    />
                  )}
                  {corporate.technicalContactName && (
                    <ContactCard
                      type="Technical Contact"
                      name={corporate.technicalContactName}
                      email={corporate.technicalContactEmail}
                      phone={corporate.technicalContactPhone}
                      icon={Key}
                      accentColor="bg-blue-500"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {corporate.notes && (
              <div className="bg-ui-card rounded-2xl shadow-sm border border-ui-border overflow-hidden">
                <div className="p-6 border-b border-ui-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ui-text-muted to-ui-text-secondary flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="section-heading text-lg">Notes</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="body-text whitespace-pre-wrap">{corporate.notes}</p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Sites Tab */}
          <TabsContent value="sites" className="space-y-4">
            <div className="bg-ui-card rounded-2xl shadow-sm border border-ui-border overflow-hidden">
              <div className="p-6 border-b border-ui-border">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h3 className="section-heading">Sites Directory</h3>
                    <p className="muted-text">{sites.length} sites registered</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search sites..."
                        value={siteSearch}
                        onChange={(e) => setSiteSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchSites()}
                        className="pl-10 w-64 bg-slate-50 border-slate-200 focus:bg-white"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/admin/corporate/${corporateId}/sites/bulk`)}
                      className="bg-white"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Bulk Import
                    </Button>
                    <Button
                      onClick={() => router.push(`/admin/corporate/${corporateId}/sites/new`)}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Site
                    </Button>
                  </div>
                </div>
              </div>

              {sitesLoading ? (
                <div className="text-center py-16">
                  <div className="w-10 h-10 border-3 border-circleTel-orange/30 border-t-circleTel-orange rounded-full animate-spin mx-auto"></div>
                  <p className="muted-text mt-4">Loading sites...</p>
                </div>
              ) : sites.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-ui-bg rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-8 w-8 text-ui-text-muted" />
                  </div>
                  <h3 className="font-medium text-ui-text-primary mb-1">No sites found</h3>
                  <p className="muted-text mb-4">Start by adding your first site</p>
                  <Button
                    onClick={() => router.push(`/admin/corporate/${corporateId}/sites/new`)}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Site
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-ui-bg/50">
                        <TableHead className="font-semibold text-ui-text-secondary">#</TableHead>
                        <TableHead className="font-semibold text-ui-text-secondary">Account Number</TableHead>
                        <TableHead className="font-semibold text-ui-text-secondary">Site Name</TableHead>
                        <TableHead className="font-semibold text-ui-text-secondary">Province</TableHead>
                        <TableHead className="font-semibold text-ui-text-secondary">Contact</TableHead>
                        <TableHead className="font-semibold text-ui-text-secondary">PPPoE</TableHead>
                        <TableHead className="font-semibold text-ui-text-secondary">Status</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sites.map((site) => (
                        <TableRow
                          key={site.id}
                          className="hover:bg-circleTel-orange/5 cursor-pointer transition-colors"
                          onClick={() => router.push(`/admin/corporate/${corporateId}/sites/${site.id}`)}
                        >
                          <TableCell className="font-medium text-ui-text-muted">{site.siteNumber}</TableCell>
                          <TableCell>
                            <span className="font-mono font-bold text-circleTel-orange bg-circleTel-orange/10 px-2 py-1 rounded">
                              {site.accountNumber}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-ui-text-primary">{site.siteName}</TableCell>
                          <TableCell className="text-ui-text-secondary">{site.province || '—'}</TableCell>
                          <TableCell>
                            {site.siteContactName ? (
                              <div className="text-sm">
                                <p className="font-medium text-ui-text-primary">{site.siteContactName}</p>
                                {site.siteContactPhone && (
                                  <p className="muted-text">{site.siteContactPhone}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-ui-text-muted">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {site.pppoeUsername ? (
                              <span className="font-mono text-sm text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                {site.pppoeUsername}
                              </span>
                            ) : (
                              <span className="muted-text text-sm">Not generated</span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(site.status)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-circleTel-orange/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/admin/corporate/${corporateId}/sites/${site.id}`);
                              }}
                            >
                              <Pencil className="h-4 w-4 text-ui-text-muted" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* PPPoE Tab */}
          <TabsContent value="pppoe" className="space-y-6">
            {/* Credential Stats */}
            {credentialStats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-ui-card rounded-xl p-5 shadow-sm border border-ui-border">
                  <p className="card-title mb-1">Total Sites</p>
                  <p className="text-2xl font-bold text-ui-text-primary">{credentialStats.totalSites}</p>
                </div>
                <div className="bg-ui-card rounded-xl p-5 shadow-sm border border-ui-border">
                  <p className="card-title mb-1">With Credentials</p>
                  <p className="text-2xl font-bold text-blue-600">{credentialStats.withCredentials}</p>
                </div>
                <div className="bg-ui-card rounded-xl p-5 shadow-sm border border-ui-border">
                  <p className="card-title mb-1">Provisioned</p>
                  <p className="text-2xl font-bold text-emerald-600">{credentialStats.provisioned}</p>
                </div>
                <div className="bg-ui-card rounded-xl p-5 shadow-sm border border-ui-border">
                  <p className="card-title mb-1">Pending</p>
                  <p className="text-2xl font-bold text-amber-600">{credentialStats.pending}</p>
                </div>
                <div className="bg-ui-card rounded-xl p-5 shadow-sm border border-ui-border">
                  <p className="card-title mb-1">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{credentialStats.failed}</p>
                </div>
              </div>
            )}

            {/* Actions Card */}
            <div className="bg-ui-card rounded-2xl shadow-sm border border-ui-border overflow-hidden">
              <div className="p-6 border-b border-ui-border bg-gradient-to-r from-green-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <Key className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="section-heading text-lg">PPPoE Credential Management</h3>
                    <p className="muted-text">Generate and export credentials for router configuration</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex flex-wrap gap-4">
                  <Button
                    onClick={handleGenerateCredentials}
                    disabled={generatingCredentials}
                    className="bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/25"
                  >
                    {generatingCredentials ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Missing Credentials
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportCredentials}
                    disabled={exportingCredentials || !credentialStats?.withCredentials}
                    className="bg-white"
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

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 text-sm">Security Notice</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Exported CSV contains decrypted passwords for router pre-configuration.
                      Handle this file securely and delete after use.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sites with Credentials Table */}
            <div className="bg-ui-card rounded-2xl shadow-sm border border-ui-border overflow-hidden">
              <div className="p-6 border-b border-ui-border">
                <h3 className="section-heading">Credential Status by Site</h3>
              </div>
              {sitesLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-circleTel-orange/30 border-t-circleTel-orange rounded-full animate-spin mx-auto"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-ui-bg/50">
                        <TableHead className="font-semibold text-ui-text-secondary">Account Number</TableHead>
                        <TableHead className="font-semibold text-ui-text-secondary">Site Name</TableHead>
                        <TableHead className="font-semibold text-ui-text-secondary">PPPoE Username</TableHead>
                        <TableHead className="font-semibold text-ui-text-secondary">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sites.map((site) => (
                        <TableRow key={site.id} className="hover:bg-ui-bg/50">
                          <TableCell>
                            <span className="font-mono font-bold text-circleTel-orange">{site.accountNumber}</span>
                          </TableCell>
                          <TableCell className="font-medium text-ui-text-primary">{site.siteName}</TableCell>
                          <TableCell>
                            {site.pppoeUsername ? (
                              <span className="font-mono text-sm text-ui-text-secondary">{site.pppoeUsername}</span>
                            ) : (
                              <span className="text-ui-text-muted italic">Not generated</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {site.pppoeCredentialId ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-0">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Generated
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-600 border-0">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
