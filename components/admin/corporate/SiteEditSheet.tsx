'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, X, MapPin, User, Wifi } from 'lucide-react';
import { toast } from 'sonner';

interface CorporateSite {
  id: string;
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
}

interface SiteEditSheetProps {
  site: CorporateSite | null;
  corporateId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const SITE_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'ready', label: 'Ready', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'provisioned', label: 'Provisioned', color: 'bg-blue-100 text-blue-800' },
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'suspended', label: 'Suspended', color: 'bg-red-100 text-red-800' },
  { value: 'decommissioned', label: 'Decommissioned', color: 'bg-gray-100 text-gray-800' },
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

export function SiteEditSheet({
  site,
  corporateId,
  open,
  onOpenChange,
  onSaved,
}: SiteEditSheetProps) {
  const [saving, setSaving] = React.useState(false);
  const [formData, setFormData] = React.useState({
    siteName: '',
    siteContactName: '',
    siteContactEmail: '',
    siteContactPhone: '',
    status: 'pending',
    street: '',
    city: '',
    province: '',
    postalCode: '',
  });

  // Reset form when site changes
  React.useEffect(() => {
    if (site) {
      setFormData({
        siteName: site.siteName || '',
        siteContactName: site.siteContactName || '',
        siteContactEmail: site.siteContactEmail || '',
        siteContactPhone: site.siteContactPhone || '',
        status: site.status || 'pending',
        street: site.installationAddress?.street || '',
        city: site.installationAddress?.city || '',
        province: site.installationAddress?.province || site.province || '',
        postalCode: site.installationAddress?.postal_code || '',
      });
    }
  }, [site]);

  const handleSave = async () => {
    if (!site) return;

    setSaving(true);
    try {
      const payload = {
        siteName: formData.siteName,
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
      };

      const response = await fetch(
        `/api/admin/corporate/${corporateId}/sites/${site.id}`,
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
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating site:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update site');
    } finally {
      setSaving(false);
    }
  };

  if (!site) return null;

  const currentStatus = SITE_STATUSES.find((s) => s.value === formData.status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <SheetTitle className="flex items-center gap-2">
                Edit Site
                <span className="font-mono text-sm text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                  {site.accountNumber}
                </span>
              </SheetTitle>
              <SheetDescription>Update site details and status</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Section */}
          <div className="p-4 bg-slate-50 rounded-lg space-y-3">
            <Label className="text-sm font-semibold text-slate-700">Site Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {currentStatus && (
                    <Badge className={currentStatus.color}>{currentStatus.label}</Badge>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SITE_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <Badge className={status.color}>{status.label}</Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Changing status will update the corporate dashboard statistics
            </p>
          </div>

          {/* Site Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <MapPin className="w-4 h-4" />
              Site Details
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="siteName">Site Name *</Label>
                <Input
                  id="siteName"
                  value={formData.siteName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, siteName: e.target.value }))}
                  placeholder="e.g., Unjani Clinic - Soweto"
                />
              </div>
              <div>
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => setFormData((prev) => ({ ...prev, street: e.target.value }))}
                  placeholder="e.g., 123 Main Road"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                    placeholder="e.g., Soweto"
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData((prev) => ({ ...prev, postalCode: e.target.value }))}
                    placeholder="e.g., 1864"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="province">Province</Label>
                <Select
                  value={formData.province}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, province: value }))}
                >
                  <SelectTrigger>
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
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <User className="w-4 h-4" />
              Site Contact
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="siteContactName">Contact Name</Label>
                <Input
                  id="siteContactName"
                  value={formData.siteContactName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, siteContactName: e.target.value }))
                  }
                  placeholder="e.g., Sister Nomsa Dlamini"
                />
              </div>
              <div>
                <Label htmlFor="siteContactEmail">Contact Email</Label>
                <Input
                  id="siteContactEmail"
                  type="email"
                  value={formData.siteContactEmail}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, siteContactEmail: e.target.value }))
                  }
                  placeholder="e.g., nurse@unjaniclinics.co.za"
                />
              </div>
              <div>
                <Label htmlFor="siteContactPhone">Contact Phone</Label>
                <Input
                  id="siteContactPhone"
                  type="tel"
                  value={formData.siteContactPhone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, siteContactPhone: e.target.value }))
                  }
                  placeholder="e.g., 072 123 4567"
                />
              </div>
            </div>
          </div>

          {/* PPPoE Info (Read Only) */}
          {site.pppoeUsername && (
            <div className="p-4 bg-green-50 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                <Wifi className="w-4 h-4" />
                PPPoE Credentials
              </div>
              <p className="font-mono text-sm text-green-800">{site.pppoeUsername}</p>
              <p className="text-xs text-green-600">Username is auto-generated and read-only</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            className="flex-1 bg-orange-500 hover:bg-orange-600"
            onClick={handleSave}
            disabled={saving || !formData.siteName}
          >
            {saving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
