'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Edit2,
} from 'lucide-react';
import { PhysicalAddress, getFICAStatusBadge } from '@/lib/types/profile';

interface PhysicalAddressSectionProps {
  address: PhysicalAddress | null;
  onEdit: () => void;
  isLoading?: boolean;
}

export function PhysicalAddressSection({
  address,
  onEdit,
  isLoading = false,
}: PhysicalAddressSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Physical Address (RICA & FICA)</CardTitle>
          <CardDescription>Loading address information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-circleTel-orange border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Physical Address (RICA & FICA)</CardTitle>
          <CardDescription>
            Registered address for compliance and billing purposes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-circleTel-secondaryNeutral mb-4">
              No physical address on file
            </p>
            <Button
              onClick={onEdit}
              className="bg-circleTel-orange hover:bg-circleTel-orange/90"
            >
              Add Physical Address
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const ficaBadge = getFICAStatusBadge(address.fica_status);

  const getBadgeStyles = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'blue':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'red':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (address.fica_status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4" />;
      case 'under_review':
        return <Clock className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      case 'expired':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Physical Address (RICA & FICA)</CardTitle>
          <CardDescription>
            Registered address for compliance and billing purposes
          </CardDescription>
        </div>
        <Button
          variant="outline"
          onClick={onEdit}
          className="text-circleTel-orange hover:bg-orange-50 border-circleTel-orange/20"
        >
          <Edit2 className="h-4 w-4 mr-2" />
          Edit Address
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mailing Address */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-circleTel-orange" />
            <h3 className="text-base font-semibold text-circleTel-darkNeutral">
              Mailing Address
            </h3>
          </div>
          <div className="pl-7 space-y-1 text-sm text-circleTel-secondaryNeutral">
            {address.mailing_street_address && (
              <p>{address.mailing_street_address}</p>
            )}
            {address.mailing_suburb && <p>{address.mailing_suburb}</p>}
            {address.mailing_city && address.mailing_province && (
              <p>
                {address.mailing_city}, {address.mailing_province}
              </p>
            )}
            {address.mailing_postal_code && <p>{address.mailing_postal_code}</p>}
          </div>
        </div>

        {/* Billing Address */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-circleTel-orange" />
            <h3 className="text-base font-semibold text-circleTel-darkNeutral">
              Billing Address
            </h3>
          </div>
          {address.billing_same_as_mailing ? (
            <div className="pl-7">
              <p className="text-sm text-circleTel-secondaryNeutral italic">
                Same as mailing address
              </p>
            </div>
          ) : (
            <div className="pl-7 space-y-1 text-sm text-circleTel-secondaryNeutral">
              {address.billing_street_address && (
                <p>{address.billing_street_address}</p>
              )}
              {address.billing_suburb && <p>{address.billing_suburb}</p>}
              {address.billing_city && address.billing_province && (
                <p>
                  {address.billing_city}, {address.billing_province}
                </p>
              )}
              {address.billing_postal_code && <p>{address.billing_postal_code}</p>}
            </div>
          )}
        </div>

        {/* Compliance Information */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-5 w-5 text-circleTel-orange" />
            <h3 className="text-base font-semibold text-circleTel-darkNeutral">
              Compliance Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* FICA Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-700">FICA Status</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Financial Intelligence Centre Act
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getBadgeStyles(
                  ficaBadge.color
                )}`}
              >
                {getStatusIcon()}
                {ficaBadge.label}
              </span>
            </div>

            {/* ID Number */}
            {address.id_number && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-700">ID Number</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {address.id_type === 'sa_id' && 'South African ID'}
                    {address.id_type === 'passport' && 'Passport'}
                    {address.id_type === 'asylum_seeker' && 'Asylum Seeker'}
                    {address.id_type === 'refugee' && 'Refugee'}
                  </p>
                </div>
                <p className="text-sm font-mono text-circleTel-darkNeutral">
                  {address.id_number.replace(/(\d{6})(\d{4})(\d{2})(\d)/, '$1 $2 $3 $4')}
                </p>
              </div>
            )}

            {/* Business Registration */}
            {address.business_registration_number && (
              <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Business Registration
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">CIPC Number</p>
                </div>
                <p className="text-sm font-mono text-circleTel-darkNeutral">
                  {address.business_registration_number}
                </p>
              </div>
            )}

            {/* Tax Reference Number */}
            {address.tax_reference_number && (
              <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Tax Reference Number
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">SARS TRN</p>
                </div>
                <p className="text-sm font-mono text-circleTel-darkNeutral">
                  {address.tax_reference_number}
                </p>
              </div>
            )}
          </div>

          {/* FICA Verified Info */}
          {address.fica_status === 'verified' && address.fica_verified_at && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-800">Compliance Verified</p>
                <p className="text-green-700 mt-1">
                  FICA verification completed on{' '}
                  {new Date(address.fica_verified_at).toLocaleDateString('en-ZA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                {address.fica_expiry_date && (
                  <p className="text-green-700 mt-1">
                    Expires on{' '}
                    {new Date(address.fica_expiry_date).toLocaleDateString('en-ZA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* FICA Pending/Warning */}
          {(address.fica_status === 'pending' ||
            address.fica_status === 'under_review') && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Verification Pending</p>
                <p className="text-yellow-700 mt-1">
                  Your compliance documents are being reviewed. This typically takes 1-2
                  business days.
                </p>
              </div>
            </div>
          )}

          {/* FICA Expired */}
          {address.fica_status === 'expired' && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-orange-800">Verification Expired</p>
                <p className="text-orange-700 mt-1">
                  Your FICA verification has expired. Please update your compliance
                  documents to continue using services.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 text-orange-700 border-orange-300 hover:bg-orange-100"
                  onClick={onEdit}
                >
                  Update Documents
                </Button>
              </div>
            </div>
          )}

          {/* FICA Rejected */}
          {address.fica_status === 'rejected' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800">Verification Rejected</p>
                <p className="text-red-700 mt-1">
                  Your compliance documents were rejected. Please contact support for
                  assistance or resubmit corrected documents.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-700 border-red-300 hover:bg-red-100"
                    onClick={onEdit}
                  >
                    Resubmit Documents
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-700 border-red-300 hover:bg-red-100"
                  >
                    Contact Support
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
