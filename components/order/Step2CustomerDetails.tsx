'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Mail, Phone, MapPin, Calendar, MessageSquare } from 'lucide-react';

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

interface Step2CustomerDetailsProps {
  details: CustomerDetails;
  onChange: (details: Partial<CustomerDetails>) => void;
}

const PROVINCES = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
];

export function Step2CustomerDetails({ details, onChange }: Step2CustomerDetailsProps) {
  const handleChange = (field: keyof CustomerDetails, value: any) => {
    onChange({ [field]: value });
  };

  const handleBillingSameChange = (checked: boolean) => {
    onChange({
      billing_same_as_installation: checked,
      ...(checked ? {
        billing_address: '',
        billing_suburb: '',
        billing_city: '',
        billing_province: '',
        billing_postal_code: '',
      } : {}),
    });
  };

  // Calculate min date (tomorrow) and max date (30 days from now)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-circleTel-orange" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="first_name"
                value={details.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                placeholder="John"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="last_name"
                value={details.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              <Mail className="w-4 h-4 inline mr-1" />
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={details.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="john.doe@example.com"
              required
            />
            <p className="text-xs text-gray-500">
              We'll send your order confirmation here
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={details.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="082 123 4567"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alternate_phone">
                Alternate Phone
              </Label>
              <Input
                id="alternate_phone"
                type="tel"
                value={details.alternate_phone || ''}
                onChange={(e) => handleChange('alternate_phone', e.target.value)}
                placeholder="011 234 5678"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installation Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-circleTel-orange" />
            Installation Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="installation_address">
              Street Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="installation_address"
              value={details.installation_address}
              onChange={(e) => handleChange('installation_address', e.target.value)}
              placeholder="123 Main Street"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="suburb">Suburb</Label>
              <Input
                id="suburb"
                value={details.suburb || ''}
                onChange={(e) => handleChange('suburb', e.target.value)}
                placeholder="Sandton"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={details.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Johannesburg"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="province">Province</Label>
              <Select
                value={details.province || ''}
                onValueChange={(value) => handleChange('province', value)}
              >
                <SelectTrigger id="province">
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
                value={details.postal_code || ''}
                onChange={(e) => handleChange('postal_code', e.target.value)}
                placeholder="2196"
                maxLength={4}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="special_instructions">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Special Instructions
            </Label>
            <Textarea
              id="special_instructions"
              value={details.special_instructions || ''}
              onChange={(e) => handleChange('special_instructions', e.target.value)}
              placeholder="Gate code, parking instructions, complex name, etc."
              rows={3}
            />
            <p className="text-xs text-gray-500">
              Help our technicians find you easily
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Billing Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-circleTel-orange" />
            Billing Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="billing_same"
              checked={details.billing_same_as_installation}
              onCheckedChange={handleBillingSameChange}
            />
            <Label
              htmlFor="billing_same"
              className="text-sm font-normal cursor-pointer"
            >
              Same as installation address
            </Label>
          </div>

          {!details.billing_same_as_installation && (
            <>
              <div className="space-y-2">
                <Label htmlFor="billing_address">
                  Street Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="billing_address"
                  value={details.billing_address || ''}
                  onChange={(e) => handleChange('billing_address', e.target.value)}
                  placeholder="456 Billing Street"
                  required={!details.billing_same_as_installation}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billing_suburb">Suburb</Label>
                  <Input
                    id="billing_suburb"
                    value={details.billing_suburb || ''}
                    onChange={(e) => handleChange('billing_suburb', e.target.value)}
                    placeholder="Rosebank"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billing_city">City</Label>
                  <Input
                    id="billing_city"
                    value={details.billing_city || ''}
                    onChange={(e) => handleChange('billing_city', e.target.value)}
                    placeholder="Johannesburg"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billing_province">Province</Label>
                  <Select
                    value={details.billing_province || ''}
                    onValueChange={(value) => handleChange('billing_province', value)}
                  >
                    <SelectTrigger id="billing_province">
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
                  <Label htmlFor="billing_postal_code">Postal Code</Label>
                  <Input
                    id="billing_postal_code"
                    value={details.billing_postal_code || ''}
                    onChange={(e) => handleChange('billing_postal_code', e.target.value)}
                    placeholder="2196"
                    maxLength={4}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-circleTel-orange" />
            Installation & Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preferred_installation_date">
              Preferred Installation Date
            </Label>
            <Input
              id="preferred_installation_date"
              type="date"
              value={details.preferred_installation_date || ''}
              onChange={(e) => handleChange('preferred_installation_date', e.target.value)}
              min={minDate}
              max={maxDateStr}
            />
            <p className="text-xs text-gray-500">
              We'll try to accommodate your preferred date (subject to technician availability)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_preference">
              Preferred Contact Method
            </Label>
            <Select
              value={details.contact_preference}
              onValueChange={(value: any) => handleChange('contact_preference', value)}
            >
              <SelectTrigger id="contact_preference">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone Call</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="marketing_opt_in"
                checked={details.marketing_opt_in}
                onCheckedChange={(checked) => handleChange('marketing_opt_in', checked)}
              />
              <Label
                htmlFor="marketing_opt_in"
                className="text-sm font-normal leading-relaxed cursor-pointer"
              >
                I'd like to receive updates about special offers, new products, and CircleTel news
              </Label>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="whatsapp_opt_in"
                checked={details.whatsapp_opt_in}
                onCheckedChange={(checked) => handleChange('whatsapp_opt_in', checked)}
              />
              <Label
                htmlFor="whatsapp_opt_in"
                className="text-sm font-normal leading-relaxed cursor-pointer"
              >
                I consent to receive order updates and support via WhatsApp
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Text */}
      <div className="text-sm text-gray-500 text-center">
        <p>All fields marked with <span className="text-red-500">*</span> are required</p>
        <p className="mt-1">Your information is secure and will only be used for order processing</p>
      </div>
    </div>
  );
}
