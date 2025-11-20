'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import type { CreateQuoteRequest, CreateQuoteItemRequest } from '@/lib/quotes/types';
import { PaymentConsentCheckboxes, type B2BConsents } from '@/components/payments/PaymentConsentCheckboxes';
import { validateConsents } from '@/lib/constants/policy-versions';

interface BusinessQuoteRequestFormProps {
  leadId: string;
  serviceAddress: string;
  availablePackages: Array<{
    id: string;
    name: string;
    service_type: string;
    product_category: string;
    price: number;
    installation_fee: number;
    speed_down: number;
    speed_up: number;
    data_cap_gb: number | null;
  }>;
  onSuccess?: (quoteId: string) => void;
}

export default function BusinessQuoteRequestForm({
  leadId,
  serviceAddress,
  availablePackages,
  onSuccess
}: BusinessQuoteRequestFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [customerType, setCustomerType] = useState<'smme' | 'enterprise'>('smme');
  const [companyName, setCompanyName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contractTerm, setContractTerm] = useState<12 | 24 | 36>(24);
  const [customerNotes, setCustomerNotes] = useState('');

  const [items, setItems] = useState<CreateQuoteItemRequest[]>([
    {
      package_id: '',
      item_type: 'primary',
      quantity: 1,
      notes: ''
    }
  ]);

  const [consents, setConsents] = useState<B2BConsents>({
    terms: false,
    privacy: false,
    paymentTerms: false,
    refundPolicy: false,
    dataProcessing: false,
    thirdPartyDisclosure: false,
    businessVerification: false,
    marketing: false,
  });

  const [consentErrors, setConsentErrors] = useState<string[]>([]);

  const addItem = () => {
    const newItemType = items.length === 0 ? 'primary' : items.length === 1 ? 'secondary' : 'additional';
    setItems([...items, {
      package_id: '',
      item_type: newItemType,
      quantity: 1,
      notes: ''
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof CreateQuoteItemRequest, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleConsentChange = (newConsents: B2BConsents) => {
    setConsents(newConsents);
    // Clear consent errors when user makes changes
    if (consentErrors.length > 0) {
      setConsentErrors([]);
    }
  };

  const validateForm = (): string | null => {
    if (!companyName.trim()) return 'Company name is required';
    if (!contactName.trim()) return 'Contact name is required';
    if (!contactEmail.trim()) return 'Contact email is required';
    if (!contactPhone.trim()) return 'Contact phone is required';

    if (registrationNumber && !/^\d{4}\/\d{6}\/\d{2}$/.test(registrationNumber)) {
      return 'Registration number must be in format YYYY/NNNNNN/NN';
    }

    if (vatNumber && !/^\d{10}$/.test(vatNumber)) {
      return 'VAT number must be 10 digits';
    }

    if (items.length === 0) return 'At least one service is required';

    for (let i = 0; i < items.length; i++) {
      if (!items[i].package_id) {
        return `Please select a package for service ${i + 1}`;
      }
    }

    // Validate consents
    const consentValidation = validateConsents(consents);
    if (!consentValidation.valid) {
      setConsentErrors(consentValidation.errors);
      return 'Please accept all required legal agreements';
    }

    // B2B-specific consent validation
    if (!consents.dataProcessing) {
      return 'You must authorize data processing for service delivery';
    }
    if (!consents.thirdPartyDisclosure) {
      return 'You must consent to sharing business information with service providers';
    }
    if (!consents.businessVerification) {
      return 'You must confirm authority to bind the company to this agreement';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const request: CreateQuoteRequest = {
        lead_id: leadId,
        customer_type: customerType,
        company_name: companyName,
        registration_number: registrationNumber || undefined,
        vat_number: vatNumber || undefined,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        service_address: serviceAddress,
        coordinates: undefined,
        contract_term: contractTerm,
        customer_notes: customerNotes || undefined,
        items: items.filter(item => item.package_id)
      };

      const response = await fetch('/api/quotes/business/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...request,
          consents: consents
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create quote');
      }

      setSuccess(true);
      if (onSuccess) {
        onSuccess(data.quote.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit quote request');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
            <h2 className="text-2xl font-bold text-circleTel-darkNeutral">Quote Request Submitted!</h2>
            <p className="text-circleTel-secondaryNeutral">
              Your business quote request has been submitted successfully. Our team will review your request and send you a detailed quote within 24 hours.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Business Quote Request</CardTitle>
          <CardDescription>
            Complete this form to request a customized business quote for {serviceAddress}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Type */}
          <div className="space-y-2">
            <Label htmlFor="customer-type">Business Type</Label>
            <select
              id="customer-type"
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value as 'smme' | 'enterprise')}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="smme">SMME (Small/Medium Business)</option>
              <option value="enterprise">Enterprise (Large Business)</option>
            </select>
          </div>

          {/* Company Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name *</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="ABC Corporation (Pty) Ltd"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration-number">Registration Number</Label>
              <Input
                id="registration-number"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="2020/123456/07"
              />
              <p className="text-xs text-circleTel-secondaryNeutral">Format: YYYY/NNNNNN/NN</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vat-number">VAT Number</Label>
              <Input
                id="vat-number"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                placeholder="4123456789"
                maxLength={10}
              />
              <p className="text-xs text-circleTel-secondaryNeutral">10 digits</p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Contact Person *</Label>
              <Input
                id="contact-name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="John Smith"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-email">Email Address *</Label>
              <Input
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="john@company.co.za"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone Number *</Label>
              <Input
                id="contact-phone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="0123456789 or +27123456789"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract-term">Contract Term *</Label>
              <select
                id="contract-term"
                value={contractTerm}
                onChange={(e) => setContractTerm(parseInt(e.target.value) as 12 | 24 | 36)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value={12}>12 Months</option>
                <option value={24}>24 Months (Recommended)</option>
                <option value={36}>36 Months</option>
              </select>
            </div>
          </div>

          {/* Service Address */}
          <div className="space-y-2">
            <Label>Service Address</Label>
            <div className="px-4 py-3 bg-circleTel-lightNeutral rounded-md">
              <p className="text-sm text-circleTel-darkNeutral">{serviceAddress}</p>
            </div>
          </div>

          {/* Service Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Services Required *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                disabled={items.length >= 10}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            </div>

            {items.map((item, index) => (
              <Card key={index} className="relative">
                <CardContent className="pt-6 space-y-4">
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}

                  <div className="space-y-2">
                    <Label>Service Type</Label>
                    <select
                      value={item.item_type}
                      onChange={(e) => updateItem(index, 'item_type', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="primary">Primary Service</option>
                      <option value="secondary">Secondary/Backup Service</option>
                      <option value="additional">Additional Service</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Package *</Label>
                    <select
                      value={item.package_id}
                      onChange={(e) => updateItem(index, 'package_id', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    >
                      <option value="">Select a package...</option>
                      {availablePackages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} - R{pkg.price}/month ({pkg.speed_down}Mbps down / {pkg.speed_up}Mbps up)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      value={item.notes}
                      onChange={(e) => updateItem(index, 'notes', e.target.value)}
                      placeholder="Any specific requirements for this service..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Customer Notes */}
          <div className="space-y-2">
            <Label htmlFor="customer-notes">Additional Notes (Optional)</Label>
            <Textarea
              id="customer-notes"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Any additional information or requirements..."
              rows={4}
            />
          </div>

          {/* Legal Consents - B2B Enhanced */}
          <div className="pt-6 border-t">
            <PaymentConsentCheckboxes
              consents={consents}
              onConsentChange={handleConsentChange}
              variant="b2b"
              showMarketing={true}
              errors={consentErrors}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full bg-circleTel-orange hover:bg-[#e67516]"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Quote Request'
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
