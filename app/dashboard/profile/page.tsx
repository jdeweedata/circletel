'use client';

import React, { useState } from 'react';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FloatingInput } from '@/components/ui/floating-input';
import { toast } from 'sonner';
import { User, Mail, Phone, Building2, FileText, Hash, Save, Edit2, X } from 'lucide-react';

export default function ProfilePage() {
  const { user, customer, refreshCustomer, session } = useCustomerAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    firstName: customer?.first_name || '',
    lastName: customer?.last_name || '',
    phone: customer?.phone || '',
    businessName: customer?.business_name || '',
    businessRegistration: customer?.business_registration || '',
    taxNumber: customer?.tax_number || '',
  });

  React.useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.first_name || '',
        lastName: customer.last_name || '',
        phone: customer.phone || '',
        businessName: customer.business_name || '',
        businessRegistration: customer.business_registration || '',
        taxNumber: customer.tax_number || '',
      });
    }
  }, [customer]);

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
      });
    }
    setIsEditing(false);
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
        <CardContent className="space-y-6">
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

          {/* Account Type Badge */}
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
        </CardContent>
      </Card>

      {/* Business Information (if business account) */}
      {isBusinessAccount && (
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>Your company details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Business Name */}
            <div className="space-y-2">
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
          </CardContent>
        </Card>
      )}

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
