'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  Save,
  MapPin,
  User,
  Wifi,
  Building2,
  Check,
  ClipboardCheck,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CorporateSite {
  id: string;
  corporateId: string;
  siteNumber: number;
  accountNumber: string;
  siteName: string;
  siteCode?: string | null;
  siteContactName?: string | null;
  siteContactEmail?: string | null;
  siteContactPhone?: string | null;
  province?: string | null;
  status: string;
  pppoeUsername?: string | null;
  installationAddress?: {
    street?: string;
    city?: string;
    province?: string;
    postal_code?: string;
  } | null;
  hasRackFacility?: boolean;
  hasAccessControl?: boolean;
  hasAirConditioning?: boolean;
  hasAcPower?: boolean;
  rfiStatus?: string;
  rfiNotes?: string | null;
  accessType?: string;
  accessInstructions?: string | null;
  installedAt?: string | null;
  installedBy?: string | null;
  routerSerial?: string | null;
  routerModel?: string | null;
}

interface CorporateAccount {
  id: string;
  corporateCode: string;
  companyName: string;
}

const SITE_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', description: 'Awaiting setup' },
  { value: 'ready', label: 'Ready', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', description: 'Ready for installation' },
  { value: 'provisioned', label: 'Provisioned', color: 'bg-blue-100 text-blue-700 border-blue-200', description: 'PPPoE credentials created' },
  { value: 'active', label: 'Active', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', description: 'Service is live' },
  { value: 'suspended', label: 'Suspended', color: 'bg-red-100 text-red-700 border-red-200', description: 'Service suspended' },
  { value: 'decommissioned', label: 'Decommissioned', color: 'bg-slate-100 text-slate-600 border-slate-200', description: 'Site removed' },
];

const PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
];

const ACCESS_TYPES = [
  { value: 'business_hours', label: 'Business Hours' },
  { value: '24_7', label: '24/7 Access' },
  { value: 'appointment', label: 'By Appointment' },
];

const RFI_STATUSES = [
  { value: 'not_ready', label: 'Not Ready' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
];

// Section component
function FormSection({
  number,
  title,
  description,
  icon: Icon,
  children,
  isComplete,
}: {
  number: number;
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isComplete?: boolean;
}) {
  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/80 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300",
            isComplete ? "bg-emerald-500 text-white" : "bg-orange-500 text-white"
          )}>
            {isComplete ? <Check className="w-5 h-5" /> : number}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          {children}
        </div>
      </div>
      <div className={cn(
        "absolute left-0 top-0 w-1 h-full rounded-l-2xl transition-all duration-300",
        isComplete ? "bg-emerald-500" : "bg-orange-500"
      )} />
    </div>
  );
}

export default function SiteEditPage() {
  const params = useParams();
  const router = useRouter();
  const corporateId = params.id as string;
  const siteId = params.siteId as string;

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [site, setSite] = React.useState<CorporateSite | null>(null);
  const [corporate, setCorporate] = React.useState<CorporateAccount | null>(null);

  const [formData, setFormData] = React.useState({
    siteName: '',
    siteCode: '',
    siteContactName: '',
    siteContactEmail: '',
    siteContactPhone: '',
    status: 'pending',
    street: '',
    city: '',
    province: '',
    postalCode: '',
    hasRackFacility: false,
    hasAccessControl: false,
    hasAirConditioning: false,
    hasAcPower: false,
    rfiStatus: 'not_ready',
    rfiNotes: '',
    accessType: 'business_hours',
    accessInstructions: '',
    installedBy: '',
    routerSerial: '',
    routerModel: '',
  });

  React.useEffect(() => {
    fetchData();
  }, [corporateId, siteId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch site and corporate data in parallel
      const [siteRes, corpRes] = await Promise.all([
        fetch(`/api/admin/corporate/${corporateId}/sites/${siteId}`),
        fetch(`/api/admin/corporate/${corporateId}`),
      ]);

      if (!siteRes.ok) throw new Error('Site not found');
      if (!corpRes.ok) throw new Error('Corporate not found');

      const siteData = await siteRes.json();
      const corpData = await corpRes.json();

      setSite(siteData);
      setCorporate(corpData);

      // Populate form
      setFormData({
        siteName: siteData.siteName || '',
        siteCode: siteData.siteCode || '',
        siteContactName: siteData.siteContactName || '',
        siteContactEmail: siteData.siteContactEmail || '',
        siteContactPhone: siteData.siteContactPhone || '',
        status: siteData.status || 'pending',
        street: siteData.installationAddress?.street || '',
        city: siteData.installationAddress?.city || '',
        province: siteData.installationAddress?.province || siteData.province || '',
        postalCode: siteData.installationAddress?.postal_code || '',
        hasRackFacility: siteData.hasRackFacility || false,
        hasAccessControl: siteData.hasAccessControl || false,
        hasAirConditioning: siteData.hasAirConditioning || false,
        hasAcPower: siteData.hasAcPower || false,
        rfiStatus: siteData.rfiStatus || 'not_ready',
        rfiNotes: siteData.rfiNotes || '',
        accessType: siteData.accessType || 'business_hours',
        accessInstructions: siteData.accessInstructions || '',
        installedBy: siteData.installedBy || '',
        routerSerial: siteData.routerSerial || '',
        routerModel: siteData.routerModel || '',
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load site data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!site) return;

    setSaving(true);
    try {
      const payload = {
        siteName: formData.siteName,
        siteCode: formData.siteCode || null,
        siteContactName: formData.siteContactName || null,
        siteContactEmail: formData.siteContactEmail || null,
        siteContactPhone: formData.siteContactPhone || null,
        status: formData.status,
        province: formData.province || null,
        installationAddress: {
          street: formData.street,
          city: formData.city,
          province: formData.province,
          postal_code: formData.postalCode,
        },
        hasRackFacility: formData.hasRackFacility,
        hasAccessControl: formData.hasAccessControl,
        hasAirConditioning: formData.hasAirConditioning,
        hasAcPower: formData.hasAcPower,
        rfiStatus: formData.rfiStatus,
        rfiNotes: formData.rfiNotes || null,
        accessType: formData.accessType,
        accessInstructions: formData.accessInstructions || null,
        installedBy: formData.installedBy || null,
        routerSerial: formData.routerSerial || null,
        routerModel: formData.routerModel || null,
      };

      const response = await fetch(
        `/api/admin/corporate/${corporateId}/sites/${siteId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update site');
      }

      toast.success('Site updated successfully');
      router.push(`/admin/corporate/${corporateId}`);
    } catch (error) {
      console.error('Error updating site:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update site');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-orange-500 animate-spin mx-auto" />
          <p className="text-slate-500 mt-4">Loading site details...</p>
        </div>
      </div>
    );
  }

  if (!site || !corporate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 mt-4">Site not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const currentStatus = SITE_STATUSES.find((s) => s.value === formData.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      {/* Background pattern */}
      <div
        className="fixed inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <header className="mb-8">
          <button
            type="button"
            onClick={() => router.push(`/admin/corporate/${corporateId}`)}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to {corporate.companyName}</span>
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-slate-900">Edit Site</h1>
                  <span className="font-mono text-sm font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
                    {site.accountNumber}
                  </span>
                </div>
                <p className="text-slate-500">{site.siteName}</p>
              </div>
            </div>

            {/* Current Status */}
            {currentStatus && (
              <Badge className={cn('text-sm px-3 py-1.5 border', currentStatus.color)}>
                {currentStatus.label}
              </Badge>
            )}
          </div>
        </header>

        {/* Form */}
        <div className="space-y-6">
          {/* Section 1: Status */}
          <FormSection
            number={1}
            title="Site Status"
            description="Update the deployment status of this site"
            icon={Check}
            isComplete={formData.status === 'active'}
          >
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-slate-700 mb-3 block">Current Status</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SITE_STATUSES.map((status) => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, status: status.value }))}
                    className={cn(
                      "p-3 rounded-xl border-2 text-left transition-all",
                      formData.status === status.value
                        ? "border-orange-500 bg-orange-50"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    )}
                  >
                    <Badge className={cn('text-xs', status.color)}>{status.label}</Badge>
                    <p className="text-xs text-slate-500 mt-1.5">{status.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </FormSection>

          {/* Section 2: Site Details */}
          <FormSection
            number={2}
            title="Site Details"
            description="Basic information about this location"
            icon={MapPin}
            isComplete={!!formData.siteName && !!formData.city}
          >
            <div>
              <Label htmlFor="siteName">Site Name *</Label>
              <Input
                id="siteName"
                value={formData.siteName}
                onChange={(e) => setFormData((prev) => ({ ...prev, siteName: e.target.value }))}
                placeholder="e.g., Unjani Clinic - Soweto"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="siteCode">Site Code (Internal Reference)</Label>
              <Input
                id="siteCode"
                value={formData.siteCode}
                onChange={(e) => setFormData((prev) => ({ ...prev, siteCode: e.target.value }))}
                placeholder="e.g., SOW-001"
                className="mt-1.5"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => setFormData((prev) => ({ ...prev, street: e.target.value }))}
                placeholder="e.g., Cnr Immink Drive & Ndaba Street, Diepkloof Zone 6"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                placeholder="e.g., Soweto"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                value={formData.postalCode}
                onChange={(e) => setFormData((prev) => ({ ...prev, postalCode: e.target.value }))}
                placeholder="e.g., 1864"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="province">Province</Label>
              <Select
                value={formData.province}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, province: value }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FormSection>

          {/* Section 3: Site Contact */}
          <FormSection
            number={3}
            title="Site Contact"
            description="Local contact person at this site"
            icon={User}
            isComplete={!!formData.siteContactName}
          >
            <div>
              <Label htmlFor="siteContactName">Contact Name</Label>
              <Input
                id="siteContactName"
                value={formData.siteContactName}
                onChange={(e) => setFormData((prev) => ({ ...prev, siteContactName: e.target.value }))}
                placeholder="e.g., Sister Nomsa Dlamini"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="siteContactPhone">Contact Phone</Label>
              <Input
                id="siteContactPhone"
                type="tel"
                value={formData.siteContactPhone}
                onChange={(e) => setFormData((prev) => ({ ...prev, siteContactPhone: e.target.value }))}
                placeholder="e.g., 072 123 4567"
                className="mt-1.5"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="siteContactEmail">Contact Email</Label>
              <Input
                id="siteContactEmail"
                type="email"
                value={formData.siteContactEmail}
                onChange={(e) => setFormData((prev) => ({ ...prev, siteContactEmail: e.target.value }))}
                placeholder="e.g., nurse@unjaniclinics.co.za"
                className="mt-1.5"
              />
            </div>
          </FormSection>

          {/* Section 4: Site Readiness (RFI) */}
          <FormSection
            number={4}
            title="Site Readiness (RFI)"
            description="Infrastructure readiness checklist"
            icon={ClipboardCheck}
            isComplete={formData.rfiStatus === 'approved'}
          >
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <Label htmlFor="hasRackFacility" className="cursor-pointer">Rack Facility</Label>
                  <Switch
                    id="hasRackFacility"
                    checked={formData.hasRackFacility}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, hasRackFacility: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <Label htmlFor="hasAccessControl" className="cursor-pointer">Access Control</Label>
                  <Switch
                    id="hasAccessControl"
                    checked={formData.hasAccessControl}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, hasAccessControl: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <Label htmlFor="hasAirConditioning" className="cursor-pointer">Air Conditioning</Label>
                  <Switch
                    id="hasAirConditioning"
                    checked={formData.hasAirConditioning}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, hasAirConditioning: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <Label htmlFor="hasAcPower" className="cursor-pointer">AC Power Available</Label>
                  <Switch
                    id="hasAcPower"
                    checked={formData.hasAcPower}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, hasAcPower: checked }))}
                  />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="rfiStatus">RFI Status</Label>
              <Select
                value={formData.rfiStatus}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, rfiStatus: value }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RFI_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="accessType">Access Type</Label>
              <Select
                value={formData.accessType}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, accessType: value }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCESS_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="accessInstructions">Access Instructions</Label>
              <Textarea
                id="accessInstructions"
                value={formData.accessInstructions}
                onChange={(e) => setFormData((prev) => ({ ...prev, accessInstructions: e.target.value }))}
                placeholder="Special instructions for accessing this site..."
                className="mt-1.5"
                rows={2}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="rfiNotes">RFI Notes</Label>
              <Textarea
                id="rfiNotes"
                value={formData.rfiNotes}
                onChange={(e) => setFormData((prev) => ({ ...prev, rfiNotes: e.target.value }))}
                placeholder="Additional notes about site readiness..."
                className="mt-1.5"
                rows={2}
              />
            </div>
          </FormSection>

          {/* Section 5: Installation Details */}
          <FormSection
            number={5}
            title="Installation Details"
            description="Router and installation information"
            icon={Wifi}
            isComplete={!!formData.routerSerial}
          >
            <div>
              <Label htmlFor="installedBy">Installed By</Label>
              <Input
                id="installedBy"
                value={formData.installedBy}
                onChange={(e) => setFormData((prev) => ({ ...prev, installedBy: e.target.value }))}
                placeholder="e.g., John Smith"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="routerModel">Router Model</Label>
              <Input
                id="routerModel"
                value={formData.routerModel}
                onChange={(e) => setFormData((prev) => ({ ...prev, routerModel: e.target.value }))}
                placeholder="e.g., MikroTik hAP ac²"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="routerSerial">Router Serial Number</Label>
              <Input
                id="routerSerial"
                value={formData.routerSerial}
                onChange={(e) => setFormData((prev) => ({ ...prev, routerSerial: e.target.value }))}
                placeholder="e.g., D4CA6D123456"
                className="mt-1.5"
              />
            </div>
            {site.pppoeUsername && (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 mb-1">
                  <Wifi className="w-4 h-4" />
                  PPPoE Username
                </div>
                <p className="font-mono text-emerald-800">{site.pppoeUsername}</p>
                <p className="text-xs text-emerald-600 mt-1">Auto-generated, read-only</p>
              </div>
            )}
          </FormSection>

          {/* Submit Area */}
          <div className="sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-slate-50 via-white/95 to-transparent -mx-4 px-4 sm:-mx-6 sm:px-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-lg shadow-slate-200/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{corporate.companyName}</p>
                  <p className="text-xs text-slate-500">{site.accountNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/admin/corporate/${corporateId}`)}
                  disabled={saving}
                  className="flex-1 sm:flex-initial h-11 border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !formData.siteName}
                  className="flex-1 sm:flex-initial h-11 gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/25"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
