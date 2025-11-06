'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Save, X, Plus, Trash2 } from 'lucide-react';
import type { QuoteDetails, BusinessQuoteItem } from '@/lib/quotes/types';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditQuotePage({ params }: Props) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Quote fields
  const [quote, setQuote] = useState<QuoteDetails | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [serviceAddress, setServiceAddress] = useState('');
  const [contractTerm, setContractTerm] = useState(12);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<BusinessQuoteItem[]>([]);

  useEffect(() => {
    fetchQuote();
  }, [resolvedParams.id]);

  const fetchQuote = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/quotes/business/${resolvedParams.id}`);
      const data = await response.json();

      if (data.success && data.quote) {
        const q = data.quote;
        setQuote(q);
        setCompanyName(q.company_name || '');
        setRegistrationNumber(q.registration_number || '');
        setVatNumber(q.vat_number || '');
        setContactName(q.contact_name || '');
        setContactEmail(q.contact_email || '');
        setContactPhone(q.contact_phone || '');
        setServiceAddress(q.service_address || '');
        setContractTerm(q.contract_term || 12);
        setNotes(q.notes || '');
        setItems(q.items || []);
      } else {
        setError(data.error || 'Failed to load quote');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load quote');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!quote) return;

    // Validation
    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }
    if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      setError('Contact details are required');
      return;
    }
    if (!serviceAddress.trim()) {
      setError('Service address is required');
      return;
    }
    if (items.length === 0) {
      setError('At least one service item is required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/quotes/business/${quote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          registration_number: registrationNumber || null,
          vat_number: vatNumber || null,
          contact_name: contactName,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          service_address: serviceAddress,
          contract_term: contractTerm,
          notes: notes || null,
          items: items.map((item, index) => ({
            id: item.id,
            quantity: item.quantity,
            monthly_price: item.monthly_price,
            installation_price: item.installation_price,
            notes: item.notes,
            display_order: index
          }))
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Quote updated successfully!');
        setTimeout(() => {
          router.push(`/admin/quotes/${quote.id}`);
        }, 1500);
      } else {
        setError(data.error || 'Failed to update quote');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update quote');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (quote) {
      router.push(`/admin/quotes/${quote.id}`);
    } else {
      router.push('/admin/quotes');
    }
  };

  const updateItem = (index: number, field: keyof BusinessQuoteItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>Quote not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check if quote can be edited
  const canEdit = ['draft', 'pending_approval', 'approved', 'sent', 'viewed'].includes(quote.status);

  if (!canEdit) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>
            This quote cannot be edited in its current status ({quote.status}).
            Only draft, pending_approval, approved, sent, and viewed quotes can be edited.
          </AlertDescription>
        </Alert>
        <Button onClick={handleCancel} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quote
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-circleTel-darkNeutral">
              Edit Quote: {quote.quote_number}
            </h1>
            <p className="text-circleTel-secondaryNeutral mt-1">
              Modify quote details before finalizing
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-circleTel-orange hover:bg-[#e67516]"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-500 text-green-700">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Business and registration details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
              />
            </div>

            <div>
              <Label htmlFor="registrationNumber">Registration Number</Label>
              <Input
                id="registrationNumber"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="e.g., 2020/123456/07"
              />
            </div>

            <div>
              <Label htmlFor="vatNumber">VAT Number</Label>
              <Input
                id="vatNumber"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                placeholder="e.g., 4123456789"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Primary contact person details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contactName">Contact Name *</Label>
              <Input
                id="contactName"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Enter contact name"
              />
            </div>

            <div>
              <Label htmlFor="contactEmail">Email *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="email@company.com"
              />
            </div>

            <div>
              <Label htmlFor="contactPhone">Phone *</Label>
              <Input
                id="contactPhone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="e.g., 011 234 5678"
              />
            </div>
          </CardContent>
        </Card>

        {/* Service Address */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Service Address</CardTitle>
            <CardDescription>Installation location</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="serviceAddress">Address *</Label>
              <Input
                id="serviceAddress"
                value={serviceAddress}
                onChange={(e) => setServiceAddress(e.target.value)}
                placeholder="Enter full service address"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contract Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Contract Details</CardTitle>
            <CardDescription>Term and additional notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contractTerm">Contract Term (months) *</Label>
                <Select
                  value={contractTerm.toString()}
                  onValueChange={(value) => setContractTerm(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12 months</SelectItem>
                    <SelectItem value="24">24 months</SelectItem>
                    <SelectItem value="36">36 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special requirements, custom terms, etc."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Service Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Service Items ({items.length})</CardTitle>
            <CardDescription>Packages and products included in this quote</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.service_name}</h4>
                    <p className="text-sm text-gray-500">
                      {item.speed_down}Mbps ↓ / {item.speed_up}Mbps ↑
                      {item.data_cap_gb ? ` • ${item.data_cap_gb}GB` : ' • Unlimited'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div>
                    <Label>Monthly Price (R)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.monthly_price}
                      onChange={(e) => updateItem(index, 'monthly_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div>
                    <Label>Installation (R)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.installation_price}
                      onChange={(e) => updateItem(index, 'installation_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div>
                    <Label>Total Monthly</Label>
                    <Input
                      value={`R ${(item.monthly_price * item.quantity).toFixed(2)}`}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <Label>Item Notes</Label>
                  <Input
                    value={item.notes || ''}
                    onChange={(e) => updateItem(index, 'notes', e.target.value)}
                    placeholder="Optional notes for this item"
                  />
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No services added yet</p>
                <p className="text-sm">Note: Adding new services not available in edit mode</p>
                <p className="text-sm">Please create a new quote to add services</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons (Bottom) */}
      <div className="mt-6 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-circleTel-orange hover:bg-[#e67516]"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
