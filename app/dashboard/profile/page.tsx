'use client';

import React, { useState, useEffect } from 'react';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FloatingInput } from '@/components/ui/floating-input';
import { toast } from 'sonner';
import { User, Mail, Phone, Building2, FileText, Hash, Save, Edit2, X, IdCard, Plus, Globe, MessageSquare, MapPin } from 'lucide-react';
import { ServiceAddressCard } from '@/components/dashboard/profile/ServiceAddressCard';
import { PhysicalAddressSection } from '@/components/dashboard/profile/PhysicalAddressSection';
import type { ServiceAddress, PhysicalAddress, LanguagePreference, PreferredContactMethod, LANGUAGE_NAMES } from '@/lib/types/profile';

const LANGUAGE_OPTIONS: { value: LanguagePreference; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'af', label: 'Afrikaans' },
  { value: 'zu', label: 'isiZulu' },
  { value: 'xh', label: 'isiXhosa' },
  { value: 'st', label: 'Sesotho' },
  { value: 'tn', label: 'Setswana' },
  { value: 'ss', label: 'siSwati' },
  { value: 'nr', label: 'isiNdebele' },
];

const CONTACT_METHOD_OPTIONS: { value: PreferredContactMethod; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

export default function ProfilePage() {
  const { user, customer, refreshCustomer, session } = useCustomerAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [serviceAddresses, setServiceAddresses] = useState<ServiceAddress[]>([]);
  const [physicalAddress, setPhysicalAddress] = useState<PhysicalAddress | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  const [formData, setFormData] = useState({
    firstName: customer?.first_name || '',
    lastName: customer?.last_name || '',
    phone: customer?.phone || '',
    businessName: customer?.business_name || '',
    businessRegistration: customer?.business_registration || '',
    taxNumber: customer?.tax_number || '',
    languagePreference: (customer?.language_preference || 'en') as LanguagePreference,
    preferredContactMethod: (customer?.preferred_contact_method || 'email') as PreferredContactMethod,
  });

  // Load customer data
  React.useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.first_name || '',
        lastName: customer.last_name || '',
        phone: customer.phone || '',
        businessName: customer.business_name || '',
        businessRegistration: customer.business_registration || '',
        taxNumber: customer.tax_number || '',
        languagePreference: (customer.language_preference || 'en') as LanguagePreference,
        preferredContactMethod: (customer.preferred_contact_method || 'email') as PreferredContactMethod,
      });
    }
  }, [customer]);

  // Load addresses
  useEffect(() => {
    async function loadAddresses() {
      if (!session?.access_token) return;

      try {
        setLoadingAddresses(true);

        // Load service addresses
        const serviceRes = await fetch('/api/profile/service-addresses', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (serviceRes.ok) {
          const data = await serviceRes.json();
          setServiceAddresses(data.addresses || []);
        }

        // Load physical address
        const physicalRes = await fetch('/api/profile/physical-address', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (physicalRes.ok) {
          const data = await physicalRes.json();
          setPhysicalAddress(data.address);
        }
      } catch (error) {
        console.error('Error loading addresses:', error);
      } finally {
        setLoadingAddresses(false);
      }
    }

    loadAddresses();
  }, [session]);

  const handleSave = async () => {
    console.log('[Profile] Starting save...', { hasSession: !!session, hasToken: !!session?.access_token });

    if (!session?.access_token) {
      console.error('[Profile] No session token available');
      toast.error('Please log in to update your profile');
      return;
    }

    setIsSaving(true);
    try {
      console.log('[Profile] Sending PUT request to /api/customers');
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          business_name: formData.businessName,
          business_registration: formData.businessRegistration,
          tax_number: formData.taxNumber,
          language_preference: formData.languagePreference,
          preferred_contact_method: formData.preferredContactMethod,
        }),
      });

      console.log('[Profile] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[Profile] API error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to update profile`);
      }

      const result = await response.json();
      console.log('[Profile] Update successful:', result);

      await refreshCustomer();
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('[Profile] Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (customer) {
      setFormData({
        firstName: customer.first_name || '',
        lastName: customer.last_name || '',
        phone: customer.phone || '',
        businessName: customer.business_name || '',
        businessRegistration: customer.business_registration || '',
        taxNumber: customer.tax_number || '',
        languagePreference: (customer.language_preference || 'en') as LanguagePreference,
        preferredContactMethod: (customer.preferred_contact_method || 'email') as PreferredContactMethod,
      });
    }
    setIsEditing(false);
  };

  const handleDeleteServiceAddress = async (id: string) => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(`/api/profile/service-addresses/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete service address');
      }

      setServiceAddresses((prev: ServiceAddress[]) => prev.filter((addr: ServiceAddress) => addr.id !== id));
      toast.success('Service address deleted');
    } catch (error) {
      console.error('Error deleting service address:', error);
      toast.error('Failed to delete service address');
    }
  };

  const accountType = customer?.account_type || 'personal';
  const isBusinessAccount = accountType === 'business';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-circleTel-darkNeutral mb-2">Profile</h1>
        <p className="text-circleTel-secondaryNeutral">
          Manage your account information and preferences
        </p>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your personal and contact details</CardDescription>
          </div>
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-circleTel-orange hover:bg-circleTel-orange/90"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-circleTel-orange hover:bg-circleTel-orange/90"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* 2-Column Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account Number (Read-only) - Full width */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <IdCard className="h-4 w-4 text-circleTel-orange" />
                Account Number
              </label>
              <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border-2 border-circleTel-orange/30">
                <p className="text-xl font-bold text-gray-900 tracking-wide">
                  {customer?.account_number || 'Not assigned'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Use this number when contacting support
                </p>
              </div>
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="h-4 w-4 text-circleTel-orange" />
                Email Address
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
            </div>

            {/* Account Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileText className="h-4 w-4 text-circleTel-orange" />
                Account Type
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  isBusinessAccount
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {isBusinessAccount ? 'Business' : 'Personal'}
                </span>
              </div>
            </div>

            {/* First Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4 text-circleTel-orange" />
                First Name
              </label>
              {isEditing ? (
                <FloatingInput
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Enter first name"
                  disabled={isSaving}
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-900">{customer?.first_name || 'Not set'}</p>
                </div>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4 text-circleTel-orange" />
                Last Name
              </label>
              {isEditing ? (
                <FloatingInput
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Enter last name"
                  disabled={isSaving}
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-900">{customer?.last_name || 'Not set'}</p>
                </div>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Phone className="h-4 w-4 text-circleTel-orange" />
                Phone Number
              </label>
              {isEditing ? (
                <FloatingInput
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                  disabled={isSaving}
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-900">{customer?.phone || 'Not set'}</p>
                </div>
              )}
            </div>

            {/* Language Preference */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Globe className="h-4 w-4 text-circleTel-orange" />
                Language Preference
              </label>
              {isEditing ? (
                <select
                  value={formData.languagePreference}
                  onChange={(e) => setFormData({ ...formData, languagePreference: e.target.value as LanguagePreference })}
                  disabled={isSaving}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-900">
                    {LANGUAGE_OPTIONS.find(opt => opt.value === customer?.language_preference)?.label || 'English'}
                  </p>
                </div>
              )}
            </div>

            {/* Preferred Contact Method */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-circleTel-orange" />
                Preferred Contact Method
              </label>
              {isEditing ? (
                <select
                  value={formData.preferredContactMethod}
                  onChange={(e) => setFormData({ ...formData, preferredContactMethod: e.target.value as PreferredContactMethod })}
                  disabled={isSaving}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
                >
                  {CONTACT_METHOD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-900">
                    {CONTACT_METHOD_OPTIONS.find(opt => opt.value === customer?.preferred_contact_method)?.label || 'Email'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Information (if business account) */}
      {isBusinessAccount && (
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>Your company details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Business Name */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-circleTel-orange" />
                  Business Name
                </label>
                {isEditing ? (
                  <FloatingInput
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="Enter business name"
                    disabled={isSaving}
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900">{customer?.business_name || 'Not set'}</p>
                  </div>
                )}
              </div>

              {/* Business Registration */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-circleTel-orange" />
                  Registration Number
                </label>
                {isEditing ? (
                  <FloatingInput
                    value={formData.businessRegistration}
                    onChange={(e) => setFormData({ ...formData, businessRegistration: e.target.value })}
                    placeholder="Enter registration number"
                    disabled={isSaving}
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900">{customer?.business_registration || 'Not set'}</p>
                  </div>
                )}
              </div>

              {/* Tax Number */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-circleTel-orange" />
                  Tax Number
                </label>
                {isEditing ? (
                  <FloatingInput
                    value={formData.taxNumber}
                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                    placeholder="Enter tax number"
                    disabled={isSaving}
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900">{customer?.tax_number || 'Not set'}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Addresses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Service Addresses</CardTitle>
            <CardDescription>Manage installation locations for your services</CardDescription>
          </div>
          <Button
            className="bg-circleTel-orange hover:bg-circleTel-orange/90"
            onClick={() => toast.info('Add service address modal coming soon!')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Address
          </Button>
        </CardHeader>
        <CardContent>
          {loadingAddresses ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-circleTel-orange border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : serviceAddresses.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-circleTel-secondaryNeutral mb-4">
                No service addresses yet
              </p>
              <Button
                className="bg-circleTel-orange hover:bg-circleTel-orange/90"
                onClick={() => toast.info('Add service address modal coming soon!')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Address
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceAddresses.map((address) => (
                <ServiceAddressCard
                  key={address.id}
                  address={address}
                  onEdit={() => toast.info('Edit service address modal coming soon!')}
                  onDelete={handleDeleteServiceAddress}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Physical Address (RICA & FICA) */}
      <PhysicalAddressSection
        address={physicalAddress}
        onEdit={() => toast.info('Edit physical address modal coming soon!')}
        isLoading={loadingAddresses}
      />

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
          <CardDescription>Your account verification and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <p className="font-medium text-gray-900">Email Verification</p>
              <p className="text-sm text-gray-600">
                {user?.email_confirmed_at ? 'Verified' : 'Not verified'}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              user?.email_confirmed_at
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {user?.email_confirmed_at ? 'Verified' : 'Pending'}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <p className="font-medium text-gray-900">Account Status</p>
              <p className="text-sm text-gray-600">
                {customer?.status || 'Active'}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
