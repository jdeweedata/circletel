'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  PiArrowLeftBold,
  PiBuildingsBold,
  PiCheckBold,
  PiClipboardTextBold,
  PiFloppyDiskBold,
  PiMapPinBold,
  PiNetworkBold,
  PiTrashBold,
  PiUserBold,
  PiWifiHighBold,
  PiWarningCircleBold,
  PiCaretRightBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { SectionCard } from '@/components/admin/shared/SectionCard';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

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
  installationAddress?: { street?: string; city?: string; province?: string; postal_code?: string } | null;
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
  networkPath?: 'circletel_bng' | 'mtn_breakout' | null;
  technology?: 'tarana_fwb' | 'lte_5g' | 'ftth' | 'fwa' | null;
  taranaRnSerial?: string | null;
  ruijieApSerial?: string | null;
  ruijieApModel?: string | null;
  mikrotikSerial?: string | null;
  mtnRouterImei?: string | null;
  mtnRouterMac?: string | null;
  mtnStaticIp?: string | null;
  jobCardNumber?: string | null;
}

interface CorporateAccount {
  id: string;
  corporateCode: string;
  companyName: string;
}

// =============================================================================
// Constants
// =============================================================================

const SITE_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  { value: 'ready', label: 'Ready', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', dot: 'bg-cyan-500' },
  { value: 'provisioned', label: 'Provisioned', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  { value: 'active', label: 'Active', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  { value: 'suspended', label: 'Suspended', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  { value: 'decommissioned', label: 'Decommissioned', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
];

const PROVINCES = ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'];

const NETWORK_PATHS = [
  { value: 'circletel_bng', label: 'CircleTel BNG', desc: 'PPPoE via CircleTel ECHO SP' },
  { value: 'mtn_breakout', label: 'MTN Breakout', desc: 'Direct MTN LTE/5G internet' },
];

const TECHNOLOGIES = [
  { value: 'tarana_fwb', label: 'Tarana FWB' },
  { value: 'lte_5g', label: 'LTE/5G' },
  { value: 'ftth', label: 'FTTH' },
  { value: 'fwa', label: 'FWA' },
];

// =============================================================================
// Page Component
// =============================================================================

export default function SiteEditPage() {
  const params = useParams();
  const router = useRouter();
  const corporateId = params.id as string;
  const siteId = params.siteId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [site, setSite] = useState<CorporateSite | null>(null);
  const [corporate, setCorporate] = useState<CorporateAccount | null>(null);

  const [formData, setFormData] = useState({
    siteName: '', siteCode: '', siteContactName: '', siteContactEmail: '', siteContactPhone: '',
    status: 'pending',
    street: '', city: '', province: '', postalCode: '',
    hasRackFacility: false, hasAccessControl: false, hasAirConditioning: false, hasAcPower: false,
    rfiStatus: 'not_ready', rfiNotes: '', accessType: 'business_hours', accessInstructions: '',
    installedBy: '', routerSerial: '', routerModel: '',
    networkPath: '' as '' | 'circletel_bng' | 'mtn_breakout',
    technology: '' as '' | 'tarana_fwb' | 'lte_5g' | 'ftth' | 'fwa',
    taranaRnSerial: '', ruijieApSerial: '', ruijieApModel: '', mikrotikSerial: '',
    mtnRouterImei: '', mtnRouterMac: '', mtnStaticIp: '', jobCardNumber: '',
  });

  useEffect(() => { fetchData(); }, [corporateId, siteId]);

  const fetchData = async () => {
    try {
      setLoading(true);
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

      setFormData({
        siteName: siteData.siteName || '', siteCode: siteData.siteCode || '',
        siteContactName: siteData.siteContactName || '', siteContactEmail: siteData.siteContactEmail || '',
        siteContactPhone: siteData.siteContactPhone || '',
        status: siteData.status || 'pending',
        street: siteData.installationAddress?.street || '', city: siteData.installationAddress?.city || '',
        province: siteData.installationAddress?.province || siteData.province || '',
        postalCode: siteData.installationAddress?.postal_code || '',
        hasRackFacility: siteData.hasRackFacility || false, hasAccessControl: siteData.hasAccessControl || false,
        hasAirConditioning: siteData.hasAirConditioning || false, hasAcPower: siteData.hasAcPower || false,
        rfiStatus: siteData.rfiStatus || 'not_ready', rfiNotes: siteData.rfiNotes || '',
        accessType: siteData.accessType || 'business_hours', accessInstructions: siteData.accessInstructions || '',
        installedBy: siteData.installedBy || '', routerSerial: siteData.routerSerial || '', routerModel: siteData.routerModel || '',
        networkPath: siteData.networkPath || '', technology: siteData.technology || '',
        taranaRnSerial: siteData.taranaRnSerial || '', ruijieApSerial: siteData.ruijieApSerial || '',
        ruijieApModel: siteData.ruijieApModel || '', mikrotikSerial: siteData.mikrotikSerial || '',
        mtnRouterImei: siteData.mtnRouterImei || '', mtnRouterMac: siteData.mtnRouterMac || '',
        mtnStaticIp: siteData.mtnStaticIp || '', jobCardNumber: siteData.jobCardNumber || '',
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
        siteName: formData.siteName, siteCode: formData.siteCode || null,
        siteContactName: formData.siteContactName || null, siteContactEmail: formData.siteContactEmail || null,
        siteContactPhone: formData.siteContactPhone || null, status: formData.status,
        province: formData.province || null,
        installationAddress: { street: formData.street, city: formData.city, province: formData.province, postal_code: formData.postalCode },
        hasRackFacility: formData.hasRackFacility, hasAccessControl: formData.hasAccessControl,
        hasAirConditioning: formData.hasAirConditioning, hasAcPower: formData.hasAcPower,
        rfiStatus: formData.rfiStatus, rfiNotes: formData.rfiNotes || null,
        accessType: formData.accessType, accessInstructions: formData.accessInstructions || null,
        installedBy: formData.installedBy || null, routerSerial: formData.routerSerial || null, routerModel: formData.routerModel || null,
        networkPath: formData.networkPath || null, technology: formData.technology || null,
        taranaRnSerial: formData.taranaRnSerial || null, ruijieApSerial: formData.ruijieApSerial || null,
        ruijieApModel: formData.ruijieApModel || null, mikrotikSerial: formData.mikrotikSerial || null,
        mtnRouterImei: formData.mtnRouterImei || null, mtnRouterMac: formData.mtnRouterMac || null,
        mtnStaticIp: formData.mtnStaticIp || null, jobCardNumber: formData.jobCardNumber || null,
      };
      const response = await fetch(`/api/admin/corporate/${corporateId}/sites/${siteId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (!response.ok) { const err = await response.json(); throw new Error(err.error || 'Save failed'); }
      toast.success('Site updated successfully');
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this site? This action cannot be undone.')) return;
    try {
      const response = await fetch(`/api/admin/corporate/${corporateId}/sites/${siteId}`, { method: 'DELETE' });
      if (!response.ok) { const err = await response.json(); throw new Error(err.error || 'Delete failed'); }
      toast.success('Site deleted');
      router.push(`/admin/corporate/${corporateId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete');
    }
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const currentStatus = SITE_STATUSES.find(s => s.value === formData.status);

  // Section completion checks
  const isDetailsComplete = !!formData.siteName && !!formData.province;
  const isContactComplete = !!formData.siteContactName;
  const isRfiComplete = formData.rfiStatus === 'approved';
  const isInstallComplete = !!formData.installedBy || !!formData.routerSerial;
  const isNetworkComplete = !!formData.networkPath && !!formData.technology;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 -m-6 p-6 space-y-6">
        <div className="h-6 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="h-10 w-96 bg-slate-200 rounded animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-slate-100 rounded animate-pulse" />
              <div className="h-10 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!site || !corporate) {
    return (
      <div className="min-h-screen bg-slate-50 -m-6 p-6 flex items-center justify-center">
        <div className="text-center">
          <PiWarningCircleBold className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-900 mb-1">Site Not Found</p>
          <Button variant="outline" onClick={() => router.push(`/admin/corporate/${corporateId}`)}>
            <PiArrowLeftBold className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 -m-6 p-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link href="/admin" className="hover:text-slate-700">Admin</Link>
          <PiCaretRightBold className="w-3 h-3" />
          <Link href="/admin/corporate" className="hover:text-slate-700">Corporate</Link>
          <PiCaretRightBold className="w-3 h-3" />
          <Link href={`/admin/corporate/${corporateId}`} className="hover:text-slate-700">{corporate.companyName}</Link>
          <PiCaretRightBold className="w-3 h-3" />
          <span className="text-slate-900">{site.siteName}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/admin/corporate/${corporateId}`} className="text-slate-400 hover:text-slate-600">
              <PiArrowLeftBold className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">{site.siteName}</h1>
            <span className="font-mono text-sm font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-200">
              {site.accountNumber}
            </span>
            {currentStatus && (
              <Badge variant="outline" className={cn('text-xs border', currentStatus.color)}>
                <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', currentStatus.dot)} />
                {currentStatus.label}
              </Badge>
            )}
          </div>
          {site.pppoeUsername && (
            <span className="font-mono text-sm text-slate-500">{site.pppoeUsername}</span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Section 1: Status */}
        <SectionCard title="Site Status" icon={PiClipboardTextBold} compact>
          <div className="flex flex-wrap gap-3">
            {SITE_STATUSES.map(s => (
              <button
                key={s.value}
                onClick={() => updateField('status', s.value)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all',
                  formData.status === s.value
                    ? cn(s.color, 'border-current ring-2 ring-offset-1')
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                )}
              >
                <span className={cn('w-2 h-2 rounded-full', formData.status === s.value ? s.dot : 'bg-slate-300')} />
                {s.label}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Section 2: Site Details */}
        <FormSection title="Site Details" icon={PiMapPinBold} complete={isDetailsComplete}>
          <FieldGroup label="Site Name" required>
            <Input value={formData.siteName} onChange={e => updateField('siteName', e.target.value)} />
          </FieldGroup>
          <FieldGroup label="Site Code">
            <Input value={formData.siteCode} onChange={e => updateField('siteCode', e.target.value)} placeholder="Optional internal ref" />
          </FieldGroup>
          <FieldGroup label="Street Address">
            <Input value={formData.street} onChange={e => updateField('street', e.target.value)} />
          </FieldGroup>
          <FieldGroup label="City">
            <Input value={formData.city} onChange={e => updateField('city', e.target.value)} />
          </FieldGroup>
          <FieldGroup label="Province">
            <Select value={formData.province} onValueChange={v => updateField('province', v)}>
              <SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger>
              <SelectContent>
                {PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Postal Code">
            <Input value={formData.postalCode} onChange={e => updateField('postalCode', e.target.value)} />
          </FieldGroup>
        </FormSection>

        {/* Section 3: Site Contact */}
        <FormSection title="Site Contact" icon={PiUserBold} complete={isContactComplete}>
          <FieldGroup label="Contact Name">
            <Input value={formData.siteContactName} onChange={e => updateField('siteContactName', e.target.value)} />
          </FieldGroup>
          <FieldGroup label="Phone">
            <Input value={formData.siteContactPhone} onChange={e => updateField('siteContactPhone', e.target.value)} />
          </FieldGroup>
          <FieldGroup label="Email" className="md:col-span-2">
            <Input type="email" value={formData.siteContactEmail} onChange={e => updateField('siteContactEmail', e.target.value)} />
          </FieldGroup>
        </FormSection>

        {/* Section 4: Site Readiness (RFI) */}
        <FormSection title="Site Readiness (RFI)" icon={PiClipboardTextBold} complete={isRfiComplete}>
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            {[
              { field: 'hasRackFacility', label: 'Rack / Facility' },
              { field: 'hasAccessControl', label: 'Access Control' },
              { field: 'hasAirConditioning', label: 'Air Conditioning' },
              { field: 'hasAcPower', label: 'AC Power' },
            ].map(item => (
              <div key={item.field} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <Label className="text-sm text-slate-700">{item.label}</Label>
                <Switch
                  checked={formData[item.field as keyof typeof formData] as boolean}
                  onCheckedChange={v => updateField(item.field, v)}
                />
              </div>
            ))}
          </div>
          <FieldGroup label="RFI Status">
            <Select value={formData.rfiStatus} onValueChange={v => updateField('rfiStatus', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="not_ready">Not Ready</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Access Type">
            <Select value={formData.accessType} onValueChange={v => updateField('accessType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="business_hours">Business Hours</SelectItem>
                <SelectItem value="24_7">24/7 Access</SelectItem>
                <SelectItem value="appointment">By Appointment</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="RFI Notes" className="md:col-span-2">
            <Textarea value={formData.rfiNotes} onChange={e => updateField('rfiNotes', e.target.value)} rows={2} />
          </FieldGroup>
          <FieldGroup label="Access Instructions" className="md:col-span-2">
            <Textarea value={formData.accessInstructions} onChange={e => updateField('accessInstructions', e.target.value)} rows={2} />
          </FieldGroup>
        </FormSection>

        {/* Section 5: Installation */}
        <FormSection title="Installation Details" icon={PiWifiHighBold} complete={isInstallComplete}>
          <FieldGroup label="Installed By">
            <Input value={formData.installedBy} onChange={e => updateField('installedBy', e.target.value)} />
          </FieldGroup>
          <FieldGroup label="Job Card Number">
            <Input value={formData.jobCardNumber} onChange={e => updateField('jobCardNumber', e.target.value)} placeholder="e.g. JOB000168" />
          </FieldGroup>
          <FieldGroup label="Router Model">
            <Input value={formData.routerModel} onChange={e => updateField('routerModel', e.target.value)} />
          </FieldGroup>
          <FieldGroup label="Router Serial">
            <Input value={formData.routerSerial} onChange={e => updateField('routerSerial', e.target.value)} className="font-mono" />
          </FieldGroup>
          {site.pppoeUsername && (
            <FieldGroup label="PPPoE Username" className="md:col-span-2">
              <Input value={site.pppoeUsername} readOnly className="bg-slate-50 font-mono" />
            </FieldGroup>
          )}
        </FormSection>

        {/* Section 6: Network Infrastructure */}
        <FormSection title="Network Infrastructure" icon={PiNetworkBold} complete={isNetworkComplete}>
          <FieldGroup label="Network Path">
            <Select value={formData.networkPath} onValueChange={v => updateField('networkPath', v)}>
              <SelectTrigger><SelectValue placeholder="Select path" /></SelectTrigger>
              <SelectContent>
                {NETWORK_PATHS.map(p => (
                  <SelectItem key={p.value} value={p.value}>
                    <div>
                      <span className="font-medium">{p.label}</span>
                      <span className="text-xs text-slate-400 ml-2">{p.desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Technology">
            <Select value={formData.technology} onValueChange={v => updateField('technology', v)}>
              <SelectTrigger><SelectValue placeholder="Select technology" /></SelectTrigger>
              <SelectContent>
                {TECHNOLOGIES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldGroup>

          {/* Tarana fields */}
          {formData.technology === 'tarana_fwb' && (
            <FieldGroup label="Tarana RN Serial">
              <Input value={formData.taranaRnSerial} onChange={e => updateField('taranaRnSerial', e.target.value)} className="font-mono" />
            </FieldGroup>
          )}

          {/* Ruijie AP */}
          <FieldGroup label="Ruijie AP Serial">
            <Input value={formData.ruijieApSerial} onChange={e => updateField('ruijieApSerial', e.target.value)} className="font-mono" />
          </FieldGroup>
          <FieldGroup label="Ruijie AP Model">
            <Input value={formData.ruijieApModel} onChange={e => updateField('ruijieApModel', e.target.value)} />
          </FieldGroup>

          {/* MikroTik */}
          <FieldGroup label="MikroTik Serial">
            <Input value={formData.mikrotikSerial} onChange={e => updateField('mikrotikSerial', e.target.value)} className="font-mono" />
          </FieldGroup>

          {/* MTN Breakout fields */}
          {formData.networkPath === 'mtn_breakout' && (
            <>
              <FieldGroup label="MTN Router IMEI">
                <Input value={formData.mtnRouterImei} onChange={e => updateField('mtnRouterImei', e.target.value)} className="font-mono" />
              </FieldGroup>
              <FieldGroup label="MTN Router MAC">
                <Input value={formData.mtnRouterMac} onChange={e => updateField('mtnRouterMac', e.target.value)} className="font-mono" />
              </FieldGroup>
              <FieldGroup label="MTN Static IP">
                <Input value={formData.mtnStaticIp} onChange={e => updateField('mtnStaticIp', e.target.value)} className="font-mono" placeholder="e.g. 41.119.3.102" />
              </FieldGroup>
            </>
          )}
        </FormSection>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleDelete}>
            <PiTrashBold className="w-4 h-4 mr-2" />
            Delete Site
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push(`/admin/corporate/${corporateId}`)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.siteName}>
              {saving ? 'Saving...' : (
                <><PiFloppyDiskBold className="w-4 h-4 mr-2" />Save Changes</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function FormSection({
  title, icon: Icon, complete, children,
}: {
  title: string;
  icon: React.ElementType;
  complete?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(
      'bg-white rounded-xl border overflow-hidden',
      complete ? 'border-emerald-200' : 'border-slate-200'
    )}>
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3">
        <div className={cn(
          'w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold',
          complete ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
        )}>
          {complete ? <PiCheckBold className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
        </div>
        <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
        {complete && <Badge variant="outline" className="ml-auto text-xs bg-emerald-50 text-emerald-600 border-emerald-200">Complete</Badge>}
      </div>
      <div className="px-5 py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function FieldGroup({
  label, required, children, className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-sm text-slate-600">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}
