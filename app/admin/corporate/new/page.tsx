'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, Save, Building2, User, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface CorporateFormData {
  corporateCode: string;
  companyName: string;
  tradingName: string;
  registrationNumber: string;
  vatNumber: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  primaryContactPosition: string;
  billingContactName: string;
  billingContactEmail: string;
  billingContactPhone: string;
  technicalContactName: string;
  technicalContactEmail: string;
  technicalContactPhone: string;
  physicalAddress: {
    street: string;
    city: string;
    province: string;
    postal_code: string;
  };
  industry: string;
  expectedSites: string;
  contractStartDate: string;
  contractEndDate: string;
  notes: string;
}

const INDUSTRIES = [
  'Healthcare',
  'Retail',
  'Manufacturing',
  'Education',
  'Financial Services',
  'Hospitality',
  'Government',
  'Non-Profit',
  'Technology',
  'Agriculture',
  'Other',
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

export default function NewCorporatePage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<CorporateFormData>({
    corporateCode: '',
    companyName: '',
    tradingName: '',
    registrationNumber: '',
    vatNumber: '',
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    primaryContactPosition: '',
    billingContactName: '',
    billingContactEmail: '',
    billingContactPhone: '',
    technicalContactName: '',
    technicalContactEmail: '',
    technicalContactPhone: '',
    physicalAddress: {
      street: '',
      city: '',
      province: '',
      postal_code: '',
    },
    industry: '',
    expectedSites: '',
    contractStartDate: '',
    contractEndDate: '',
    notes: '',
  });

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('physicalAddress.')) {
      const addressField = field.replace('physicalAddress.', '');
      setFormData((prev) => ({
        ...prev,
        physicalAddress: {
          ...prev.physicalAddress,
          [addressField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.corporateCode || !formData.companyName || !formData.primaryContactName || !formData.primaryContactEmail) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      const payload = {
        corporateCode: formData.corporateCode.toUpperCase(),
        companyName: formData.companyName,
        tradingName: formData.tradingName || undefined,
        registrationNumber: formData.registrationNumber || undefined,
        vatNumber: formData.vatNumber || undefined,
        primaryContactName: formData.primaryContactName,
        primaryContactEmail: formData.primaryContactEmail,
        primaryContactPhone: formData.primaryContactPhone || undefined,
        primaryContactPosition: formData.primaryContactPosition || undefined,
        billingContactName: formData.billingContactName || undefined,
        billingContactEmail: formData.billingContactEmail || undefined,
        billingContactPhone: formData.billingContactPhone || undefined,
        technicalContactName: formData.technicalContactName || undefined,
        technicalContactEmail: formData.technicalContactEmail || undefined,
        technicalContactPhone: formData.technicalContactPhone || undefined,
        physicalAddress: formData.physicalAddress.city
          ? formData.physicalAddress
          : undefined,
        industry: formData.industry || undefined,
        expectedSites: formData.expectedSites ? parseInt(formData.expectedSites) : undefined,
        contractStartDate: formData.contractStartDate || undefined,
        contractEndDate: formData.contractEndDate || undefined,
        notes: formData.notes || undefined,
      };

      const response = await fetch('/api/admin/corporate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create corporate');
      }

      toast.success('Corporate account created successfully');
      router.push(`/admin/corporate/${data.id}`);
    } catch (error) {
      console.error('Error creating corporate:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create corporate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Corporate Client</h1>
          <p className="text-gray-500 mt-1">Create a new enterprise multi-site account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
            <CardDescription>Basic company details and registration</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="corporateCode">
                Corporate Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="corporateCode"
                placeholder="e.g., UNJ"
                value={formData.corporateCode}
                onChange={(e) => handleInputChange('corporateCode', e.target.value.toUpperCase())}
                maxLength={10}
                className="uppercase"
                required
              />
              <p className="text-xs text-gray-500">
                Short code used in account numbers (e.g., CT-UNJ-001)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="companyName"
                placeholder="e.g., Unjani Clinics NPC"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tradingName">Trading Name</Label>
              <Input
                id="tradingName"
                placeholder="e.g., Unjani Clinics"
                value={formData.tradingName}
                onChange={(e) => handleInputChange('tradingName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => handleInputChange('industry', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationNumber">CIPC Registration Number</Label>
              <Input
                id="registrationNumber"
                placeholder="e.g., 2014/089277/08"
                value={formData.registrationNumber}
                onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vatNumber">VAT Number</Label>
              <Input
                id="vatNumber"
                placeholder="e.g., 4123456789"
                value={formData.vatNumber}
                onChange={(e) => handleInputChange('vatNumber', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Primary Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Primary Contact
            </CardTitle>
            <CardDescription>Main point of contact at headquarters</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryContactName">
                Contact Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="primaryContactName"
                placeholder="e.g., Lynda Toussaint"
                value={formData.primaryContactName}
                onChange={(e) => handleInputChange('primaryContactName', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryContactPosition">Position</Label>
              <Input
                id="primaryContactPosition"
                placeholder="e.g., CEO"
                value={formData.primaryContactPosition}
                onChange={(e) => handleInputChange('primaryContactPosition', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryContactEmail">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="primaryContactEmail"
                type="email"
                placeholder="e.g., ceo@company.com"
                value={formData.primaryContactEmail}
                onChange={(e) => handleInputChange('primaryContactEmail', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryContactPhone">Phone</Label>
              <Input
                id="primaryContactPhone"
                type="tel"
                placeholder="e.g., 082 123 4567"
                value={formData.primaryContactPhone}
                onChange={(e) => handleInputChange('primaryContactPhone', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Billing Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Billing Contact
            </CardTitle>
            <CardDescription>Finance department contact (optional)</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billingContactName">Contact Name</Label>
              <Input
                id="billingContactName"
                placeholder="e.g., Finance Manager"
                value={formData.billingContactName}
                onChange={(e) => handleInputChange('billingContactName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingContactEmail">Email</Label>
              <Input
                id="billingContactEmail"
                type="email"
                placeholder="e.g., finance@company.com"
                value={formData.billingContactEmail}
                onChange={(e) => handleInputChange('billingContactEmail', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingContactPhone">Phone</Label>
              <Input
                id="billingContactPhone"
                type="tel"
                placeholder="e.g., 082 123 4567"
                value={formData.billingContactPhone}
                onChange={(e) => handleInputChange('billingContactPhone', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Technical Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Technical Contact
            </CardTitle>
            <CardDescription>IT department contact (optional)</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="technicalContactName">Contact Name</Label>
              <Input
                id="technicalContactName"
                placeholder="e.g., IT Manager"
                value={formData.technicalContactName}
                onChange={(e) => handleInputChange('technicalContactName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="technicalContactEmail">Email</Label>
              <Input
                id="technicalContactEmail"
                type="email"
                placeholder="e.g., it@company.com"
                value={formData.technicalContactEmail}
                onChange={(e) => handleInputChange('technicalContactEmail', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="technicalContactPhone">Phone</Label>
              <Input
                id="technicalContactPhone"
                type="tel"
                placeholder="e.g., 082 123 4567"
                value={formData.technicalContactPhone}
                onChange={(e) => handleInputChange('technicalContactPhone', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Physical Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Headquarters Address
            </CardTitle>
            <CardDescription>Physical address of the head office</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                placeholder="e.g., 123 Main Road, Building A"
                value={formData.physicalAddress.street}
                onChange={(e) => handleInputChange('physicalAddress.street', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="e.g., Midrand"
                value={formData.physicalAddress.city}
                onChange={(e) => handleInputChange('physicalAddress.city', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="province">Province</Label>
              <Select
                value={formData.physicalAddress.province}
                onValueChange={(value) => handleInputChange('physicalAddress.province', value)}
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

            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                placeholder="e.g., 1685"
                value={formData.physicalAddress.postal_code}
                onChange={(e) => handleInputChange('physicalAddress.postal_code', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contract Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contract Details
            </CardTitle>
            <CardDescription>Deployment and contract information</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expectedSites">Expected Sites</Label>
              <Input
                id="expectedSites"
                type="number"
                placeholder="e.g., 252"
                value={formData.expectedSites}
                onChange={(e) => handleInputChange('expectedSites', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractStartDate">Contract Start Date</Label>
              <Input
                id="contractStartDate"
                type="date"
                value={formData.contractStartDate}
                onChange={(e) => handleInputChange('contractStartDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractEndDate">Contract End Date</Label>
              <Input
                id="contractEndDate"
                type="date"
                value={formData.contractEndDate}
                onChange={(e) => handleInputChange('contractEndDate', e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about the corporate client..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Corporate
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
