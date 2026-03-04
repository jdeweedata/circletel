'use client';
import { PiBuildingsBold, PiEnvelopeBold, PiMagnifyingGlassBold, PiMapPinBold, PiPhoneBold, PiSpinnerBold, PiUserBold } from 'react-icons/pi';

/**
 * Step 6: Customer Details
 *
 * Capture company and contact information
 */

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { CPQStepProps } from '../CPQWizard';
import type { CustomerDetailsData, CustomerContact } from '@/lib/cpq/types';

export function CustomerDetailsStep({
  session,
  stepData,
  onUpdateStepData,
  isSaving,
}: CPQStepProps) {
  const data = stepData.customer_details || {
    company_name: '',
    primary_contact: {},
  };
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Update a field
  const handleFieldUpdate = useCallback(
    (field: keyof CustomerDetailsData, value: unknown) => {
      onUpdateStepData('customer_details', { [field]: value });
    },
    [onUpdateStepData]
  );

  // Update contact field
  const handleContactUpdate = useCallback(
    (contactType: 'primary_contact' | 'secondary_contact', field: keyof CustomerContact, value: string) => {
      const existingContact = data[contactType] || {};
      onUpdateStepData('customer_details', {
        [contactType]: { ...existingContact, [field]: value },
      });
    },
    [data, onUpdateStepData]
  );

  // Search for existing customer
  const handleSearchCustomer = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/customers/search?q=${encodeURIComponent(searchQuery)}&type=business`
      );
      const result = await response.json();

      if (result.customers && result.customers.length > 0) {
        // Auto-fill with first result
        const customer = result.customers[0];
        onUpdateStepData('customer_details', {
          company_name: customer.company_name || customer.name,
          registration_number: customer.registration_number,
          vat_number: customer.vat_number,
          billing_address: customer.billing_address || customer.address,
          primary_contact: {
            name: customer.contact_name,
            email: customer.email,
            phone: customer.phone,
          },
        });
        toast.success('Customer found and loaded');
      } else {
        toast.info('No existing customer found');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search customers');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, onUpdateStepData]);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Customer Details</h2>
        <p className="text-sm text-gray-500">
          Enter company and contact information for the quote
        </p>
      </div>

      {/* Customer Search */}
      <div className="bg-gray-50 rounded-lg p-4 border">
        <Label className="text-sm font-medium">Search Existing Customer</Label>
        <div className="flex gap-2 mt-2">
          <Input
            placeholder="Search by company name, reg number, or email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchCustomer()}
          />
          <Button
            variant="outline"
            onClick={handleSearchCustomer}
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? (
              <PiSpinnerBold className="h-4 w-4 animate-spin" />
            ) : (
              <PiMagnifyingGlassBold className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Company Information */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <PiBuildingsBold className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Company Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="company_name">
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="company_name"
              placeholder="Enter company name"
              value={data.company_name || ''}
              onChange={(e) => handleFieldUpdate('company_name', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registration_number">Registration Number</Label>
            <Input
              id="registration_number"
              placeholder="e.g., 2024/123456/07"
              value={data.registration_number || ''}
              onChange={(e) => handleFieldUpdate('registration_number', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vat_number">VAT Number</Label>
            <Input
              id="vat_number"
              placeholder="e.g., 4123456789"
              value={data.vat_number || ''}
              onChange={(e) => handleFieldUpdate('vat_number', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              placeholder="e.g., Finance, Retail, Healthcare"
              value={data.industry || ''}
              onChange={(e) => handleFieldUpdate('industry', e.target.value)}
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="billing_address">Billing Address</Label>
            <Textarea
              id="billing_address"
              placeholder="Enter billing address"
              rows={2}
              value={data.billing_address || ''}
              onChange={(e) => handleFieldUpdate('billing_address', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Primary Contact */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <PiUserBold className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Primary Contact</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primary_name">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <PiUserBold className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="primary_name"
                className="pl-10"
                placeholder="Enter full name"
                value={data.primary_contact?.name || ''}
                onChange={(e) => handleContactUpdate('primary_contact', 'name', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary_role">Role / Title</Label>
            <Input
              id="primary_role"
              placeholder="e.g., IT Manager"
              value={data.primary_contact?.role || ''}
              onChange={(e) => handleContactUpdate('primary_contact', 'role', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary_email">
              Email <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <PiEnvelopeBold className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="primary_email"
                type="email"
                className="pl-10"
                placeholder="email@company.com"
                value={data.primary_contact?.email || ''}
                onChange={(e) => handleContactUpdate('primary_contact', 'email', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary_phone">Phone Number</Label>
            <div className="relative">
              <PiPhoneBold className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="primary_phone"
                type="tel"
                className="pl-10"
                placeholder="+27 XX XXX XXXX"
                value={data.primary_contact?.phone || ''}
                onChange={(e) => handleContactUpdate('primary_contact', 'phone', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Contact (Optional) */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <PiUserBold className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Secondary Contact (Optional)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="secondary_name">Full Name</Label>
            <Input
              id="secondary_name"
              placeholder="Enter full name"
              value={data.secondary_contact?.name || ''}
              onChange={(e) => handleContactUpdate('secondary_contact', 'name', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary_role">Role / Title</Label>
            <Input
              id="secondary_role"
              placeholder="e.g., Finance Manager"
              value={data.secondary_contact?.role || ''}
              onChange={(e) => handleContactUpdate('secondary_contact', 'role', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary_email">Email</Label>
            <div className="relative">
              <PiEnvelopeBold className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="secondary_email"
                type="email"
                className="pl-10"
                placeholder="email@company.com"
                value={data.secondary_contact?.email || ''}
                onChange={(e) => handleContactUpdate('secondary_contact', 'email', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary_phone">Phone Number</Label>
            <div className="relative">
              <PiPhoneBold className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="secondary_phone"
                type="tel"
                className="pl-10"
                placeholder="+27 XX XXX XXXX"
                value={data.secondary_contact?.phone || ''}
                onChange={(e) => handleContactUpdate('secondary_contact', 'phone', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg border p-6">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          className="mt-2"
          placeholder="Any additional information about the customer..."
          rows={3}
          value={data.notes || ''}
          onChange={(e) => handleFieldUpdate('notes', e.target.value)}
        />
      </div>
    </div>
  );
}
