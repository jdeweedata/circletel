'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import {
  Building2,
  MapPin,
  Radio,
  CheckCircle,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';

interface LicensedWirelessLeadCaptureProps {
  address: string;
  latitude?: number;
  longitude?: number;
  leadId?: string;
}

export function LicensedWirelessLeadCapture({
  address,
  latitude,
  longitude,
  leadId
}: LicensedWirelessLeadCaptureProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    businessType: 'enterprise' as 'smme' | 'enterprise',
    requirements: '',
    serviceAddress: address,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/leads/licensed-wireless', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          serviceAddress: address,
          coordinates: latitude && longitude ? { lat: latitude, lng: longitude } : null,
          coverageLeadId: leadId,
          serviceType: 'licensed_wireless',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setSubmitted(true);
      toast.success('Quote request submitted successfully!');
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Quote Request Submitted
        </h2>
        <p className="text-gray-600 mb-6">
          Thank you for your interest in our Point-to-Point Microwave service. Our team will
          contact you within 24 hours to schedule a site survey and provide a custom quote.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900">
            <strong>Next Steps:</strong>
          </p>
          <ol className="text-sm text-blue-800 mt-2 space-y-1 text-left list-decimal list-inside">
            <li>Site survey will be scheduled at your location</li>
            <li>Feasibility assessment will be conducted</li>
            <li>Custom quote will be provided based on your requirements</li>
            <li>Installation timeline will be discussed</li>
          </ol>
        </div>
        <Button onClick={() => window.location.href = '/'} className="bg-circleTel-orange">
          Return to Home
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Radio className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Point-to-Point Licensed Wireless Available
            </h3>
            <p className="text-gray-700 mb-3">
              Based on your location, you may be eligible for our enterprise-grade Point-to-Point
              Microwave service. This solution requires a site survey and custom feasibility assessment.
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Enterprise-Grade Reliability</p>
                  <p className="text-sm text-gray-600">99.99% uptime SLA</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Dedicated Bandwidth</p>
                  <p className="text-sm text-gray-600">Symmetrical speeds up to 1 Gbps</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Licensed Spectrum</p>
                  <p className="text-sm text-gray-600">Interference-free connection</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Business-Only Service</p>
                  <p className="text-sm text-gray-600">Custom enterprise solutions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Service Address */}
      <Card className="p-6">
        <div className="flex items-center gap-3 text-gray-700 mb-2">
          <MapPin className="w-5 h-5 text-circleTel-orange" />
          <span className="font-semibold">Service Address</span>
        </div>
        <p className="text-gray-900 pl-8">{address}</p>
      </Card>

      {/* Lead Form */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Request a Custom Quote</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Company Name <span className="text-red-600">*</span>
            </Label>
            <Input
              id="companyName"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="ABC Corporation (Pty) Ltd"
            />
          </div>

          {/* Contact Person */}
          <div className="space-y-2">
            <Label htmlFor="contactPerson">
              Contact Person <span className="text-red-600">*</span>
            </Label>
            <Input
              id="contactPerson"
              required
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              placeholder="John Smith"
            />
          </div>

          {/* Email & Phone */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email <span className="text-red-600">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@company.co.za"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone <span className="text-red-600">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0821234567"
              />
            </div>
          </div>

          {/* Business Type */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Business Type <span className="text-red-600">*</span>
            </Label>
            <RadioGroup
              value={formData.businessType}
              onValueChange={(value) => setFormData({ ...formData, businessType: value as 'smme' | 'enterprise' })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="smme" id="smme" />
                <Label htmlFor="smme" className="font-normal cursor-pointer">
                  SMME (Small, Medium, Micro Enterprise)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="enterprise" id="enterprise" />
                <Label htmlFor="enterprise" className="font-normal cursor-pointer">
                  Enterprise (Large Corporation)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Requirements */}
          <div className="space-y-2">
            <Label htmlFor="requirements">
              Additional Requirements or Questions
            </Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              placeholder="Please provide any additional details about your connectivity requirements, expected bandwidth needs, or specific questions..."
              rows={4}
            />
          </div>

          {/* Info Box */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Important Information:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Site survey required before final quote</li>
                  <li>Feasibility assessment takes 3-5 business days</li>
                  <li>Installation timeline varies based on requirements</li>
                  <li>Pricing is customized based on bandwidth and distance</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-circleTel-orange hover:bg-orange-600 text-white font-bold py-3"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting Request...
              </>
            ) : (
              <>
                Request Custom Quote
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
