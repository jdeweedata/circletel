'use client';

/**
 * No Coverage Lead Capture Component
 * Shown when no packages are available at a user's address
 * Captures contact info for future expansion opportunities
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Bell, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface NoCoverageLeadCaptureProps {
  address: string;
  latitude?: number;
  longitude?: number;
}

export function NoCoverageLeadCapture({ address, latitude, longitude }: NoCoverageLeadCaptureProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    service_type: 'any',
    expected_usage: 'moderate',
    budget_range: '500_1000',
    urgency: 'medium',
    notes: '',
    marketing_consent: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.full_name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/leads/no-coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          address,
          latitude,
          longitude,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit');
      }

      setIsSubmitted(true);
      toast.success('Thank you! We\'ll notify you when service is available.');
    } catch (error) {
      console.error('Failed to submit lead:', error);
      toast.error('Failed to submit. Please try again or contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="border-green-200 bg-green-50/30">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-green-900 mb-3">
            Thank You for Your Interest!
          </h3>
          <p className="text-green-800 max-w-md mx-auto mb-6">
            We've registered your interest and will notify you as soon as CircleTel services become available in your area.
          </p>
          <div className="flex justify-center gap-3">
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="border-green-300 hover:bg-green-50"
            >
              Back to Home
            </Button>
            <Button
              onClick={() => window.location.href = '/contact'}
              className="bg-green-600 hover:bg-green-700"
            >
              Contact Us
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50/30 to-orange-50/20">
      <CardHeader className="text-center pb-6">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
            <MapPin className="h-8 w-8 text-amber-600" />
          </div>
        </div>
        <CardTitle className="text-2xl text-gray-900">
          No Coverage Available Yet
        </CardTitle>
        <CardDescription className="text-base text-gray-600 max-w-xl mx-auto">
          We don't currently offer service at <span className="font-semibold">{address}</span>, but we're expanding!
          Leave your details and we'll notify you when coverage becomes available.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Alert className="mb-6 border-blue-200 bg-blue-50/50">
          <Bell className="h-5 w-5 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <span className="font-semibold">Be the first to know!</span> We're actively expanding our network.
            Get priority access when we launch in your area.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-circleTel-orange text-white text-sm">
                1
              </span>
              Contact Information
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="full_name"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                  className="border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="border-gray-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+27 82 123 4567"
                className="border-gray-300"
              />
            </div>
          </div>

          {/* Service Preferences */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-circleTel-orange text-white text-sm">
                2
              </span>
              Service Preferences
            </h3>

            <div className="space-y-2">
              <Label>Interested in:</Label>
              <RadioGroup
                value={formData.service_type}
                onValueChange={(value) => setFormData({ ...formData, service_type: value })}
                className="grid grid-cols-2 md:grid-cols-4 gap-3"
              >
                <Label
                  htmlFor="service-fibre"
                  className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                >
                  <RadioGroupItem value="fibre" id="service-fibre" />
                  <span className="text-sm">Fibre</span>
                </Label>
                <Label
                  htmlFor="service-lte"
                  className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                >
                  <RadioGroupItem value="lte" id="service-lte" />
                  <span className="text-sm">LTE</span>
                </Label>
                <Label
                  htmlFor="service-5g"
                  className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                >
                  <RadioGroupItem value="5g" id="service-5g" />
                  <span className="text-sm">5G</span>
                </Label>
                <Label
                  htmlFor="service-any"
                  className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                >
                  <RadioGroupItem value="any" id="service-any" />
                  <span className="text-sm">Any</span>
                </Label>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Monthly Budget:</Label>
              <RadioGroup
                value={formData.budget_range}
                onValueChange={(value) => setFormData({ ...formData, budget_range: value })}
                className="grid grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="budget-under-500"
                  className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                >
                  <RadioGroupItem value="under_500" id="budget-under-500" />
                  <span className="text-sm">Under R500</span>
                </Label>
                <Label
                  htmlFor="budget-500-1000"
                  className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                >
                  <RadioGroupItem value="500_1000" id="budget-500-1000" />
                  <span className="text-sm">R500 - R1,000</span>
                </Label>
                <Label
                  htmlFor="budget-1000-2000"
                  className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                >
                  <RadioGroupItem value="1000_2000" id="budget-1000-2000" />
                  <span className="text-sm">R1,000 - R2,000</span>
                </Label>
                <Label
                  htmlFor="budget-over-2000"
                  className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                >
                  <RadioGroupItem value="over_2000" id="budget-over-2000" />
                  <span className="text-sm">Over R2,000</span>
                </Label>
              </RadioGroup>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-circleTel-orange text-white text-sm">
                3
              </span>
              Additional Details (Optional)
            </h3>

            <div className="space-y-2">
              <Label htmlFor="notes">Any specific requirements or questions?</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="E.g., need business-grade service, prefer wireless backup, etc."
                className="border-gray-300 min-h-[100px]"
              />
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="marketing_consent"
                checked={formData.marketing_consent}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, marketing_consent: checked as boolean })
                }
              />
              <Label
                htmlFor="marketing_consent"
                className="text-sm text-gray-600 font-normal cursor-pointer"
              >
                I'd like to receive updates about CircleTel services, promotions, and news
              </Label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 text-base bg-circleTel-orange hover:bg-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Bell className="h-5 w-5 mr-2" />
                  Notify Me When Available
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-3">
              By submitting, you agree to our{' '}
              <a href="/privacy" className="underline hover:text-gray-700">
                Privacy Policy
              </a>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
