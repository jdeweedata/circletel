'use client';

import { useState } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, Mail, Phone, MapPin, User, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CustomerType, CreateCoverageLeadInput } from '@/lib/types/customer-journey';

interface NoCoverageLeadFormProps {
  address: string;
  coordinates?: { lat: number; lng: number };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function NoCoverageLeadForm({
  address,
  coordinates,
  onSuccess,
  onCancel,
}: NoCoverageLeadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    customer_type: 'consumer' as CustomerType,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    service_interest: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const leadInput: CreateCoverageLeadInput = {
        customer_type: formData.customer_type,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        company_name: formData.company_name || undefined,
        address: address,
        coordinates: coordinates,
        status: 'new',
        lead_source: 'coverage_checker',
        service_interest: formData.service_interest || undefined,
        preferred_contact_method: 'email',
      };

      const response = await fetch('/api/coverage/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadInput),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit lead');
      }

      const result = await response.json();

      setIsSuccess(true);
      toast.success('Thanks! We\'ll notify you when service is available');

      // Wait 2 seconds to show success message, then call onSuccess
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
    } catch (error) {
      console.error('Lead capture failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-900 mb-2">
                You&apos;re on the list!
              </h3>
              <p className="text-green-700">
                We&apos;ll send you an email at <strong>{formData.email}</strong> as soon as service becomes available in your area.
              </p>
              <p className="text-sm text-green-600 mt-2">
                Expected timeline: 2-4 weeks
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-circleTel-orange" />
          Get Notified When Available
        </CardTitle>
        <CardDescription>
          We&apos;re rapidly expanding our network. Leave your details and we&apos;ll notify you as soon as we can connect your location.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Type */}
          <div className="space-y-2">
            <Label htmlFor="customer_type">I am a</Label>
            <Select
              value={formData.customer_type}
              onValueChange={(value) =>
                setFormData({ ...formData, customer_type: value as CustomerType })
              }
            >
              <SelectTrigger id="customer_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consumer">Home User</SelectItem>
                <SelectItem value="smme">Small/Medium Business</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Company Name (conditional) */}
          {formData.customer_type !== 'consumer' && (
            <div className="space-y-2">
              <Label htmlFor="company_name">
                <Building2 className="w-4 h-4 inline mr-1" />
                Company Name
              </Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) =>
                  setFormData({ ...formData, company_name: e.target.value })
                }
                placeholder="Your company name"
                required={formData.customer_type !== 'consumer'}
              />
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                <User className="w-4 h-4 inline mr-1" />
                First Name
              </Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                placeholder="John"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                placeholder="Smith"
                required
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-2">
            <Label htmlFor="email">
              <Mail className="w-4 h-4 inline mr-1" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              <Phone className="w-4 h-4 inline mr-1" />
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="082 123 4567"
              required
            />
          </div>

          {/* Address (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="address">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </Label>
            <Input
              id="address"
              value={address}
              readOnly
              className="bg-gray-50"
            />
          </div>

          {/* Service Interest */}
          <div className="space-y-2">
            <Label htmlFor="service_interest">What service are you interested in?</Label>
            <Textarea
              id="service_interest"
              value={formData.service_interest}
              onChange={(e) =>
                setFormData({ ...formData, service_interest: e.target.value })
              }
              placeholder="e.g., Home fibre 100Mbps, Business connectivity, Wireless backup"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-circleTel-orange hover:bg-circleTel-orange/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Notify Me'
              )}
            </Button>
          </div>

          {/* Privacy Notice */}
          <p className="text-xs text-gray-500 text-center">
            By submitting, you agree to receive updates about service availability. We respect your privacy and won&apos;t spam you.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
