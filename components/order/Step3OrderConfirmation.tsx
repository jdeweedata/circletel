'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Edit,
  User,
  Mail,
  Phone,
  MapPin,
  Wifi,
  DollarSign,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface ServicePackage {
  id: string;
  name: string;
  service_type: string;
  speed_down: number;
  speed_up: number;
  price: number;
  promotion_price?: number;
  promotion_months?: number;
  description: string;
  features: string[];
  installation_fee?: number;
  router_included?: boolean;
}

interface CustomerDetails {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  alternate_phone?: string;
  installation_address: string;
  suburb?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  special_instructions?: string;
  billing_same_as_installation: boolean;
  billing_address?: string;
  billing_suburb?: string;
  billing_city?: string;
  billing_province?: string;
  billing_postal_code?: string;
  preferred_installation_date?: string;
  contact_preference: 'email' | 'phone' | 'sms' | 'whatsapp';
  marketing_opt_in: boolean;
  whatsapp_opt_in: boolean;
}

interface Step3OrderConfirmationProps {
  package: ServicePackage;
  customerDetails: CustomerDetails;
  onEdit: (step: number) => void;
}

export function Step3OrderConfirmation({
  package: pkg,
  customerDetails,
  onEdit,
}: Step3OrderConfirmationProps) {
  const monthlyPrice = pkg.promotion_price || pkg.price;
  const installationFee = pkg.installation_fee || 0;
  const firstMonthTotal = monthlyPrice + installationFee;

  const formatAddress = (
    address: string,
    suburb?: string,
    city?: string,
    province?: string,
    postalCode?: string
  ): string => {
    const parts = [address, suburb, city, province, postalCode].filter(Boolean);
    return parts.join(', ');
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'As soon as possible';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getContactPreferenceLabel = (pref: string): string => {
    const labels = {
      email: 'Email',
      phone: 'Phone Call',
      sms: 'SMS',
      whatsapp: 'WhatsApp',
    };
    return labels[pref as keyof typeof labels] || pref;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Almost there!
              </h3>
              <p className="text-gray-600">
                Please review your order details carefully before submitting. You can edit any section by clicking the edit button.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Package Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-circleTel-orange" />
              Selected Package
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onEdit(1)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="font-semibold text-lg">{pkg.name}</p>
            <Badge variant="secondary" className="mt-1">
              {pkg.service_type}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Download Speed</p>
              <p className="font-semibold">{pkg.speed_down} Mbps</p>
            </div>
            <div>
              <p className="text-gray-500">Upload Speed</p>
              <p className="font-semibold">{pkg.speed_up} Mbps</p>
            </div>
          </div>

          <div className="pt-3 border-t">
            <div className="flex justify-between text-sm mb-2">
              <span>Monthly subscription</span>
              <span className="font-semibold">R{monthlyPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Installation fee</span>
              <span className="font-semibold">
                {installationFee > 0 ? `R${installationFee.toFixed(2)}` : 'Free'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-circleTel-orange" />
              Your Information
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onEdit(2)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Name</p>
              <p className="font-medium">
                {customerDetails.first_name} {customerDetails.last_name}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">
                <Mail className="w-3 h-3 inline mr-1" />
                Email
              </p>
              <p className="font-medium">{customerDetails.email}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">
                <Phone className="w-3 h-3 inline mr-1" />
                Phone
              </p>
              <p className="font-medium">{customerDetails.phone}</p>
              {customerDetails.alternate_phone && (
                <p className="text-sm text-gray-600">
                  Alt: {customerDetails.alternate_phone}
                </p>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Preferred Contact</p>
              <p className="font-medium">
                {getContactPreferenceLabel(customerDetails.contact_preference)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installation Address */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-circleTel-orange" />
              Installation Address
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onEdit(2)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="font-medium">
              {formatAddress(
                customerDetails.installation_address,
                customerDetails.suburb,
                customerDetails.city,
                customerDetails.province,
                customerDetails.postal_code
              )}
            </p>
          </div>

          {customerDetails.special_instructions && (
            <div className="pt-3 border-t">
              <p className="text-sm text-gray-500 mb-1">Special Instructions</p>
              <p className="text-sm">{customerDetails.special_instructions}</p>
            </div>
          )}

          {customerDetails.preferred_installation_date && (
            <div className="pt-3 border-t">
              <p className="text-sm text-gray-500 mb-1">
                <Calendar className="w-3 h-3 inline mr-1" />
                Preferred Installation Date
              </p>
              <p className="font-medium">
                {formatDate(customerDetails.preferred_installation_date)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Address */}
      {!customerDetails.billing_same_as_installation && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-circleTel-orange" />
                Billing Address
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onEdit(2)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {formatAddress(
                customerDetails.billing_address || '',
                customerDetails.billing_suburb,
                customerDetails.billing_city,
                customerDetails.billing_province,
                customerDetails.billing_postal_code
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Order Total */}
      <Card className="border-circleTel-orange bg-gradient-to-br from-orange-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-circleTel-orange" />
            Order Total
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Monthly subscription</span>
            <span className="font-semibold">R{monthlyPrice.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Installation fee</span>
            <span className="font-semibold">
              {installationFee > 0 ? `R${installationFee.toFixed(2)}` : 'Free'}
            </span>
          </div>

          <div className="pt-3 border-t flex justify-between items-center">
            <div>
              <p className="font-semibold text-lg">First Month Total</p>
              <p className="text-xs text-gray-500">One-time setup + first month</p>
            </div>
            <p className="text-2xl font-bold text-circleTel-orange">
              R{firstMonthTotal.toFixed(2)}
            </p>
          </div>

          <div className="pt-3 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
            <div className="flex justify-between items-center">
              <p className="text-sm">Then each month</p>
              <p className="text-lg font-bold">R{monthlyPrice.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-2">Important Information:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>By submitting this order, you agree to our terms and conditions</li>
                <li>You will receive a confirmation email at {customerDetails.email}</li>
                <li>Our team will contact you within 24 hours to schedule installation</li>
                <li>Installation is subject to site survey and technical feasibility</li>
                <li>Payment will be required before installation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences Summary */}
      {(customerDetails.marketing_opt_in || customerDetails.whatsapp_opt_in) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Communication Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {customerDetails.marketing_opt_in && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Marketing updates enabled</span>
              </div>
            )}
            {customerDetails.whatsapp_opt_in && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>WhatsApp notifications enabled</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
